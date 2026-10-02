"""Jurisdiction independence, automatic offline prep and launch metadata in a real browser."""
from pathlib import Path
import functools, http.server, json, os, threading
from playwright.sync_api import sync_playwright

BASE=Path(__file__).resolve().parents[1]; QA=BASE/'qa'; QA.mkdir(exist_ok=True)
results=[]
def check(name, ok):
    results.append({'name':name,'pass':bool(ok)})
    print(('PASS ' if ok else 'FAIL ')+name, flush=True)
    assert ok, name

server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=os.environ.get('SULTAN_LIVE_URL',f'http://127.0.0.1:{server.server_port}/')
try:
    with sync_playwright() as pw:
        opts={'headless':True}
        if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
        browser=pw.chromium.launch(**opts)
        # Source HTML is visible even before the application JavaScript can execute.
        nojs=browser.new_context(java_script_enabled=False)
        page=nojs.new_page();page.goto(url)
        check('initial HTML has visible product promise',page.locator('.boot-hero h1').is_visible())
        check('initial HTML is not an empty app shell','3' in page.locator('.boot-hero').inner_text())
        check('robots meta allows indexing','index' in page.locator('meta[name="robots"]').get_attribute('content'))
        check('Twitter large social card',page.locator('meta[name="twitter:card"]').get_attribute('content')=='summary_large_image')
        check('OG image has declared dimensions',page.locator('meta[property="og:image:width"]').get_attribute('content')=='1200' and page.locator('meta[property="og:image:height"]').get_attribute('content')=='630')
        nojs.close()
        for lang in ['ar','en']:
            ctx=browser.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
            page.goto(url+'?lang='+lang+'&market=global#home')
            page.wait_for_selector('[data-market-home]')
            check(lang+' / global homepage selection',page.locator('[data-market-home]').input_value()=='global')
            check(lang+' / global landing context',page.locator('.vision-reference').count()==0 and page.locator('.market-intro').count()==1)
            page.evaluate("SultanApp.navigate('guide')");page.wait_for_selector('[data-market-wizard]')
            check(lang+' / wizard independent of language',page.locator('[data-market-wizard]').input_value()=='global')
            page.locator('[data-gw="country"]').fill('Kenya');page.locator('[data-gw="currency"]').fill('KES')
            page.locator('.gw-sector input[value="edu"]').check();page.locator('[data-gw="typeId"]').select_option('private')
            page.locator('[data-gw-action="next"]').click();page.locator('[data-gw="institution.name"]').fill('Independent school')
            page.locator('[data-gw="institution.vision"]').fill('Measured learning outcomes');page.locator('[data-gw="institution.beneficiaries"]').fill('Students')
            page.locator('[data-gw-action="next"]').click()
            check(lang+' / no Saudi regulatory library',page.locator('.gw-lib-refs li').count()==0)
            page.locator('[data-gw-action="next"]').click()
            check(lang+' / international generic goal only',page.locator('.gw-goal[data-goal]').count()==1)
            page.locator('[data-gw-action="goal"]').check();page.locator('[data-gw="goals.verified-outcome.baseline"]').fill('10');page.locator('[data-gw="goals.verified-outcome.target"]').fill('30')
            page.locator('[data-gw-action="next"]').click();page.locator('[data-gw-action="build-lib"]').click();page.wait_for_selector('.final-dashboard')
            p=page.evaluate('SultanApp.getProject()')
            check(lang+' / jurisdiction and currency saved',p['context']['market']=='global' and p['context']['country']=='Kenya' and p['context']['currency']=='KES')
            check(lang+' / no Saudi programmes added',not p['references'] and not p['mandates'] and not p['context']['sources'])
            check(lang+' / honest unknown budgets',all(b['amount'] is None for i in p['initiatives'] for b in i['budget']))
            page.evaluate("SultanApp.navigate('strategy')");page.wait_for_selector('.market-settings')
            eyebrow=page.locator('.sw-header .eyebrow').inner_text()
            check(lang+' / localized breadcrumb',('سلطان' in eyebrow and 'STRATEGY' not in eyebrow) if lang=='ar' else 'STRATEGY DESIGN' in eyebrow)
            if lang=='ar':check('Arabic breadcrumb direction',page.locator('.sw-header .eyebrow').evaluate('(e)=>getComputedStyle(e).direction')=='rtl')
            page.locator('.market-settings > summary').click();page.locator('#market-currency').fill('USD');page.locator('[data-market-save]').click()
            q=page.evaluate('SultanApp.getProject()')
            check(lang+' / currency label preserves business records',q['context']['currency']=='USD' and p['funding']==q['funding'] and p['transitions']==q['transitions'] and p['references']==q['references'])
            for width in [390,320]:
                page.set_viewport_size({'width':width,'height':900})
                check(lang+' / no overflow '+str(width),page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            page.set_viewport_size({'width':1366,'height':900})
            # No manual offline button is used in this test.
            page.wait_for_function("SultanOffline.state==='ready'",timeout=60000)
            check(lang+' / worker controls app automatically',page.evaluate('!!navigator.serviceWorker.controller'))
            ctx.set_offline(True);page.reload();page.wait_for_selector('.sw-header')
            check(lang+' / automatic offline reload keeps context',page.evaluate("SultanApp.getProject().context.currency==='USD'"))
            ctx.set_offline(False)
            check(lang+' / no JavaScript errors',not errors)
            page.screenshot(path=str(QA/('market-'+lang+'.png')),full_page=False)
            ctx.close()
        browser.close()
finally:
    server.shutdown()
    (QA/'market-browser-results.json').write_text(json.dumps({'mode':'full-browser','tests':len(results),'passed':sum(x['pass'] for x in results),'results':results},indent=2))
print(f'Market browser checks: {len(results)}/{len(results)}')
