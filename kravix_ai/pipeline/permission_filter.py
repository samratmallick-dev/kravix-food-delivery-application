from typing import List

class PermissionFilter:
    @staticmethod
    def is_allowed(role: str, roles_allowed: List[str]) -> bool:
        """
        Check if the given role is permitted to access the document.
        Roles might be 'customer', 'seller', 'rider', 'admin'.
        If 'all' is in roles_allowed, it's public.
        """
        if not roles_allowed:
            return False
            
        roles_allowed_lower = [r.lower() for r in roles_allowed]
        if "all" in roles_allowed_lower:
            return True
            
        role_lower = role.lower().strip()
        return role_lower in roles_allowed_lower
