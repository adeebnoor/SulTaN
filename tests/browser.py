"""Browser acceptance checks; all inputs and outputs are fictional."""
from pathlib import Path
import json, os, threading, http.server, functools
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1]
QA=BASE/'qa'; QA.mkdir(exist_ok=True)
results=[]
def check(name,condition):
    results.append({'name':name,'pass':bool(condition)})
    if not condition: raise AssertionError(name)
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public'))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
    kwargs={'headless':True}
    if os.environ.get('CHROMIUM_PATH'): kwargs['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**kwargs)
    context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
    page=context.new_page(); errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url))
    page.on('dialog',lambda d:d.accept())
    page.goto('http://127.0.0.1:'+str(server.server_port)+'/')
    check('Arabic RTL',page.locator('html').get_attribute('dir')=='rtl')
    page.screenshot(path=str(QA/'welcome-desktop.png'),full_page=True)
    page.locator('[data-action="demo"]').click()
    check('Fictional project loaded',page.evaluate('SultanApp.getProject().isDemo'))
    page.locator('[data-path="institution.name"]').fill('جامعة اختبار — افتراضية')
    page.locator('#navigation [data-section="choices"]').click()
    check('One-click navigation after editing', 'اختر الاتجاه' in page.locator('h1').inner_text())
    check('Edited name persisted',page.evaluate('SultanApp.getProject().institution.name')=='جامعة اختبار — افتراضية')
    page.reload(); page.locator('#navigation [data-section="identity"]').click()
    check('Native localStorage reload',page.locator('[data-path="institution.name"]').input_value()=='جامعة اختبار — افتراضية')
    for section in ['choices','references','priorities','enablers','roadmap','review']:
        page.locator('#navigation [data-section="'+section+'"]').click()
        check('Renders '+section,page.locator('#content h1').count()>0)
    page.locator('#navigation [data-section="priorities"]').click()
    page.locator('[data-path="criteria.0.weight"]').fill('20')
    page.locator('[data-path="criteria.0.weight"]').press('Tab');page.wait_for_timeout(120)
    check('Invalid weight sum shown','95 / 100' in page.locator('.stickyweight').inner_text())
    page.locator('[data-action="normalize"]').click()
    check('Weight normalization',page.evaluate('Sultan.weightInfo(SultanApp.getProject()).valid'))
    old=page.evaluate('SultanApp.getProject().criteria.length')
    page.locator('[data-action="add"][data-kind="criteria"]').click()
    check('Custom criteria supported',page.evaluate('SultanApp.getProject().criteria.length')==old+1)
    page.locator('[data-action="remove"][data-kind="criteria"]').last.click()
    check('Custom criterion removal',page.evaluate('SultanApp.getProject().criteria.length')==old)
    page.screenshot(path=str(QA/'comparison-desktop.png'),full_page=False)
    page.evaluate('SultanApp.setProject(Sultan.demo())')
    page.evaluate('SultanApp.navigate("choices")')
    page.locator('[data-action="transition"]').first.click()
    check('Choice creates linked transition',page.evaluate('SultanApp.getProject().transitions.at(-1).optionId')=='o1')
    page.locator('[data-action="initiative"]').last.click()
    check('Transition creates linked initiative',page.evaluate('SultanApp.getProject().initiatives.at(-1).transitionId===SultanApp.getProject().transitions.at(-1).id'))
    page.evaluate('SultanApp.setProject(Sultan.demo());SultanApp.navigate("review")')
    with page.expect_download() as dl:
        page.locator('[data-action="project"]').first.click()
    download=dl.value;download.save_as(str(QA/'example-export.json'))
    data=json.loads((QA/'example-export.json').read_text())
    check('JSON export schema',data['schema']=='sultan.strategy.v0.5')
    with page.expect_download() as dl:
        page.locator('[data-action="report"]').first.click()
    dl.value.save_as(str(QA/'example-strategy.html'))
    report=(QA/'example-strategy.html').read_text()
    check('Report includes choices and gaps','تركيز بحث تطبيقي' in report and 'مسائل تحتاج معالجة' in report)
    check('Report is script-free','<script' not in report.lower())
    page.locator('#importProject').set_input_files({'name':'project.json','mimeType':'application/json','buffer':json.dumps(data,ensure_ascii=False).encode()})
    page.wait_for_timeout(150)
    check('Project import preserves options',page.evaluate('SultanApp.getProject().options.length')==len(data['options']))
    before=page.evaluate('JSON.stringify(SultanApp.getProject().options)')
    page.locator('#importProject').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{not json'})
    page.wait_for_timeout(150)
    check('Invalid import keeps project',page.evaluate('JSON.stringify(SultanApp.getProject().options)')==before)
    page.evaluate('(()=>{const p=Sultan.demo();p.institution.name="<img src=x onerror=alert(1)>";SultanApp.setProject(p);SultanApp.navigate("review");})()')
    check('HTML input rendered as text',page.locator('.report img').count()==0)
    page.evaluate('SultanApp.setProject(Sultan.demo());SultanApp.navigate("home")')
    page.set_viewport_size({'width':390,'height':844})
    for section in ['home','identity','choices','references','priorities','enablers','roadmap','review']:
        page.evaluate('s=>SultanApp.navigate(s)',section)
        check('No page overflow '+section,page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'))
    page.evaluate('SultanApp.navigate("home")');page.screenshot(path=str(QA/'welcome-mobile.png'),full_page=True)
    check('No browser script errors',not errors)
    check('No external data requests',all(url.startswith('http://127.0.0.1:') or url.startswith('blob:') for url in requests))
    context.close();browser.close()
finally:
 server.shutdown()
 (QA/'browser-results.json').write_text(json.dumps({'tests':len(results),'passed':sum(x['pass'] for x in results),'results':results},ensure_ascii=False,indent=2))
print('Browser checks:',len(results),'passed')
