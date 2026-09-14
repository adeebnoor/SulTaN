"""Regression checks for edit semantics, recovery and accessibility hardening."""
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
  ctx=browser.new_context(viewport={'width':1280,'height':900})
  page=ctx.new_page();page.on('dialog',lambda d:d.accept());page.goto(url)
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
  # Recovery is written after an uncommitted pause and restored on reload.
  field=page.locator('[data-path="institution.name"]');field.focus();field.fill('Recovered draft')
  page.wait_for_timeout(650)
  recovery=page.evaluate("JSON.parse(localStorage.getItem('sultan.strategy.builder.v0.5.recovery'))")
  assert recovery and recovery['project']['institution']['name']=='Recovered draft'
  page.reload();page.wait_for_timeout(150)
  assert page.evaluate('SultanApp.getProject().institution.name')=='Recovered draft'
  assert page.evaluate("localStorage.getItem('sultan.strategy.builder.v0.5.recovery')") is None
  # User-controlled details state survives re-rendering in the same session.
  page.evaluate('SultanApp.navigate("priorities")')
  detail=page.locator('#content details').first
  detail.evaluate('(d)=>d.open=false');page.wait_for_timeout(30)
  page.locator('[data-path="criteria.0.weight"]').fill('24');page.locator('[data-path="criteria.0.weight"]').press('Tab');page.wait_for_timeout(100)
  assert detail.evaluate('(d)=>d.open') is False
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  ctx.close();browser.close()
finally:
 server.shutdown()
print('Hardening browser tests: passed')
