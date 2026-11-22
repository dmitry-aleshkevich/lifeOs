# remove CSS rules whose selectors reference only classes/ids absent from JS+HTML
import re, pathlib, sys
src = ''.join(f.read_text('utf8') for f in pathlib.Path('src/js').glob('*.js')) + pathlib.Path('src/shell.html').read_text('utf8')
words = set(re.findall(r'[A-Za-z_][\w-]*', src))
css = pathlib.Path('src/app.css').read_text('utf8')
def alive(sel):
    toks = re.findall(r'[.#]([A-Za-z_][\w-]*)', re.sub(r':not\([^)]*\)', '', sel))
    def ok(t):
        if t in words: return True
        m = re.match(r'^([a-z]+)\d+$', t)
        if m and (m.group(1) + '${') in src: return True
        parts = t.split('-')
        return any((('-'.join(parts[:i]) + '-${') in src or ('-'.join(parts[:i]) + '-" +') in src) for i in range(1, len(parts)))
    return all(ok(t) for t in toks)
out = []; i = 0; dropped = []
def parse(s):
    res = []; i = 0
    while i < len(s):
        j = s.find('{', i)
        if j < 0: res.append(s[i:]); break
        head = s[i:j]; d = 0; k = j
        while True:
            if s[k] == '{': d += 1
            elif s[k] == '}':
                d -= 1
                if d == 0: break
            k += 1
        body = s[j+1:k]
        h = head.strip()
        if h.startswith('@media') or h.startswith('@supports'):
            inner = parse(body)
            if inner.strip(): res.append(head + '{' + inner + '}')
        elif h.startswith('@') or h == '':
            res.append(s[i:k+1])
        else:
            pre = head[:len(head) - len(head.lstrip())]
            sels = [x for x in h.split(',') if alive(x)]
            if sels: res.append(pre + ', '.join(x.strip() for x in sels) + ' {' + body + '}')
            else: dropped.append(h[:70])
        i = k + 1
    return ''.join(res)
new = parse(css)
print(len(dropped), 'rules dropped;', len(css), '->', len(new))
if '--write' in sys.argv: pathlib.Path('src/app.css').write_text(new, 'utf8')
else: print('\n'.join(dropped[:200]))
