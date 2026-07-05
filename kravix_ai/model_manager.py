import gc
import os
import time
import asyncio
from datetime import datetime, timezone
from threading import Lock
from typing import Optional, Dict, Any, List
from collections import deque

from structured_logger import get_logger
from circuit_breaker import CircuitBreaker

logger = get_logger("model_manager")

MOCK_MODE = os.environ.get("MOCK_MODE", "false").lower() in ("true", "1", "yes")


_ML_LIBS_AVAILABLE = False
if not MOCK_MODE:
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
        _ML_LIBS_AVAILABLE = torch.cuda.is_available()
        if not _ML_LIBS_AVAILABLE:
            logger.info("CUDA unavailable — ML inference disabled, running MOCK mode")
    except ImportError:
        logger.info("ML libraries not found — running MOCK mode")


class ModelManager:

    _RELOAD_THRESHOLD = 3  

    def __init__(
        self,
        base_model_id: str = "unsloth/llama-3-8b-bnb-4bit",
        lora_path: str = "./kravix_model_lora",
        circuit_breaker: Optional[CircuitBreaker] = None,
        inference_timeout: float = 15.0,
    ) -> None:
        self._base_model_id = base_model_id
        self._lora_path = lora_path
        self._circuit_breaker = circuit_breaker or CircuitBreaker("model")
        self._inference_timeout = inference_timeout

        self._lock = Lock()
        self._model = None
        self._tokenizer = None
        self._model_loaded = False

        self._consecutive_failures = 0
        self._last_success: Optional[datetime] = None
        self._latencies: deque = deque(maxlen=100)
        self._total_inferences = 0
        if _ML_LIBS_AVAILABLE:
            self._load_model()
        else:
            logger.info("Model manager running in MOCK mode (no ML inference)")

    @property
    def ml_available(self) -> bool:
        return self._model_loaded and self._model is not None

    @property
    def circuit(self) -> CircuitBreaker:
        return self._circuit_breaker

    def _load_model(self) -> bool:
        try:
            logger.info("Loading tokenizer: %s", self._base_model_id)
            self._tokenizer = AutoTokenizer.from_pretrained(self._base_model_id)

            logger.info("Loading base model: %s", self._base_model_id)
            base_model = AutoModelForCausalLM.from_pretrained(
                self._base_model_id,
                device_map="cpu",
                torch_dtype=torch.float32,
            )

            logger.info("Applying LoRA weights from: %s", self._lora_path)
            try:
                self._model = PeftModel.from_pretrained(base_model, self._lora_path)
                logger.info("LoRA weights loaded successfully")
            except Exception as exc:
                logger.warning("Could not load LoRA weights (%s) — using base model", exc)
                self._model = base_model

            self._model_loaded = True
            self._consecutive_failures = 0
            self._circuit_breaker.reset()
            return True

        except Exception as exc:
            logger.error("Model loading failed: %s", exc, exc_info=True)
            self._model = None
            self._tokenizer = None
            self._model_loaded = False
            return False

    def _unload_model(self) -> None:
        logger.warning("Unloading model to free memory...")
        self._model = None
        self._tokenizer = None
        self._model_loaded = False
        gc.collect()
        logger.info("Model unloaded, GC completed")

    def reload(self) -> bool:
        if not _ML_LIBS_AVAILABLE:
            return False
        with self._lock:
            self._unload_model()
            success = self._load_model()
            if success:
                logger.info("Model reloaded successfully")
            else:
                logger.error("Model reload FAILED — service continues in MOCK mode")
            return success


    def infer(self, prompt: str, max_new_tokens: int = 300) -> Optional[str]:
        if not self.ml_available:
            return None

        start = time.monotonic()
        try:
            result = self._circuit_breaker.call(self._generate, prompt, max_new_tokens)
            elapsed_ms = (time.monotonic() - start) * 1000

            
            self._consecutive_failures = 0
            self._last_success = datetime.now(timezone.utc)
            self._latencies.append(elapsed_ms)
            self._total_inferences += 1

            logger.info("Inference OK in %.0fms", elapsed_ms)
            return result

        except Exception as exc:
            elapsed_ms = (time.monotonic() - start) * 1000
            self._consecutive_failures += 1
            self._total_inferences += 1
            logger.error(
                "Inference failed (%d consecutive): %s",
                self._consecutive_failures, exc, exc_info=True,
            )

            if self._consecutive_failures >= self._RELOAD_THRESHOLD:
                logger.warning(
                    "Reached %d consecutive failures — triggering model reload",
                    self._consecutive_failures,
                )
                self.reload()

            return None

    def _generate(self, prompt: str, max_new_tokens: int) -> str:
        inputs = self._tokenizer(prompt, return_tensors="pt").to(self._model.device)
        outputs = self._model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.4,
            top_p=0.9,
            do_sample=True,
            pad_token_id=self._tokenizer.eos_token_id,
        )
        input_length = inputs.input_ids.shape[1]
        generated_tokens = outputs[0][input_length:]
        return self._tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()


    def health(self) -> Dict[str, Any]:
        avg_latency = 0.0
        if self._latencies:
            avg_latency = sum(self._latencies) / len(self._latencies)

        return {
            "provider": "LoRA-Local" if _ML_LIBS_AVAILABLE else "Mock",
            "connected": self._model_loaded if _ML_LIBS_AVAILABLE else True,
            "last_success": self._last_success.isoformat() if self._last_success else None,
            "consecutive_failures": self._consecutive_failures,
            "avg_latency_ms": round(avg_latency, 1),
            "total_inferences": self._total_inferences,
        }
