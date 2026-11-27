# Публикация: v2b/index.html (тестовая сборка без облака) + v2b/cloud.html (вход и Supabase) -> index.html в корне (GitHub Pages)
import pathlib
r = pathlib.Path(__file__).parent
src = (r / 'v2b' / 'index.html').read_text('utf8'); cloud = (r / 'v2b' / 'cloud.html').read_text('utf8')
assert src.count('</head>') == 1 and src.count('<title>') == 1
out = src.replace('</head>', cloud + '\n</head>')
out = out.replace('<title>', '<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="icon-512.png"><meta name="apple-mobile-web-app-title" content="LifeOS"><title>', 1)
(r / 'index.html').write_text(out, 'utf8')
print('pages built', len(out))
