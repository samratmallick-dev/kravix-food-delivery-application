from typing import Dict, Any

class DatasetValidationError(Exception):
    pass

class DatasetValidator:
    """Validates datasets against critical schema rules before indexing."""
    
    REQUIRED_ROOT_KEYS = {"version", "updatedAt", "schemaVersion", "data"}
    REQUIRED_ENTRY_KEYS = {"id", "domain", "content", "roles_allowed"}
    
    @staticmethod
    def validate(dataset_name: str, dataset: Dict[str, Any]) -> None:
        if not isinstance(dataset, dict):
            raise DatasetValidationError(f"[{dataset_name}] Dataset must be a JSON object.")
        
        for key in DatasetValidator.REQUIRED_ROOT_KEYS:
            if key not in dataset:
                raise DatasetValidationError(f"[{dataset_name}] Missing required root key: {key}")
                
        data = dataset.get("data", [])
        if not isinstance(data, list):
            raise DatasetValidationError(f"[{dataset_name}] 'data' field must be a list.")
            
        seen_ids = set()
        seen_aliases = set()
        
        for i, entry in enumerate(data):
            if not isinstance(entry, dict):
                raise DatasetValidationError(f"[{dataset_name}] Entry at index {i} is not an object.")
                
            for req_key in DatasetValidator.REQUIRED_ENTRY_KEYS:
                if req_key not in entry:
                    raise DatasetValidationError(f"[{dataset_name}] Entry {i} missing key: {req_key}")
                    
            entry_id = entry["id"]
            if entry_id in seen_ids:
                raise DatasetValidationError(f"[{dataset_name}] Duplicate ID found: {entry_id}")
            seen_ids.add(entry_id)
            
            aliases = entry.get("aliases", [])
            if not isinstance(aliases, list):
                raise DatasetValidationError(f"[{dataset_name}] 'aliases' must be a list for ID {entry_id}.")
                
            roles = entry.get("roles_allowed", [])
            if not isinstance(roles, list) or not roles:
                raise DatasetValidationError(f"[{dataset_name}] 'roles_allowed' must be a non-empty list for ID {entry_id}.")
                
            for alias in aliases:
                alias_lower = alias.lower()
                if alias_lower in seen_aliases:
                    raise DatasetValidationError(f"[{dataset_name}] Duplicate alias found across dataset: {alias_lower}")
                seen_aliases.add(alias_lower)
                
            if "translations" in entry and not isinstance(entry["translations"], dict):
                raise DatasetValidationError(f"[{dataset_name}] 'translations' must be a dict for ID {entry_id}.")
