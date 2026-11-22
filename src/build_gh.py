import sys
src = open('/home/claude/work/lo/index.html', encoding='utf8').read()
shim = open('/home/claude/work/gh/shim.html', encoding='utf8').read()
assert src.count('</head>') == 1
out = src.replace('</head>', shim + '\n</head>')
out = out.replace('<title>', '<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="icon-512.png"><meta name="apple-mobile-web-app-title" content="LifeOS"><meta name="apple-mobile-web-app-capable" content="yes"><title>', 1)
open(sys.argv[1], 'w', encoding='utf8').write(out)
print('gh built', len(out))
