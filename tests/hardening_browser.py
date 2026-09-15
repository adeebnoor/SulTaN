"""Regression checks for edit semantics, recovery, accessibility, Authority Space and execution upgrades."""
from pathlib import Path
import functools, http.server, json, threading, os
from playwright.sync_api import sync_playwright
from review_regressions import run_review_regressions
BASE=Path(__file__).resolve().parents[1]
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public'))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base_url=os.environ.get('SULTAN_BASE_URL',f'http://127.0.0.1:{server.server_port}/').rstrip('/')+'/'
url=base_url+'?lang=en'
(BASE/'qa').mkdir(exist_ok=True)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['CHROMIUM_PATH']} if os.environ.get('CHROMIUM_PATH') else {}))
  ctx=browser.new_context(viewport={'width':1280,'height':900},accept_downloads=True)
  page=ctx.new_page();page.on('dialog',lambda d:d.accept());page.goto(url)
  assert page.locator('[data-action="report"]').is_disabled()
  page.locator('[data-action="demo"]').first.click()
  field=page.locator('[data-path="institution.name"]')
  start=page.evaluate('SultanApp.getProject().revision')
  field.focus();field.fill('One committed edit');mid=page.evaluate('SultanApp.getProject().revision');assert mid==start
  field.press('Tab');page.wait_for_timeout(100);end=page.evaluate('SultanApp.getProject().revision');assert end==start+1
  assert page.evaluate('SultanApp.getProject().institution.name')=='One committed edit'
  assert page.locator('[data-path="institution.name"]').get_attribute('aria-describedby').endswith('_error')
  field=page.locator('[data-path="institution.name"]');field.focus();field.fill('Recovered draft');page.wait_for_timeout(650)
  recovery=page.evaluate("JSON.parse(localStorage.getItem('sultan.strategy.builder.v0.5.recovery'))");assert recovery and recovery['project']['institution']['name']=='Recovered draft'
  page.reload();page.wait_for_timeout(150);assert page.evaluate('SultanApp.getProject().institution.name')=='Recovered draft';assert page.evaluate("localStorage.getItem('sultan.strategy.builder.v0.5.recovery')") is None

  # Every choice gets a structured assumption register; accountability fields survive navigation.
  page.evaluate('SultanApp.navigate("choices")');page.wait_for_timeout(100)
  assert page.locator('.assumption-register').count()>=3
  assumption=page.locator('[data-path="options.0.assumptions.0.text"]')
  assumption.fill('Demand remains strong');assumption.press('Tab');page.wait_for_timeout(80)
  assert page.evaluate('SultanApp.getProject().options[0].assumptions[0].text')=='Demand remains strong'
  assert page.locator('[data-path="options.0.assumptions.0.expectedPersistence"]').count()==1
  assert page.locator('[data-path="options.0.assumptions.0.testEvidence"]').count()==1

  # Decision switch points, live sensitivity, polarity and exact-zero normalization.
  page.evaluate('SultanApp.navigate("priorities")');page.wait_for_timeout(120)
  assert page.locator('#navigation .exec-badge').count()>=6
  assert page.locator('.break-even-card').is_visible() and page.locator('[data-sensitivity]').count()>=4
  before=page.evaluate('Sultan.score(SultanApp.getProject(),SultanApp.getProject().options[0]).value')
  page.locator('[data-polarity="0"]').select_option('cost');page.wait_for_timeout(100)
  after=page.evaluate('Sultan.score(SultanApp.getProject(),SultanApp.getProject().options[0]).value')
  assert before!=after
  # All-zero normalize distributes weights instead of NaN/Infinity and closes at exactly 100.
  page.evaluate('(()=>{const p=SultanApp.getProject();p.criteria.forEach(c=>c.weight=0);SultanApp.setProject(p);SultanApp.navigate("priorities")})()');page.wait_for_timeout(100)
  page.locator('[data-action="normalize"]').click();page.wait_for_timeout(100)
  assert abs(page.evaluate('SultanApp.getProject().criteria.reduce((a,c)=>a+c.weight,0)')-100)<1e-8

  # Restore fictional example for deterministic Authority Space checks.
  page.evaluate('SultanApp.setProject(Sultan.demo());SultanApp.navigate("enablers")');page.wait_for_timeout(140)
  panel=page.locator('.authority-space');assert panel.is_visible();assert 'Authority Space' in panel.inner_text()
  model=page.evaluate('Sultan.authoritySpace(SultanApp.getProject())');o1=next(x for x in model if x['optionId']=='o1');o2=next(x for x in model if x['optionId']=='o2')
  assert o1['ownershipClarity']==100 and o1['statusClarity']==100 and o1['clearance']==33 and 'resolve' in o1['actions'] and 'escalate' in o1['actions']
  assert o2['ownershipClarity']==100 and o2['statusClarity']==0 and o2['clearance']==0 and 'learn' in o2['actions']
  assert '1 / 1' in panel.inner_text()
  issues=page.evaluate('Sultan.check(SultanApp.getProject()).filter(x=>x.section==="enablers").map(x=>x.message)')
  assert any('pending' in x.lower() for x in issues) and any('status' in x.lower() for x in issues)
  items=page.evaluate('Sultan.authorityEscalationItems(SultanApp.getProject())');assert len(items)>=1 and all('route' in x and 'fallback' in x for x in items)
  if not page.locator('.export-menu').evaluate('(d)=>d.open'):page.locator('.export-menu > summary').click()
  with page.expect_download() as dl:page.locator('[data-exec="escalation"]').click()
  dl.value.save_as(str(BASE/'qa/escalation-pack.html'));assert 'Escalation pack' in (BASE/'qa/escalation-pack.html').read_text()
  with page.expect_download() as dl:page.locator('[data-exec="section-export"]').click()
  dl.value.save_as(str(BASE/'qa/enablers-section.json'));frag=json.loads((BASE/'qa/enablers-section.json').read_text());assert frag['kind']=='sultan.section.v2' and frag['section']=='enablers' and 'owner' in frag and 'contributions' in frag

  # Roadmap has a visual timeline; review has matrix + funding, final dashboard and leadership export.
  page.evaluate('SultanApp.navigate("roadmap")');page.wait_for_timeout(120);assert page.locator('.exec-timeline').is_visible();assert page.locator('.timeline-cell.active').count()>0
  page.evaluate('SultanApp.navigate("review")');page.wait_for_timeout(120);assert page.locator('.portfolio-review').is_visible();assert page.locator('.matrix-dot').count()>=1
  assert page.locator('.final-dashboard').is_visible() and page.locator('.executive-summary').count()>=1
  if not page.locator('.export-menu').evaluate('(d)=>d.open'):page.locator('.export-menu > summary').click()
  with page.expect_download() as dl:page.locator('[data-exec="leadership-report"]').click()
  dl.value.save_as(str(BASE/'qa/leadership-report.html'));report=(BASE/'qa/leadership-report.html').read_text();assert 'Authority Space' in report and 'Escalation pack' in report and 'Executive decision summary' in report
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  ctx.close()
  run_review_regressions(browser,base_url,BASE/'qa')
  browser.close()
finally:
 server.shutdown()
print('Hardening browser tests: passed')
