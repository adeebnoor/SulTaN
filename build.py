"""Build a self-contained local edition; no project/customer files are collected."""
from pathlib import Path
import hashlib, json, re, zipfile
base = Path(__file__).resolve().parent
VERSION='0.7.4'
version_file = base / 'src' / 'version.js'
version_file.write_text("/* Generated from build.py VERSION during packaging. */\nglobalThis.SULTAN_VERSION=" + repr(VERSION) + ";\n", encoding='utf-8')
html = (base / 'index.html').read_text(encoding='utf-8')
html = html.replace("script-src 'self'", "script-src 'unsafe-inline'")
for css_name in ('style.css','portal.css','authority-space.css','execution-upgrades.css','final.css'):
    html = html.replace(f'<link rel="stylesheet" href="src/{css_name}">', '<style>' + (base / 'src' / css_name).read_text(encoding='utf-8') + '</style>')
for name in ('version.js','locales/en.js','locales/ar.js','locales/authority-space.js','locales/execution-upgrades.js','locales/demo.js','final-locales.js','i18n.js','engine.js','break-even-analytic.js','performance.js','import.js','final-core.js','final-core-patch.js','portal.js','app.js','criteria-polarity.js','authority-space.js','final-export-hook.js','execution-upgrades.js','review-visuals.js','usability.js','final-ui.js','final-report-patch.js','final-polish.js','version-patch.js'):
    code = (base / 'src' / name).read_text(encoding='utf-8')
    if '</script' in code.lower():
        raise ValueError('Unexpected closing script token in ' + name)
    html = html.replace('<script src="src/' + name + '"></script>', '<script>' + code + '</script>')
leftover = re.findall(r'(?:src|href)="(src/[^"]+)"', html)
if leftover:
    raise SystemExit('assets not inlined: ' + ', '.join(sorted(set(leftover))))
public = base / 'public'
public.mkdir(exist_ok=True)
(public / 'index.html').write_text(html, encoding='utf-8')
(public / '.nojekyll').write_text('')
release = base / 'release'
release.mkdir(exist_ok=True)
source_files = [base / 'README.md', base / 'index.html', base / 'build.py', base / '.gitignore', base / '.nojekyll', base / 'CHANGELOG.md', base / 'CONTRIBUTING.md']
for folder in ('src', 'tests', '.github', 'docs'):
    source_files.extend(p for p in (base / folder).rglob('*') if p.is_file())
with zipfile.ZipFile(release / 'SULTAN_Strategy_Builder_Source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in source_files:
        if p.exists(): z.write(p, p.relative_to(base))
    z.write(public / 'index.html', 'SULTAN_Strategy_Builder.html')
(release / 'manifest.json').write_text(json.dumps({'version':VERSION,'sha256':hashlib.sha256((public / 'index.html').read_bytes()).hexdigest(),'sourceFiles':[str(p.relative_to(base)) for p in source_files if p.exists()]}, indent=2), encoding='utf-8')
print('Built public/index.html:', len(html.encode('utf-8')), 'bytes')
