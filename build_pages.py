# Публикация: v2b/build.html (тестовая сборка без облака) + v2b/cloud.html (вход и Supabase) -> index.html в корне (GitHub Pages)
import pathlib
r = pathlib.Path(__file__).parent
src = (r / 'v2b' / 'build.html').read_text('utf8'); cloud = (r / 'v2b' / 'cloud.html').read_text('utf8')
assert src.count('</head>') == 1 and src.count('<title>') == 1
out = src.replace('</head>', cloud + '\n</head>')
out = out.replace('<title>', '<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="icon-512.png"><meta name="apple-mobile-web-app-title" content="LifeOS"><title>', 1)
(r / 'index.html').write_text(out, 'utf8')
print('pages built', len(out))
# старые адреса (закладки и иконки на телефоне) ведут на корень: v2b/ и v2/ — заглушки-перенаправления
stub = '<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>LifeOS</title><script>location.replace("../"+location.search+location.hash)</script><p><a href="../">LifeOS</a></p>'
(r / 'v2b' / 'index.html').write_text(stub, 'utf8'); (r / 'v2').mkdir(exist_ok=True); (r / 'v2' / 'index.html').write_text(stub, 'utf8')
