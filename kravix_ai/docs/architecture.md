# Kravix AI: Architecture & Training Documentation

## 1. Architecture Overview
Kravix AI is a production-grade NLP support microservice. To comply with Render Free memory constraints and provide 2-5s latency, it operates on a **Hybrid NLP Engine** built in FastAPI.

### Modules:
- `app/api`: FastAPI routes (Chat, Health, Feedback)
- `app/core`: Configuration, timeout, and concurrency guards
- `app/nlp`: Hybrid Intent Classifier (RapidFuzz), Entity Extractor, and Anaphoric Resolver
- `app/dispatchers`: Role-based dispatching logic (Customer, Seller, Rider, Admin)
- `app/models`: Strict Pydantic schemas validating I/O

## 2. Intent Classification
The `HybridIntentClassifier` prevents greedy matching. Strict commands utilize regex boundaries with negative lookaheads (e.g. `\btrack(?!.*\bearning\b)`). Transliterations and typos use `RapidFuzz` partial ratios (threshold >75%).

## 3. Training & ML Pipeline
- **Dataset Generation**: `ml/dataset/generator.py` uses combinatorial iteration to generate 50,000+ instruction/response pairs, including Bengali and edge cases.
- **LoRA Training**: `ml/training/pipeline.py` deduplicates dataset items and orchestrates Unsloth LoRA fine-tuning.
- **Feedback**: Positive feedback (`feedback=1`) is automatically ingested by `ml/feedback/processor.py` for continuous learning.

## 4. Evaluation
Run the test suites to ensure intent accuracy and avoid regressions:
```bash
pytest tests/
python ml/evaluation/suite.py
```
