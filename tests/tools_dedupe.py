# safe CSS dedupe: within the same context (top level or the same @media), for an identical selector,
# drop declarations of a property that a LATER rule with the same selector sets again (later wins anyway).
# Empty rules are removed. Order of rules is never changed.
import re, sys
css = open('src/app.css', encoding='utf8').read()
def blocks(s):
    out = []; i = 0
    while i < len(s):
        j = s.find('{', i)
        if j < 0: out.append(('raw', s[i:], None)); break
        d = 0; k = j
        while True:
            if s[k] == '{': d += 1
            elif s[k] == '}':
                d -= 1
                if d == 0: break
            k += 1
        out.append(('rule', s[i:j], s[j+1:k])); i = k + 1
    return out
def norm(sel): return ' '.join(re.sub(r'/\*.*?\*/', '', sel, flags=re.S).split())
def decls(body):
    res = []
    for part in body.split(';'):
        if not part.strip(): continue
        m = re.match(r'\s*(/\*.*?\*/\s*)?([\w-]+)\s*:(.*)', part, re.S)
        res.append((m.group(2).lower() if m else None, part))
    return res
removed = 0
def process(s):
    global removed
    bl = blocks(s); seen = {}  # sel -> {prop: important}
    parsed = []
    for kind, pre, body in bl:
        if kind == 'rule' and pre.strip().startswith('@media'): parsed.append(('media', pre, process(body)))
        elif kind == 'rule' and not pre.strip().startswith('@'): parsed.append(('rule', pre, decls(body)))
        else: parsed.append(('at' if kind == 'rule' else kind, pre, body))
    for idx in range(len(parsed) - 1, -1, -1):
        kind, pre, ds = parsed[idx]
        if kind != 'rule': continue
        sel = norm(pre); later = seen.setdefault(sel, {}); keep = []
        for prop, txt in reversed(ds):
            imp = '!important' in txt
            if prop and prop in later and (later[prop] or not imp): removed += 1; continue
            if prop: later[prop] = later.get(prop, False) or imp
            keep.append((prop, txt))
        parsed[idx] = ('rule', pre, list(reversed(keep)))
    out = []
    for kind, pre, ds in parsed:
        if kind == 'rule':
            if not ds: lead = pre[:len(pre) - len(pre.lstrip())]; out.append(lead.rstrip(' ')) if '\n' in lead else None; continue
            out.append(pre + '{' + ';'.join(t for _, t in ds) + (';' if ds else '') + ' }')
        elif kind == 'media': out.append(pre + '{' + ds + '}')
        elif kind == 'raw': out.append(pre)
        else: out.append(pre + '{' + ds + '}')
    return ''.join(out)
new = process(css)
print('declarations removed:', removed, len(css), '->', len(new))
if '--write' in sys.argv: open('src/app.css', 'w', encoding='utf8').write(new)
