import sys, os
from PIL import Image, ImageChops
a_, b_ = sys.argv[1], sys.argv[2]; bad = 0
for f in sorted(os.listdir(a_)):
    a = Image.open(f'{a_}/{f}').convert('RGB'); b = Image.open(f'{b_}/{f}').convert('RGB')
    if a.size != b.size: print(f, 'SIZE', a.size, b.size); bad = 1; continue
    d = ImageChops.difference(a, b).getbbox()
    if d: print(f, 'DIFF', d); bad = 1
print('identical' if not bad else 'differs')
