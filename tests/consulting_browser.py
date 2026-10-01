"""Audit regressions: editing, review freshness and leadership exports in AR/EN."""
from pathlib import Path
import functools, http.server, json, os, threading
from playwright.sync_api import sync_playwright, expect
BASE=Path(__file__).resolve().parents[1];QA=BASE/'qa';QA.mkdir(exist_ok=True)
LIVE=os.environ.get('SULTAN_LIVE_URL','');server=None
if LIVE:url=LIVE
else:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public')))
 threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
results=[]
def check(name,ok):
 results.append({'name':name,'pass':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
try:
 with sync_playwright() as pw:
  opts={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts)
  for lang in ['ar','en']:
   ctx=browser.new_context(accept_downloads=True,viewport={'width':1366,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url+'?lang='+lang,wait_until='load')
   page.evaluate('''()=>{const p=SultanDraft.build({sectorId:'edu',typeId:'private',institution:{name:'Synthetic audit fixture',startYear:2027,endYear:2030},goals:[{goalId:'quality',baseline:58,target:70,owner:'Test owner'}]});SultanApp.setProject(p);SultanApp.navigate('review');}''')
   page.wait_for_selector('.final-dashboard');a=page.locator('[data-path="transitions.0.annual.0.actual"]');source=page.locator('[data-path="transitions.0.annual.0.actualSource"]')
   a.fill('59');source.fill('Synthetic measurement source')
   # Allow a render queued by the previous field to run while this field is dirty.
   page.wait_for_timeout(150)
   check(lang+' pending rendering preserves the focused source field',source.input_value()=='Synthetic measurement source' and source.evaluate('el=>el===document.activeElement'))
   source.press('Tab')
   page.wait_for_function('SultanApp.getProject().transitions[0].annual[0].actual===59 && SultanApp.getProject().transitions[0].annual[0].actualSource==="Synthetic measurement source"')
   check(lang+' reading commits when moving directly between fields',True)
   page.reload(wait_until='load');page.wait_for_selector('.final-dashboard')
   check(lang+' reading and source survive reload',page.evaluate('SultanApp.getProject().transitions[0].annual[0].actual===59 && SultanApp.getProject().transitions[0].annual[0].actualSource==="Synthetic measurement source"'))
   check(lang+' actual reaches chart',page.locator('.final-dashboard [data-series="actual"][data-value="59"]').count()>0)
   check(lang+' below-target status is behind',page.locator('.final-dashboard .status.behind').count()>0)
   check(lang+' unknown costs disclosed',page.locator('.review-executive').inner_text().find(page.evaluate('SultanI18n.t("unknownCostSummary",[Sultan.selectedInitiatives(SultanApp.getProject()).length])'))>=0)
   page.evaluate('''()=>{const p=SultanApp.getProject();Sultan.addContextReview(p,{model:'test-fixture',summary:'Current review',items:[{section:'roadmap',severity:'blocking',message:'Synthetic old gap'}]});SultanApp.setProject(p);}''')
   page.wait_for_selector('.ai-review');check(lang+' review fresh before edit',page.evaluate('Sultan.contextReviewIsCurrent(SultanApp.getProject())'))
   page.locator('#navigation [data-section="choices"]').click();page.locator('[data-path="options.0.decision"]').select_option('defer');page.locator('#navigation [data-section="review"]').click()
   expect(page.locator('.review-stale')).to_be_visible()
   check(lang+' stale finding removed from current checks',page.evaluate('!Sultan.check(SultanApp.getProject()).some(i=>i.entity==="ai-review")'))
   check(lang+' report flags stale review and excludes old finding',page.evaluate('SultanApp.getReport().includes(SultanI18n.t("ctxReviewStale"))&&!SultanApp.getReport().includes("Synthetic old gap")'))
   page.locator('.export-menu > summary').click()
   with page.expect_download() as dl:page.locator('[data-exec="leadership-report"]').click()
   dest=QA/f'audit-leadership-{lang}.html';dl.value.save_as(str(dest));report=dest.read_text()
   check(lang+' leadership retains unresolved issues', 'data-report-section="issues"' in report)
   check(lang+' leadership exports stale-review notice',page.evaluate('SultanI18n.t("ctxReviewStale")') in report)
   if not page.locator('.export-menu').evaluate('el=>el.open'):page.locator('.export-menu > summary').click()
   with page.expect_download() as dl:page.locator('[data-action="project"]').click()
   dest=QA/f'audit-project-{lang}.json';dl.value.save_as(str(dest));saved=json.loads(dest.read_text())
   check(lang+' project export preserves readings and decision',saved['transitions'][0]['annual'][0]['actual']==59 and saved['options'][0]['decision']=='defer')
   page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100)
   check(lang+' review fits mobile',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   check(lang+' no JavaScript errors',not errors)
   page.screenshot(path=str(QA/f'audit-review-{lang}.png'));ctx.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'tests':len(results),'passed':sum(x['pass'] for x in results),'results':results,'live':bool(LIVE)}
(QA/'consulting-audit-browser-results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(f"Audit browser checks: {report['passed']}/{report['tests']}")
