"""Regression checks for edit semantics, recovery, accessibility, Authority Space and execution upgrades."""
from pathlib import Path
import functools, http.server, json, threading
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1]
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public'))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/?lang=en'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  ctx=browser.new_context(viewport={'width':1280,'height':900},accept_downloads=True)
  page=ctx.new_page();page.on('dialog',lambda d:d.accept());page.goto(url)
  # Empty projects should not export a strategy.
  assert page.locator('[data-action="report"]').is_disabled()
  page.locator('[data-action="demo"]').first.click()
  field=page.locator('[data-path="institution.name"]')
  start=page.evaluate('SultanApp.getProject().revision')
  field.focus();field.fill('One committed edit')
  mid=page.evaluate('SultanApp.getProject().revision')
  assert mid==start, (start,mid)
  field.press('Tab');page.wait_for_timeout(100)
  end=page.evaluate('SultanApp.getProject().revision')
  assert end==start+1, (start,end)
  assert page.evaluate('SultanApp.getProject().institution.name')=='One committed edit'
  assert page.locator('[data-path="institution.name"]').get_attribute('aria-describedby').endswith('_error')
  field=page.locator('[data-path="institution.name"]');field.focus();field.fill('Recovered draft')
  page.wait_for_timeout(650)
  recovery=page.evaluate("JSON.parse(localStorage.getItem('sultan.strategy.builder.v0.5.recovery'))")
  assert recovery and recovery['project']['institution']['name']=='Recovered draft'
  page.reload();page.wait_for_timeout(150)
  assert page.evaluate('SultanApp.getProject().institution.name')=='Recovered draft'
  assert page.evaluate("localStorage.getItem('sultan.strategy.builder.v0.5.recovery')") is None
  # Step badges and decision switch-point card exist.
  page.evaluate('SultanApp.navigate("priorities")');page.wait_for_timeout(100)
  assert page.locator('#navigation .exec-badge').count()>=6
  assert page.locator('.break-even-card').is_visible()
  # Authority Space separates ownership clarity from status clarity and surfaces all actions.
  page.evaluate('SultanApp.navigate("enablers")');page.wait_for_timeout(120)
  panel=page.locator('.authority-space');assert panel.is_visible();assert 'Authority Space' in panel.inner_text()
  model=page.evaluate('Sultan.authoritySpace(SultanApp.getProject())')
  o1=next(x for x in model if x['optionId']=='o1');o2=next(x for x in model if x['optionId']=='o2')
  assert o1['ownershipClarity']==100 and o1['statusClarity']==100 and o1['clearance']==0 and 'escalate' in o1['actions']
  assert o2['ownershipClarity']==100 and o2['statusClarity']==0 and o2['clearance']==0 and 'learn' in o2['actions']
  assert '1 / 1' in panel.inner_text()
  # Unknown/pending authority must be visible in the global issue system.
  issues=page.evaluate('Sultan.check(SultanApp.getProject()).filter(x=>x.section==="enablers").map(x=>x.message)')
  assert any('pending' in x.lower() for x in issues)
  assert any('status' in x.lower() for x in issues)
  # Escalation pack must include unresolved external/shared authority decisions.
  items=page.evaluate('Sultan.authorityEscalationItems(SultanApp.getProject())')
  assert len(items)>=1 and all('route' in x and 'fallback' in x for x in items)
  with page.expect_download() as dl:page.locator('[data-exec="escalation"]').click()
  dl.value.save_as(str(BASE/'qa/escalation-pack.html'))
  assert 'Escalation pack' in (BASE/'qa/escalation-pack.html').read_text()
  # Section-level collaboration export works without a server.
  with page.expect_download() as dl:page.locator('[data-exec="section-export"]').click()
  dl.value.save_as(str(BASE/'qa/enablers-section.json'))
  frag=json.loads((BASE/'qa/enablers-section.json').read_text());assert frag['kind']=='sultan.section.v1' and frag['section']=='enablers'
  # Leadership report includes Authority Space and escalation material.
  page.evaluate('SultanApp.navigate("review")');page.wait_for_timeout(100)
  with page.expect_download() as dl:page.locator('[data-exec="leadership-report"]').click()
  dl.value.save_as(str(BASE/'qa/leadership-report.html'));report=(BASE/'qa/leadership-report.html').read_text()
  assert 'Authority Space' in report and 'Escalation pack' in report
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  ctx.close();browser.close()
finally:
 server.shutdown()
print('Hardening browser tests: passed')
