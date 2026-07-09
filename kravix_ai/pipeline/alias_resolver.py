import re
from typing import List, Set

class AliasResolver:
    @staticmethod
    def generate_aliases(base_names: List[str]) -> List[str]:
        """Automatically generate extended aliases from a base list."""
        generated: Set[str] = set()
        
        for name in base_names:
            name_lower = name.lower().strip()
            generated.add(name_lower)
            
            no_punct = re.sub(r'[^\w\s]', '', name_lower)
            generated.add(no_punct)
            
            no_space = name_lower.replace(' ', '')
            generated.add(no_space)
            
            no_punct_no_space = no_punct.replace(' ', '')
            generated.add(no_punct_no_space)
            
            if not name_lower.endswith('s'):
                generated.add(name_lower + 's')
            elif name_lower.endswith('s'):
                generated.add(name_lower[:-1])
                
        additional: Set[str] = set()
        for g in generated:
            if 'v' in g:
                additional.add(g.replace('v', 'bh'))
            if 'bh' in g:
                additional.add(g.replace('bh', 'v'))
            if 'i' in g:
                additional.add(g.replace('i', 'ee'))
                
        generated.update(additional)
        
        return list(generated)
