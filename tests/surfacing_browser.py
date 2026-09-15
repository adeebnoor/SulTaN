"""Public surfacing acceptance tests; explicit render-only and verified-live modes."""
from pathlib import Path
import functools, hashlib, http.server, json, os, threading, urllib.request
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parents[1]
QA = BASE / 'qa'
QA.mkdir(exist_ok=True)
RENDER_ONLY = os.environ.get('SULTAN_RENDER_ONLY') == '1'
LIVE = os.environ.get('SULTAN_LIVE_URL', '')
if LIVE and LIVE != 'https://sultan-strategy-beta.onrender.com/':
    raise ValueError('Only the configured SULTAN public origin is accepted.')
if LIVE and RENDER_ONLY:
    raise ValueError('Live verification cannot use render-only mode.')
results, measurements = [], {}
mode = 'render-only' if RENDER_ONLY else 'verified-live' if LIVE else 'full-browser'

def check(name, ok):
    results.append({'name': name, 'pass': bool(ok)})
    print(('PASS ' if ok else 'FAIL ') + name, flush=True)
    if not ok:
        raise AssertionError(name)

server = None
if LIVE:
    url = LIVE
    with urllib.request.urlopen(url, timeout=40) as response:
        actual = hashlib.sha256(response.read()).hexdigest()
    expected = json.loads((BASE / 'release/manifest.json').read_text())['sha256']
    check('Live application SHA-256 equals tested build', actual == expected)
    measurements['sha256'] = actual
elif not RENDER_ONLY:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(BASE / 'public'))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
else:
    url = ''

try:
    with sync_playwright() as pw:
        options = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = pw.chromium.launch(**options)
        for lang in ['ar', 'en']:
            context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
            page = context.new_page()
            page.set_default_timeout(10000)
            errors, requests = [], []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('request', lambda r: requests.append(r.url))
            page.on('dialog', lambda d: d.accept())
            if RENDER_ONLY:
                html = (BASE / 'public/index.html').read_text().replace(
                    '<html lang="ar" dir="rtl">',
                    f'<html lang="{lang}" dir="' + ('rtl' if lang == 'ar' else 'ltr') + '">')
                page.set_content(html)
            else:
                page.goto(url + '?lang=' + lang, wait_until='load')
            page.wait_for_selector('[data-evidence="chain"]')
            page.wait_for_timeout(120)
            prefix = lang + ' / '
            check(prefix + 'four real public links', page.locator('[data-v-anchor]').count() == 4)
            check(prefix + 'duplicate header start is hidden', not page.locator('#publicStart').is_visible())
            check(prefix + 'five evidence views', page.locator('[data-evidence]').count() == 5)
            check(prefix + 'three inline SVGs without foreignObject or canvas',
                  page.locator('.v-visuals svg').count() == 3 and page.locator('.v-visuals canvas,.v-visuals foreignObject').count() == 0)
            check(prefix + 'all eleven reference names', page.locator('.vision-programs li').count() == 11)
            check(prefix + 'two visibly concluded programs', page.locator('.vision-programs .program-completed small').count() == 2)
            check(prefix + 'dated disclaimer', '2026-09-15' in page.locator('.vision-disclaimer').inner_text())
            check(prefix + 'official source link', page.locator('.vision-source').get_attribute('href') == 'https://www.vision2030.gov.sa/ar/explore/programs')
            check(prefix + 'actual break-even threshold', abs(float(page.locator('.v-break-chart').get_attribute('data-threshold')) - 47.69230769230773) < 1e-7)
            check(prefix + 'actual crossing value', abs(float(page.locator('.v-crossing').get_attribute('data-value')) - 79.9230769230769) < 1e-7)
            check(prefix + 'actual conditions count', page.evaluate('''Number(document.querySelector('[data-blocking-count]').dataset.blockingCount) === Sultan.check(Sultan.demo()).filter(i=>['blocking','missing'].includes(i.level)).length'''))
            check(prefix + 'funding condition is surfaced', page.evaluate('''document.querySelector('[data-evidence="chain"]').textContent.includes(Sultan.demo().initiatives.flatMap(i=>i.budget).find(b=>b.releaseEvidence).releaseEvidence)'''))
            for anchor in ['methodology', 'outputs', 'privacy-limits', 'about-sultan']:
                check(prefix + 'anchor exists ' + anchor, page.locator('#' + anchor + ' h2').count() > 0)
                if not RENDER_ONLY:
                    page.locator('[data-v-anchor="' + anchor + '"]').click()
                    page.wait_for_timeout(50)
                    check(prefix + 'anchor focus and history ' + anchor,
                          page.evaluate('(id)=>location.hash==="#"+id && document.querySelector("#"+id).contains(document.activeElement)', anchor))
            for width in [320, 390, 768, 1440]:
                page.set_viewport_size({'width': width, 'height': 1000})
                check(prefix + f'landing fits {width}', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            page.screenshot(path=str(QA / f'surfacing-home-{lang}.png'), full_page=True)
            page.locator('.v-visuals').screenshot(path=str(QA / f'surfacing-evidence-{lang}.png'))
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path=str(QA / f'surfacing-mobile-{lang}.png'), full_page=True)
            if RENDER_ONLY:
                check(prefix + 'no JavaScript errors in render-only preview', not errors)
                measurements[lang] = {'pageErrors': errors, 'workspaceChecks': 'require a real browser origin'}
                context.close()
                continue
            if not RENDER_ONLY:
                page.goto(url + '?lang=' + lang + '#outputs')
                page.wait_for_selector('#outputs')
                page.wait_for_timeout(160)
                check(prefix + 'direct public deep link survives reload', page.evaluate('location.hash==="#outputs" && document.querySelector("#outputs").contains(document.activeElement)'))
            # Project creation increments revision; it must still get blank-state guidance.
            page.locator('.hero-copy [data-action="new"]').click()
            page.wait_for_selector('.pristine-note')
            check(prefix + 'blank-project revision does not suppress guidance', page.evaluate('SultanApp.getProject().revision>0 && SultanEvidence.isPristine(SultanApp.getProject())'))
            baseline = page.evaluate('JSON.stringify(Sultan.check(SultanApp.getProject()))')
            page.evaluate('SultanApp.navigate("review")')
            page.wait_for_timeout(100)
            check(prefix + 'review is not softened', not page.locator('body').evaluate('e=>e.classList.contains("is-pristine")'))
            check(prefix + 'objective validation unchanged', page.evaluate('JSON.stringify(Sultan.check(SultanApp.getProject()))') == baseline)
            page.evaluate('SultanApp.setProject(Sultan.demo());SultanApp.navigate("identity")')
            page.wait_for_selector('.vision-workspace-note')
            for path in ['institution.sector', 'mandates.0.title']:
                check(prefix + 'open suggestions ' + path, bool(page.locator('[data-path="' + path + '"]').get_attribute('list')))
            custom = 'Custom mandate outside program list / 44123'
            page.locator('[data-path="mandates.0.title"]').fill(custom)
            page.locator('[data-path="mandates.0.title"]').press('Tab')
            page.wait_for_timeout(100)
            check(prefix + 'custom mandate saved', page.evaluate('SultanApp.getProject().mandates[0].title') == custom)
            if not RENDER_ONLY:
                page.reload()
                page.wait_for_selector('.vision-workspace-note')
                check(prefix + 'custom mandate persists after reload', page.evaluate('SultanApp.getProject().mandates[0].title') == custom)
            page.evaluate('SultanApp.navigate("choices")')
            page.wait_for_timeout(100)
            for name in ['whyUs', 'tradeoff', 'outcome', 'decisionReason', 'foothold']:
                check(prefix + 'judgement stays free ' + name, page.locator('[data-path$=".' + name + '"][list]').count() == 0)
            check(prefix + 'owners suggest project names', bool(page.locator('[data-path="options.0.owner"]').get_attribute('list')))
            page.evaluate('SultanApp.navigate("references")')
            page.wait_for_selector('[data-path="transitions.0.maturityFamily"][list]')
            page.wait_for_timeout(100)
            for path in ['transitions.0.unit', 'transitions.0.frequency', 'transitions.0.maturityFamily']:
                check(prefix + 'open suggestions ' + path, bool(page.locator('[data-path="' + path + '"]').get_attribute('list')))
            check(prefix + 'reference kind remains closed enum', page.locator('[data-path="references.0.kind"]').evaluate('e=>e.tagName==="SELECT"'))
            total = page.locator('.annual-details [data-path]').count()
            visible = page.locator('.annual-details [data-path]:visible').count()
            check(prefix + 'annual disclosure reduces visible fields without deleting them', total > visible > 0)
            check(prefix + 'one annual row initially open per transition', page.locator('.annual-details[open]').count() == page.evaluate('SultanApp.getProject().transitions.length'))
            key = page.locator('.annual-details').nth(1).get_attribute('data-annual-key')
            page.locator('.annual-details').nth(1).locator('summary').click()
            page.wait_for_timeout(80)
            check(prefix + 'another year expands', page.locator('.annual-details').nth(1).evaluate('e=>e.open'))
            field = page.locator('.annual-details').nth(1).locator('[data-path$=".milestone"]')
            field.fill('Edited annual milestone / evidence review')
            field.press('Tab')
            page.wait_for_timeout(150)
            check(prefix + 'edited annual milestone persists in model', page.evaluate('SultanApp.getProject().transitions[0].annual[1].milestone') == 'Edited annual milestone / evidence review')
            page.evaluate('SultanApp.navigate("choices");SultanApp.navigate("references")')
            page.wait_for_selector('[data-path="transitions.0.maturityFamily"][list]')
            page.wait_for_timeout(100)
            check(prefix + 'annual expanded state survives re-render', page.locator('.annual-details').filter(has=page.locator('[data-path="transitions.0.annual.1.milestone"]')).evaluate('e=>e.open'))
            check(prefix + 'no annual fields lost', page.locator('.annual-details [data-path]').count() == total)
            for width in [320, 390, 768, 1440]:
                page.set_viewport_size({'width': width, 'height': 1000})
                check(prefix + f'references fit {width}', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            measurements[lang] = {'annualFields': total, 'initialVisibleAnnualFields': visible, 'pageErrors': errors}
            check(prefix + 'no JavaScript errors', not errors)
            check(prefix + 'no project network transmission', not any(u.startswith('http') and not u.startswith(url) for u in requests))
            context.close()
        browser.close()
except Exception as error:
    results.append({'name': 'Execution completed without exceptions', 'pass': False, 'error': str(error)})
    raise
finally:
    if server:
        server.shutdown()
    report = {'mode': mode, 'tests': len(results), 'passed': sum(t['pass'] for t in results), 'results': results, 'measurements': measurements}
    (QA / ('surfacing-live-results.json' if LIVE else 'surfacing-browser-results.json')).write_text(json.dumps(report, indent=2, ensure_ascii=False))
print(f'SULTAN surfacing: {report["passed"]}/{report["tests"]} ({mode})')
