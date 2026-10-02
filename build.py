"""Build cacheable web assets and a self-contained local edition."""
from pathlib import Path
import base64,hashlib,json,re,shutil,zipfile
base=Path(__file__).resolve().parent
VERSION = '0.11.0-beta'
(base/'src/version.js').write_text("/* Generated from build.py VERSION during packaging. */\nglobalThis.SULTAN_VERSION="+repr(VERSION)+";\n")
public=base/'public';release=base/'release'
if public.exists():shutil.rmtree(public)
(public/'assets').mkdir(parents=True);release.mkdir(exist_ok=True)
sha=lambda data:hashlib.sha256(data).hexdigest()
def asset(rel):
 p=base/rel
 if not rel.startswith('src/') or '..' in Path(rel).parts or not p.is_file():raise ValueError(rel)
 return p.read_text()
def hashed(name,code,suffix):
 data=code.encode();path='assets/'+name+'-'+sha(data)[:12]+suffix;(public/path).write_bytes(data);return path
vendors={}
for p in sorted((base/'src/vendor').glob('*.js')):vendors['vendor/'+p.name]=hashed(p.stem,p.read_text(),'.js')
css_re=r'<link\s+rel="stylesheet"\s+href="(src/[^"]+\.css)">'
js_re=r'<script\s+src="(src/[^"]+\.js)"></script>'
source=(base/'index.html').read_text()
def web(html,name):
 css='\n'.join(asset(p) for p in re.findall(css_re,html));scripts='\n'.join(asset(p) for p in re.findall(js_re,html))
 if name=='app':scripts='globalThis.SULTAN_ASSETS='+json.dumps(vendors,sort_keys=True)+';\n'+scripts
 style=hashed(name,css,'.css');script=hashed(name,scripts,'.js')
 html=re.sub(css_re,'',html);html=re.sub(js_re,'',html)
 html=html.replace('</head>',f'<link rel="stylesheet" href="{style}"><script defer src="{script}"></script></head>')
 for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',html,re.S):
  token=base64.b64encode(hashlib.sha256(block.encode()).digest()).decode();html=html.replace("script-src 'self'", "script-src 'self' 'sha256-"+token+"'")
 return html
(public/'index.html').write_text(web(source,'app'))
(public/'share.html').write_text(web((base/'share.html').read_text(),'reader'))
standalone=source.replace("script-src 'self'","script-src 'unsafe-inline'")
standalone=re.sub(css_re,lambda m:'<style>'+asset(m[1])+'</style>',standalone)
standalone=re.sub(js_re,lambda m:'<script>'+asset(m[1])+'</script>',standalone)
embedded=''
for key,name in [('zip','jszip-3.10.2.js'),('pptx','pptxgen-4.0.1.js'),('pdf','jspdf-4.2.1.js')]:
 code=asset('src/vendor/'+name)
 if '</script' in code.lower():raise ValueError('Closing token in dependency')
 embedded+=f'<script type="text/plain" id="sultan-library-{key}">'+code+'</script>'
at=standalone.rfind('</body>');standalone=standalone[:at]+embedded+standalone[at:]
(release/'SULTAN_Strategy_Builder.html').write_text(standalone)
origin='https://sultan-strategy-beta.onrender.com/'
(public/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /share.html\nSitemap: '+origin+'sitemap.xml\n')
(public/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+origin+'</loc></url></urlset>')
logo=re.search(r'<link rel="apple-touch-icon" href="([^"]+)"',source)[1]
(public/'icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#f7f3ea"/><image x="48" y="48" width="416" height="416" href="'+logo+'"/></svg>')
(public/'manifest.webmanifest').write_text(json.dumps({'id':'/','name':'SULTAN — Strategy','short_name':'SULTAN','start_url':'/','scope':'/','display':'standalone','background_color':'#f7f3ea','theme_color':'#0b2d63','icons':[{'src':'icon.svg','sizes':'any','type':'image/svg+xml','purpose':'any'}]},ensure_ascii=False))
(public/'.nojekyll').write_text('')
files=sorted(str(p.relative_to(public)) for p in public.rglob('*') if p.is_file())
cache='sultan-app-'+sha(''.join(sha((public/p).read_bytes()) for p in files).encode())[:16]
(public/'sw.js').write_text((base/'src/sw-template.js').read_text().replace('__CACHE__',json.dumps(cache)).replace('__FILES__',json.dumps(files)))
files=sorted(str(p.relative_to(public)) for p in public.rglob('*') if p.is_file())
source_files=[base/p for p in ['README.md','index.html','share.html','build.py','.gitignore','.nojekyll','CHANGELOG.md','CONTRIBUTING.md','render.yaml']]
for folder in ['src','tests','.github','docs']:source_files.extend(p for p in (base/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
with zipfile.ZipFile(release/'SULTAN_Strategy_Builder_Source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in source_files:
  if p.exists():z.write(p,p.relative_to(base))
 z.write(release/'SULTAN_Strategy_Builder.html','SULTAN_Strategy_Builder.html')
(release/'manifest.json').write_text(json.dumps({'version':VERSION,'sha256':sha((public/'index.html').read_bytes()),'assets':[{'path':p,'sha256':sha((public/p).read_bytes()),'bytes':(public/p).stat().st_size} for p in files if p!='index.html'],'sourceFiles':[str(p.relative_to(base)) for p in source_files if p.exists()]},indent=2))
print('Web HTML:',(public/'index.html').stat().st_size,'bytes; standalone:',(release/'SULTAN_Strategy_Builder.html').stat().st_size,'bytes')
