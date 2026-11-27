# Beta 2.0 build: v2b/src/shell.html + css/*.css + lib-qrcode.js + js/*.js (по имени) -> v2b/build.html
import pathlib
d = pathlib.Path(__file__).parent / 'v2b' / 'src'
rd = lambda p: p.read_text('utf8')
s = rd(d / 'shell.html')
s = s.replace('/*@CSS*/', ''.join(rd(f) for f in sorted((d / 'css').glob('*.css')))).replace('/*@LIB*/', rd(d / 'lib-qrcode.js')).replace('/*@JS*/', ''.join(rd(f) for f in sorted((d / 'js').glob('*.js'))))
(pathlib.Path(__file__).parent / 'v2b' / 'build.html').write_text(s, 'utf8')
print('built v2b', len(s))
