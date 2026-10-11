from pathlib import Path
import shutil
root=Path(__file__).resolve().parent.parent
for source_dir in (root/'android-icons').glob('mipmap-*'):
    target=root/'android'/'app'/'src'/'main'/'res'/source_dir.name
    if not target.is_dir():
        print('Skipping icon folder:',target)
        continue
    for icon in source_dir.glob('*.png'):
        shutil.copy2(icon,target/icon.name)
        print('Applied:',target/icon.name)
