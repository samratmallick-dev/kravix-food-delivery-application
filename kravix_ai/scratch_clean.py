import json
import glob
import os

datasets_path = r"d:\Web Devolopment\kravix-online-food-dellivery-application\kravix_ai\datasets\*.json"
files = glob.glob(datasets_path)

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'data' not in data:
        continue

    global_seen = set()
    changed = False

    for item in data.get('data', []):
        if 'aliases' in item:
            new_aliases = []
            for alias in item['aliases']:
                lower_alias = alias.lower()
                if lower_alias not in global_seen:
                    global_seen.add(lower_alias)
                    new_aliases.append(alias)
                else:
                    print(f"Duplicate found and removed: '{alias}' in {item.get('id')} in {os.path.basename(path)}")
                    changed = True
            item['aliases'] = new_aliases

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            print(f"Saved cleaned {os.path.basename(path)}")
