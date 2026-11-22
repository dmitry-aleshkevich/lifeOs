# list (and with --rm, remove) top-level functions never referenced anywhere
import re, sys, pathlib
from tools_fn import span
fs = sorted(pathlib.Path('src/js').glob('*.js'))
removed_any = True; total = []
while removed_any:
    removed_any = False
    allsrc = ''.join(f.read_text('utf8') for f in fs) + pathlib.Path('src/shell.html').read_text('utf8')
    names = re.findall(r'\n  function ([A-Za-z_$][\w$]*)\(', allsrc)
    for n in names:
        if len(re.findall(r'(?<![\w$.])' + re.escape(n) + r'(?![\w$])', allsrc)) == 1:
            total.append(n)
            if '--rm' in sys.argv:
                for f in fs:
                    s = f.read_text('utf8'); sp = span(s, n)
                    if sp: f.write_text(s[:sp[0]].rstrip(' ') + s[sp[1]:].lstrip('\n'), 'utf8'); removed_any = True; break
                break
print(len(total), total)
