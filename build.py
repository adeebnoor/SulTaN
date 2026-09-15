"""Build a self-contained local edition; no project/customer files are collected."""
from pathlib import Path
import hashlib, json, re, zipfile

base = Path(__file__).resolve().parent
VERSION = '0.8.0-rc'
version_file = base / 'src' / 'version.js'
version_file.write_text(
    "/* Generated from build.py VERSION during packaging. */\n"
    "globalThis.SULTAN_VERSION=" + repr(VERSION) + ";\n",
    encoding='utf-8',
)

html = (base / 'index.html').read_text(encoding='utf-8')
html = html.replace("script-src 'self'", "script-src 'unsafe-inline'")
# The source index is the canonical load graph. The build only inlines those declared assets.

# Inline every local stylesheet/script referenced by index.html, in document order.
# This keeps the standalone edition from silently falling behind when a new module is added.
def local_asset(rel: str) -> Path:
    if not rel.startswith('src/') or '..' in Path(rel).parts:
        raise ValueError('Unexpected asset path: ' + rel)
    path = (base / rel).resolve()
    if base.resolve() not in path.parents:
        raise ValueError('Asset escapes project root: ' + rel)
    if not path.is_file():
        raise FileNotFoundError(rel)
    return path

def inline_css(match):
    rel = match.group(1)
    css = local_asset(rel).read_text(encoding='utf-8')
    return '<style>' + css + '</style>'

def inline_js(match):
    rel = match.group(1)
    code = local_asset(rel).read_text(encoding='utf-8')
    if '</script' in code.lower():
        raise ValueError('Unexpected closing script token in ' + rel)
    return '<script>' + code + '</script>'

html = re.sub(r'<link\s+rel="stylesheet"\s+href="(src/[^"]+\.css)">', inline_css, html)
html = re.sub(r'<script\s+src="(src/[^"]+\.js)"></script>', inline_js, html)

leftover = re.findall(r'(?:src|href)="(src/[^"]+)"', html)
if leftover:
    raise SystemExit('assets not inlined: ' + ', '.join(sorted(set(leftover))))

public = base / 'public'
public.mkdir(exist_ok=True)
(public / 'index.html').write_text(html, encoding='utf-8')
(public / '.nojekyll').write_text('')

release = base / 'release'
release.mkdir(exist_ok=True)
source_files = [
    base / 'README.md', base / 'index.html', base / 'build.py', base / '.gitignore',
    base / '.nojekyll', base / 'CHANGELOG.md', base / 'CONTRIBUTING.md', base / 'render.yaml'
]
for folder in ('src', 'tests', '.github', 'docs'):
    source_files.extend(p for p in (base / folder).rglob('*') if p.is_file())

with zipfile.ZipFile(release / 'SULTAN_Strategy_Builder_Source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in source_files:
        if p.exists():
            z.write(p, p.relative_to(base))
    z.write(public / 'index.html', 'SULTAN_Strategy_Builder.html')

(release / 'manifest.json').write_text(
    json.dumps({
        'version': VERSION,
        'sha256': hashlib.sha256((public / 'index.html').read_bytes()).hexdigest(),
        'sourceFiles': [str(p.relative_to(base)) for p in source_files if p.exists()],
    }, indent=2),
    encoding='utf-8',
)
print('Built public/index.html:', len(html.encode('utf-8')), 'bytes')
