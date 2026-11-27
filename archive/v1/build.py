# LifeOS build: src/shell.html + src/app.css + src/js/*.js (concatenated in name order) -> index.html (single file)
import pathlib
d = pathlib.Path(__file__).parent / 'src'
s = (d / 'shell.html').read_text('utf8')
s = s.replace('/*@CSS*/', (d / 'app.css').read_text('utf8')).replace('/*@JS*/', ''.join(f.read_text('utf8') for f in sorted((d / 'js').glob('*.js'))))
(pathlib.Path(__file__).parent / 'index.html').write_text(s, 'utf8')
print('built', len(s))
