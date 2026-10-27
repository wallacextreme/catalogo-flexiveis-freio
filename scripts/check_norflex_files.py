import os

norflex_dir = 'public/catalog-images/norflex'
files = os.listdir(norflex_dir)

high_res_files = [f for f in files if os.path.getsize(os.path.join(norflex_dir, f)) >= 8000]
print(f"Total files in norflex_dir: {len(files)}")
print(f"Files >= 8KB: {len(high_res_files)}")
print(f"Sample high-res filenames: {high_res_files[:30]}")
