"""Public-beta acceptance tests. Render-only mode skips network/storage assertions."""
from pathlib import Path
import functools, http.server, json, os, re, threading
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1];QA=BASE/'qa';QA.mkdir(exist_ok=True)
RENDER_ONLY=os.environ.get('SULTAN_RENDER_ONLY')=='1'
results=[]
def check(name,ok):
 results.append({'name':name,'pass':bool(ok)})
 if not ok: raise AssertionError(name)
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public'))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  args={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**args)
  for lang in ['ar','en']:
   ctx=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
   page=ctx.new_page();errors=[];req=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda r:req.append(r.url))
   page.on('dialog',lambda d:d.accept())
   if RENDER_ONLY:
    html=(BASE/'public/index.html').read_text().replace('<html lang="ar" dir="rtl">',f'<html lang="{lang}" dir="'+('rtl' if lang=='ar' else 'ltr')+'">')
    page.set_content(html)
   else:page.goto(url+'?lang='+lang)
   prefix=lang+' / '
   check(prefix+'language and direction',page.locator('html').get_attribute('lang')==lang and page.locator('html').get_attribute('dir')==('rtl' if lang=='ar' else 'ltr'))
   check(prefix+'public entrance distinct from workspace',page.locator('body').evaluate('(e)=>e.classList.contains("is-home")') and not page.locator('.sidebar').is_visible())
   page.screenshot(path=str(QA/f'launch-{lang}.png'),full_page=True)
   for tab in ['choices','enablers','path']:
    page.locator('[data-preview="'+tab+'"]').click()
    check(prefix+'preview '+tab,page.locator('#preview-panel').get_attribute('aria-labelledby')=='preview-tab-'+tab)
   page.locator('#preview-tab-path').press('End')
   check(prefix+'preview keyboard navigation',page.locator('#preview-tab-enablers').get_attribute('aria-selected')=='true')
   for width in [320,390,768,1440]:
    page.set_viewport_size({'width':width,'height':900})
    check(prefix+f'landing fits {width}px',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(QA/f'launch-mobile-{lang}.png'),full_page=True)
   page.locator('[data-action="demo"]').first.click()
   check(prefix+'example is visibly fictional',page.evaluate('SultanApp.getProject().isDemo') and ('Fictional' in page.locator('#projectTitle').inner_text() if lang=='en' else 'افتراضي' in page.locator('#projectTitle').inner_text()))
   page.locator('[data-path="institution.name"]').fill('DO-NOT-SEND-PRIVATE-MARKER')
   page.locator('#navigation [data-section="choices"]').click()
   check(prefix+'editing commits before navigation',page.evaluate('SultanApp.getProject().institution.name')=='DO-NOT-SEND-PRIVATE-MARKER')
   if not RENDER_ONLY:
    page.reload();check(prefix+'local persistence',page.evaluate('SultanApp.getProject().institution.name')=='DO-NOT-SEND-PRIVATE-MARKER')
    page.locator('[data-beta="language"]').click();page.wait_for_load_state('load')
    check(prefix+'language switch preserves project',page.evaluate('SultanApp.getProject().institution.name')=='DO-NOT-SEND-PRIVATE-MARKER')
    check(prefix+'language switch preserves section',page.locator('#navigation [aria-current="page"]').get_attribute('data-section')=='choices')
    page.locator('[data-beta="language"]').click();page.wait_for_load_state('load')
   for section in ['identity','choices','references','priorities','enablers','roadmap','review','about']:
    page.evaluate('s=>SultanApp.navigate(s)',section)
    check(prefix+'renders '+section,page.locator('#content h1').count()>0)
    check(prefix+'workspace fits '+section,page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    if lang=='en':
     # Check UI after replacing the edited English fixture, excluding the Arabic language switch.
     check(prefix+'translated UI '+section,not bool(re.search('[\u0600-\u06ff]',page.locator('#content').inner_text())))
   page.evaluate('SultanApp.navigate("priorities")')
   before=page.evaluate('Sultan.ranking(SultanApp.getProject()).map(o=>o.id)')
   page.locator('[data-path="criteria.0.weight"]').fill('20');page.locator('[data-path="criteria.0.weight"]').press('Tab');page.wait_for_timeout(80)
   check(prefix+'invalid weight total shown','95 / 100' in page.locator('.stickyweight').inner_text())
   page.locator('[data-action="normalize"]').click()
   check(prefix+'weight normalization',page.evaluate('Sultan.weightInfo(SultanApp.getProject()).valid'))
   page.evaluate('SultanApp.navigate("references")')
   page.locator('[data-action="initiative"]').first.click()
   check(prefix+'linked initiative draft',page.evaluate('SultanApp.getProject().initiatives.at(-1).transitionId')=='t1')
   page.evaluate('SultanApp.navigate("review")')
   page.locator('.export-menu > summary').click()
   with page.expect_download() as dl:page.locator('[data-action="project"]').click()
   dl.value.save_as(str(QA/f'roundtrip-{lang}.json'))
   data=json.loads((QA/f'roundtrip-{lang}.json').read_text())
   check(prefix+'JSON export',data['institution']['name']=='DO-NOT-SEND-PRIVATE-MARKER')
   page.locator('#importProject').set_input_files({'name':'roundtrip.json','mimeType':'application/json','buffer':json.dumps(data).encode()});page.wait_for_timeout(80)
   check(prefix+'JSON import retains values',page.evaluate('SultanApp.getProject().institution.name')=='DO-NOT-SEND-PRIVATE-MARKER')
   if not page.locator('.export-menu').evaluate('(d)=>d.open'):page.locator('.export-menu > summary').click()
   with page.expect_download() as dl:page.locator('[data-action="report"]').click()
   dl.value.save_as(str(QA/f'strategy-{lang}.html'));report=(QA/f'strategy-{lang}.html').read_text()
   check(prefix+'localized report',f'lang="{lang}"' in report and '<script' not in report.lower())
   check(prefix+'report retains decisions and unresolved notes','DO-NOT-SEND-PRIVATE-MARKER' in report and ('Issues requiring attention' in report if lang=='en' else 'مسائل تحتاج معالجة' in report))
   before=page.evaluate('JSON.stringify(SultanApp.getProject())')
   page.locator('#importProject').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{oops'});page.wait_for_timeout(80)
   check(prefix+'invalid import preserves data',page.evaluate('JSON.stringify(SultanApp.getProject())')==before)
   page.locator('[data-beta="feedback"]').first.click()
   check(prefix+'feedback is accessible dialog',page.locator('#feedbackDialog').is_visible())
   check(prefix+'public feedback requires opt-in',page.locator('[data-beta="github-feedback"]').is_disabled())
   page.locator('#feedbackSummary').fill('Improve pathway guidance')
   page.locator('#feedbackDetails').fill('The annual milestones could use a more detailed help example.')
   preview=page.locator('#feedbackPreview').input_value()
   check(prefix+'feedback excludes project data','DO-NOT-SEND-PRIVATE-MARKER' not in preview and 'Horizon University' not in preview)
   page.evaluate('window.betaCapturedLinks=[];document.addEventListener("click",e=>{const a=e.target.closest("a");if(a&&(a.href.startsWith("mailto:")||a.href.startsWith("https://github.com/"))){window.betaCapturedLinks.push(a.href);e.preventDefault();}},true)')
   page.locator('[data-beta="email-feedback"]').click()
   check(prefix+'email draft route',page.evaluate('betaCapturedLinks.at(-1).startsWith("mailto:adeeb.noor@gmail.com?")'))
   page.locator('#publicConsent').check();page.locator('[data-beta="github-feedback"]').click()
   check(prefix+'GitHub draft route',page.evaluate('betaCapturedLinks.at(-1).startsWith("https://github.com/adeebnoor/SulTaN/issues/new?")'))
   check(prefix+'draft not described as already submitted',('No issue has been submitted' in page.locator('#feedbackStatus').inner_text()) if lang=='en' else ('لم ينشر الموقع' in page.locator('#feedbackStatus').inner_text()))
   page.screenshot(path=str(QA/f'feedback-{lang}.png'),full_page=False)
   page.locator('#feedbackDialog').press('Escape');check(prefix+'Escape closes feedback',not page.locator('#feedbackDialog').is_visible())
   page.evaluate('(()=>{const p=Sultan.demo();p.institution.name="<img src=x onerror=alert(1)>";SultanApp.setProject(p);SultanApp.navigate("review");})()')
   check(prefix+'HTML injection escaped',page.locator('.report img').count()==0)
   check(prefix+'no script errors',not errors)
   check(prefix+'no outgoing app requests',all(r.startswith(url) or r.startswith('blob:') for r in req))
   ctx.close()
  browser.close()
finally:
 server.shutdown();(QA/'beta-browser-results.json').write_text(json.dumps({'mode':'render-only' if RENDER_ONLY else 'full-browser','tests':len(results),'passed':sum(r['pass'] for r in results),'results':results},indent=2))
print('Beta browser tests:',len(results),'passed; mode =', 'render-only' if RENDER_ONLY else 'full-browser')
