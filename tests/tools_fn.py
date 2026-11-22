# helper: find/remove top-level `  function NAME(` blocks in src/js by brace matching
import sys, re, pathlib
def span(s, name):
    m = re.search(r'\n  function ' + re.escape(name) + r'\(', s)
    if not m: return None
    k = m.end() - 1; pd = 0
    while True:
        if s[k] == '(': pd += 1
        elif s[k] == ')':
            pd -= 1
            if pd == 0: break
        k += 1
    i = s.index('{', k); depth = 0; j = i; q = None
    while j < len(s):
        c = s[j]
        if q:
            if c == '\\': j += 1
            elif c == q: q = None
            elif q == '`' and c == '$' and s[j+1] == '{': pass
        elif c in '"\'`': q = c
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return m.start() + 1, j + 1
        j += 1
if __name__ == '__main__':
    cmd, name = sys.argv[1], sys.argv[2]
    for f in sorted(pathlib.Path('src/js').glob('*.js')):
        s = f.read_text('utf8'); sp = span(s, name)
        if not sp: continue
        if cmd == 'show': print(f, s[sp[0]:sp[1]][:300], '...', s.count('\n', sp[0], sp[1]), 'lines')
        if cmd == 'rm': f.write_text(s[:sp[0]] + s[sp[1]:].lstrip('\n').join(['','']) if False else s[:sp[0]].rstrip(' ') + s[sp[1]:].lstrip('\n'), 'utf8'); print('removed', name, 'from', f)
