import os
import re

src_dir = 'OpenKanban/src'
export_re = re.compile(r'export (const|function|interface|type|enum|class|default function|default class) ([a-zA-Z0-9_]+)')

all_files = []
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            all_files.append(os.path.join(root, file))

exports = []
for file_path in all_files:
    with open(file_path, 'r', errors='ignore') as f:
        content = f.read()
        # Find named exports
        matches = re.findall(r'export (?:const|function|interface|type|enum|class) ([a-zA-Z0-9_]+)', content)
        for name in matches:
            exports.append((name, file_path))
        
        # Find default exports (named)
        default_match = re.search(r'export default (?:function|class) ([a-zA-Z0-9_]+)', content)
        if default_match:
            exports.append((default_match.group(1), file_path))

unused_exports = []
for name, file_path in exports:
    is_used = False
    # Next.js special names
    if name in ['metadata', 'viewport', 'config', 'generateStaticParams']:
        continue
        
    for other_file in all_files:
        if other_file == file_path:
            continue
        with open(other_file, 'r', errors='ignore') as f:
            if name in f.read():
                is_used = True
                break
    if not is_used:
        unused_exports.append((name, file_path))

for name, file_path in unused_exports:
    print(f"UNUSED EXPORT: {name} in {file_path}")

