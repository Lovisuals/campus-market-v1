import subprocess
import sys
import os

# First, try to extract using built-in zip support in Python
print("=" * 60)
print("EXTRACTING FILES FROM ZIP ARCHIVE")
print("=" * 60)

os.chdir(r"c:\Users\Dell\Documents\campusmarketp2p\campus-market-v1")

zip_path = "files.zip"
extract_path = "."

try:
    import zipfile
    
    print(f"\nOpening archive: {zip_path}")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        file_list = zip_ref.namelist()
        print(f"Archive contains {len(file_list)} items\n")
        
        print("First 20 items in archive:")
        for name in file_list[:20]:
            print(f"  {name}")
        
        if len(file_list) > 20:
            print(f"  ... and {len(file_list) - 20} more items\n")
        
        print("Extracting all files...")
        zip_ref.extractall(extract_path)
        print("✓ Extraction complete!\n")
        
        print("Files extracted:")
        for name in file_list[:30]:
            full_path = os.path.join(extract_path, name)
            if os.path.exists(full_path):
                if os.path.isdir(full_path):
                    print(f"  [DIR]  {name}")
                else:
                    size = os.path.getsize(full_path)
                    print(f"  [FILE] {name} ({size} bytes)")
    
    print("\n" + "=" * 60)
    print("SUCCESS: All files extracted")
    print("=" * 60)
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
