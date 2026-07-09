import os
import json
import logging
from typing import Dict, Any

from .dataset_validator import DatasetValidator, DatasetValidationError

logger = logging.getLogger("dataset_loader")

class DatasetLoader:
    def __init__(self, datasets_dir: str):
        self.datasets_dir = datasets_dir
        self.datasets_cache: Dict[str, Dict[str, Any]] = {}
        self.file_mtimes: Dict[str, float] = {}

    def load_all(self, fail_on_error: bool = True) -> Dict[str, Dict[str, Any]]:
        """Loads all JSON files from the datasets directory."""
        if not os.path.exists(self.datasets_dir):
            os.makedirs(self.datasets_dir, exist_ok=True)
            logger.warning("Datasets directory did not exist. Created %s", self.datasets_dir)
            return {}

        new_cache = {}
        
        for filename in os.listdir(self.datasets_dir):
            if not filename.endswith(".json"):
                continue
                
            filepath = os.path.join(self.datasets_dir, filename)
            mtime = os.path.getmtime(filepath)
            
            if filename in self.datasets_cache and self.file_mtimes.get(filename) == mtime:
                new_cache[filename] = self.datasets_cache[filename]
                continue
                
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                DatasetValidator.validate(filename, data)
                new_cache[filename] = data
                self.file_mtimes[filename] = mtime
                logger.info("Successfully loaded and validated dataset: %s", filename)
            except DatasetValidationError as e:
                logger.error("Validation failed for %s: %s", filename, e)
                if fail_on_error:
                    raise
            except Exception as e:
                logger.error("Failed to load dataset %s: %s", filename, e)
                if fail_on_error:
                    raise
                    
        self.datasets_cache = new_cache
        return self.datasets_cache

    def get_modified_datasets(self) -> Dict[str, Dict[str, Any]]:
        """Check for modified datasets and load them incrementally."""
        if not os.path.exists(self.datasets_dir):
            return {}
            
        modified = {}
        for filename in os.listdir(self.datasets_dir):
            if not filename.endswith(".json"):
                continue
            filepath = os.path.join(self.datasets_dir, filename)
            try:
                mtime = os.path.getmtime(filepath)
                if filename not in self.file_mtimes or self.file_mtimes[filename] < mtime:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    DatasetValidator.validate(filename, data)
                    self.datasets_cache[filename] = data
                    self.file_mtimes[filename] = mtime
                    modified[filename] = data
                    logger.info("Dataset %s was modified and reloaded.", filename)
            except Exception as e:
                logger.error("Error reloading dataset %s: %s", filename, e)
                
        return modified
