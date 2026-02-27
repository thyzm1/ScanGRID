import os

files_to_fix = [
    "/Users/mathisdupont/ScanGRID/front/src/components/BOMGenerator.tsx",
    "/Users/mathisdupont/ScanGRID/front/src/components/ProjectManager.tsx",
    "/Users/mathisdupont/ScanGRID/front/src/components/BOMImport.tsx"
]

for file_path in files_to_fix:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix mobile layout (flex-col-reverse) for the main grid
    content = content.replace(
        'className="grid grid-cols-1 lg:grid-cols-3 gap-4"',
        'className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-4"'
    )
    
    # 2. Standardize button & input heights
    # We replace py-2.5 with py-2 to match the px-3 py-2 standard used in ProjectManager and other places.
    content = content.replace('py-2.5', 'py-2')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
