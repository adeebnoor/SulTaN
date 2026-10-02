"""First-use conversion journey, isolation and explicit handoff on a real origin."""
from pathlib import Path
import functools, http.server, json, os, threading, time
from playwright.sync_api import sync_playwright, expect

BASE=Path(__file__).resolve().parents[1]; QA=BASE/'qa'; QA.mkdir(exist_ok=True)
LIVE=os.environ.get('SULTAN_LIVE_URL',''); server=None
if LIVE:url=LIVE
else:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public')))
 threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
results=[];measurements={}
def check(name,ok):
 results.append({'name':name,'pass':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
try:
 with sync_playwright() as pw:
  opts={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts)
  for lang in ['ar','en']:
   ctx=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
   page=ctx.new_page();errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
   page.goto(url+'?lang='+lang,wait_until='load');page.wait_for_function("document.body.dataset.rev3==='ready'")
   pre=lang+' / '
   check(pre+'one primary and one secondary hero action',page.locator('.launch-hero .hero-actions button').count()==2 and page.locator('.launch-hero .hero-actions .primary').count()==1)
   check(pre+'short benefit-led opening',len(page.locator('.hero-copy>p').first.inner_text().split())<40)
   check(pre+'formal vocabulary deferred',not any(term in page.locator('.launch-hero').inner_text() for term in ['مساحة الصلاحية','خلوص القرار','نقطة تعادل القرار','Authority Space','Decision clearance','Decision Break-even']))
   check(pre+'workspace and full example collapsed',not page.locator('.sidebar').is_visible() and not page.locator('.fm-full-example').evaluate('el=>el.open'))
   before=page.evaluate('JSON.stringify(SultanApp.getProject())');saved=page.evaluate('localStorage.getItem("sultan.strategy.builder.v0.5")')
   page.locator('[data-fm="try"]').click();check(pre+'primary action focuses the brief',page.locator('#fm-brief').evaluate('el=>el===document.activeElement'))
   page.locator('#fm-brief').fill('Only two\nIncomplete lines');page.locator('#fm-form button').click()
   expect(page.locator('#fm-status')).to_contain_text('ثلاثة' if lang=='ar' else 'three')
   check(pre+'invalid brief does not produce a draft',not page.locator('#fm-result').is_visible())
   baseline_requests=len(requests);started=time.monotonic();page.locator('[data-fm="example"]').click();expect(page.locator('#fm-result')).to_be_visible()
   measurements[lang]={'example_render_ms':round((time.monotonic()-started)*1000)}
   check(pre+'quick example stays on homepage',page.evaluate('location.hash==="#home"') and page.locator('.fm-cards article').count()==3)
   check(pre+'preview changes neither project nor persistence',page.evaluate('JSON.stringify(SultanApp.getProject())')==before and page.evaluate('localStorage.getItem("sultan.strategy.builder.v0.5")')==saved)
   check(pre+'preview is local and disclosed',len(requests)==baseline_requests and ('قوالب' in page.locator('#fm-result').inner_text() or 'Fictional quick example' in page.locator('#fm-result').inner_text() or 'افتراضي' in page.locator('#fm-result').inner_text()))
   lines='جهة اختبار افتراضية\nخفض زمن إنجاز الخدمة\nتأخر الموافقات' if lang=='ar' else 'Synthetic service organisation\nReduce service cycle time\nApprovals are slow'
   page.locator('#fm-brief').fill(lines)
   check(pre+'editing invalidates the previous preview',not page.locator('#fm-result').is_visible())
   page.locator('#fm-form button').click();expect(page.locator('#fm-result')).to_be_visible()
   check(pre+'custom goal and constraint appear',lines.split('\n')[1] in page.locator('.fm-decision').inner_text() and lines.split('\n')[2] in page.locator('.fm-constraint').inner_text())
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':900});check(pre+f'preview fits {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   page.evaluate('scrollTo(0,0)');page.screenshot(path=str(QA/f'first-minute-desktop-{lang}.png'),full_page=False)
   page.set_viewport_size({'width':390,'height':844});page.locator('#fm-result').screenshot(path=str(QA/f'first-minute-result-{lang}.png'))
   page.set_viewport_size({'width':1440,'height':900})
   page.locator('[data-fm="continue"]').click();expect(page.locator('[data-sw-tab="execution"]')).to_have_attribute('aria-selected','true')
   check(pre+'explicit handoff carries the brief and full linked plan',page.evaluate('''()=>{const p=SultanApp.getProject();return p.options.length===1&&p.transitions.length===1&&p.initiatives.length===3&&p.strategy.charters.length===3&&p.institution.context&&p.context.brief;}'''))
   check(pre+'unknowns and research remain honest',page.evaluate('''()=>{const p=SultanApp.getProject();return p.transitions.every(t=>t.baseline===null&&t.target===null)&&p.references.every(r=>r.status==='unchecked'&&!r.source)&&p.initiatives.every(i=>i.budgetStatus==='unconfirmed'&&i.budget.every(b=>b.amount===null));}'''))
   page.reload(wait_until='load');check(pre+'continued plan survives reload',page.evaluate('SultanApp.getProject().strategy.charters.length===3'))
   page.evaluate('SultanApp.navigate("home")');page.wait_for_selector('#fm-brief')
   snapshot=page.evaluate('JSON.stringify(SultanApp.getProject())');institution=page.evaluate('JSON.stringify(SultanApp.getProject().institution)');ids=page.evaluate('SultanApp.getProject().initiatives.map(i=>i.id)')
   hostile='Other <img src=x onerror=alert(1)> organisation\nGrow recurring revenue\nNo subscription offer'
   page.locator('#fm-brief').fill(hostile);page.locator('#fm-form button').click();expect(page.locator('#fm-result')).to_be_visible()
   check(pre+'user text is escaped',page.locator('#fm-result img').count()==0 and '<img' in page.locator('.fm-result-header').inner_text())
   check(pre+'existing draft preserved while previewing',page.evaluate('JSON.stringify(SultanApp.getProject())')==snapshot)
   expect(page.locator('[data-fm="continue"]')).to_contain_text('أضف' if lang=='ar' else 'Add')
   page.locator('[data-fm="continue"]').click();expect(page.locator('[data-sw-tab="execution"]')).to_have_attribute('aria-selected','true')
   check(pre+'append keeps institution and existing initiatives',page.evaluate('JSON.stringify(SultanApp.getProject().institution)')==institution and page.evaluate('(ids)=>ids.every(id=>SultanApp.getProject().initiatives.some(i=>i.id===id))',ids))
   check(pre+'append creates the additional linked plan',page.evaluate('SultanApp.getProject().options.length===2&&SultanApp.getProject().strategy.charters.length===6'))
   page.evaluate('SultanApp.navigate("home")');page.locator('#fm-brief').fill(hostile);page.locator('#fm-form button').click();expect(page.locator('#fm-result')).to_be_visible();page.locator('[data-fm="continue"]').click()
   check(pre+'repeat continuation avoids duplicates',page.evaluate('SultanApp.getProject().strategy.charters.length===6'))
   page.evaluate('SultanApp.navigate("home")');page.wait_for_selector('.fm-term')
   check(pre+'five visual explanations retain expandable terms',page.locator('.sm-construct svg').count()==5 and page.locator('.fm-term').count()==5 and page.locator('.fm-term[open]').count()==0)
   page.locator('.fm-term').nth(1).locator('summary').click();expect(page.locator('.fm-term').nth(1)).to_contain_text('خلوص القرار' if lang=='ar' else 'Decision clearance')
   check(pre+'glossary opens without changing project',page.locator('.fm-term').nth(1).evaluate('el=>el.open'))
   check(pre+'no script errors or AI-provider calls',not errors and not any('/v1/messages' in r or 'anthropic.com' in r for r in requests))
   ctx.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'tests':len(results),'passed':sum(r['pass'] for r in results),'results':results,'live':bool(LIVE),'url':url,'measurements':measurements}
(QA/'first-minute-browser-results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(f'First-minute browser checks: {report["passed"]}/{report["tests"]}')
