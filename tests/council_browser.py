"""Isolated synthetic council journeys; no real project or provider request."""
from pathlib import Path
import functools,http.server,threading,os,json,zipfile,io,re
from playwright.sync_api import sync_playwright,expect
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
   ctx=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,reduced_motion='reduce');page=ctx.new_page();errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:print('BROWSER '+m.text,flush=True) if m.type=='error' else None);page.on('request',lambda r:requests.append(r.url));page.goto(url+'?lang='+lang,wait_until='load');prefix=lang+' / '
   check(prefix+'one heading and current version',page.locator('h1').count()==1 and page.evaluate('SULTAN_VERSION')=='0.12.0-beta')
   page.locator('[data-beta="feedback"]').first.click();expect(page.locator('#feedbackDialog')).to_be_visible();check(prefix+'feedback version matches','0.12.0-beta' in page.locator('#feedbackDialog').inner_text() and 'BETA 0.6' not in page.locator('#feedbackDialog').inner_text());page.keyboard.press('Escape')
   check(prefix+'export libraries load only on demand',not any('assets/jspdf-' in r or 'assets/pptxgen-' in r for r in requests))
   page.evaluate('SultanApp.setProject(Sultan.demo());SultanCouncilUI.open("share")');page.wait_for_selector('#co-days')
   check(prefix+'no legacy section controls',page.locator('.exec-toolbar').count()==0 and page.locator('.collaboration-bar').count()==0)
   before=page.evaluate('JSON.stringify(SultanApp.getProject().options)');page.locator('[data-co="read"]').click();expect(page.locator('#co-status')).not_to_have_text('');check(prefix+'explicit share consent',page.locator('.co-link').count()==0);page.locator('#co-share-consent').check()
   for i in range(1,4):page.locator('#co-owner-'+str(i)).fill('Fictional owner '+str(i))
   page.locator('[data-co="invite"]').click();expect(page.locator('.co-link')).to_have_count(3);invitations=page.locator('.co-link textarea').evaluate_all('(els)=>els.map(e=>e.value)')
   check(prefix+'three distinct signed fragment links',len(invitations)==3 and all('share.html#s=' in v for v in invitations) and len(set(invitations))==3)
   check(prefix+'no private keys in project',page.evaluate('!JSON.stringify(SultanApp.getProject()).includes("privateKey")&&!JSON.stringify(SultanApp.getProject()).includes("replyKey")'))
   ownerctx=browser.new_context();owner=ownerctx.new_page();owner_requests=[];owner.on('request',lambda r:owner_requests.append(r.url));owner.goto(invitations[0],wait_until='load');expect(owner.locator('#share-reply-form')).to_be_visible()
   check(prefix+'reader has no workspace or saved data',owner.evaluate('typeof SultanApp==="undefined"&&localStorage.length===0'))
   check(prefix+'reader sends no project-bearing request',all('#' not in r and 'snapshot' not in r and 'PRIVATE' not in r for r in owner_requests))
   check(prefix+'fictional example remains labelled',('Fictional' if lang=='en' else 'افتراضي') in owner.locator('header').inner_text())
   owner.locator('#share-stance').select_option('changes');owner.locator('#share-comment').fill('Synthetic review: verify baseline <img src=x onerror=alert(1)>');owner.locator('#share-reply-form button').click();expect(owner.locator('#share-return-link')).to_be_visible();response=owner.locator('#share-return-link').input_value()
   page.locator('#co-reply').fill(response);page.locator('[data-co="accept"]').click();expect(page.locator('.co-response').first).to_contain_text('Synthetic review')
   check(prefix+'collect response without changing choices',page.evaluate('SultanApp.getProject().council.responses.length===1') and page.evaluate('JSON.stringify(SultanApp.getProject().options)')==before)
   check(prefix+'response text escaped',page.locator('.co-response img').count()==0)
   page.locator('#co-reply').fill(response);page.locator('[data-co="accept"]').click();expect(page.locator('#co-status')).to_contain_text('بالفعل' if lang=='ar' else 'already');check(prefix+'reject duplicate response',page.evaluate('SultanApp.getProject().council.responses.length===1'))
   page.locator('#co-share-consent').check();page.locator('[data-co="read"]').click();expect(page.locator('.co-link')).to_have_count(1);owner.goto(page.locator('.co-link textarea').input_value());expect(owner.locator('#share-reply-form')).to_have_count(0);check(prefix+'read-only snapshot has no editing form',owner.locator('[data-path]').count()==0)
   page.locator('[data-co-tab="journal"]').click();page.locator('#co-label').fill('Synthetic pilot decision');page.locator('#co-date').fill('2027-03-15');page.locator('#co-note').fill('Confirm assumptions before expanding.');page.locator('[data-co="checkpoint"]').click();expect(page.locator('#co-status')).to_contain_text('حُفظت' if lang=='ar' else 'saved');check(prefix+'checkpoint persisted',page.evaluate('SultanApp.getProject().council.checkpoints.length===1'))
   page.evaluate('const p=SultanApp.getProject();p.transitions[0].baseline=0;SultanApp.setProject(p)');expect(page.locator('.co-table tbody tr')).to_have_count(1);check(prefix+'field comparison preserves zero',page.locator('.co-table tbody tr td').last.inner_text()=='0')
   with page.expect_download() as cal:page.locator('[data-co="calendar"]').click()
   cal.value.save_as(str(QA/f'council-calendar-{lang}.ics'));ics=(QA/f'council-calendar-{lang}.ics').read_text();check(prefix+'calendar date and reminder','DTSTART;VALUE=DATE:20270315' in ics and 'BEGIN:VALARM' in ics)
   page.locator('[data-co-tab="share"]').click();expect(page.locator('.co-validity')).to_contain_text('تغيّرت' if lang=='ar' else 'changed');check(prefix+'response freshness follows plan',True)
   page.locator('[data-co-tab="adversary"]').click();page.locator('[data-co="local"]').click();expect(page.locator('.co-finding')).not_to_have_count(0);check(prefix+'local falsification questions',page.evaluate('SultanApp.getProject().council.reviews.at(-1).findings.every(f=>f.challenge&&f.test)'));check(prefix+'local review makes no provider request',not any('/v1/messages' in r for r in requests));check(prefix+'relative sensitivity disclosed','10%' in page.locator('.co-stress').inner_text())
   page.locator('[data-co="ai"]').click();expect(page.locator('#co-status')).to_contain_text('اضبط' if lang=='ar' else 'Configure');check(prefix+'AI requires consent and configuration',not any('/v1/messages' in r for r in requests));ai_requests=[]
   def ai_reply(route):
    ai_requests.append(json.loads(route.request.post_data));route.fulfill(status=200,content_type='application/json',body=json.dumps({'model':'synthetic-test-model','usage':{'input_tokens':1,'output_tokens':1},'content':[{'type':'text','text':json.dumps({'summary':'Synthetic adversarial review','findings':[{'rule':'evidence','subject':'Synthetic goal','evidence':'No independent baseline','challenge':'What would disprove it?','test':'Verify independently.'}]})}]}))
   page.route('**/v1/messages',ai_reply);page.evaluate('SultanAI.saveSettings({consent:true,transport:"proxy"})');page.locator('#co-ai-consent').check();page.locator('[data-co="ai"]').click();expect(page.locator('.co-review-summary')).to_have_text('Synthetic adversarial review');check(prefix+'AI uses transport and audit log',len(ai_requests)==1 and page.evaluate('SultanApp.getProject().context.ai.log.at(-1).purpose')=='adversarial-review');check(prefix+'AI excludes keys and council responses',not any(v in json.dumps(ai_requests[0]) for v in ['privateKey','replyKey','share.html#','Synthetic review: verify']))
   page.locator('[data-co-tab="board"]').click()
   for width in [390,768,1440]:page.set_viewport_size({'width':width,'height':1000});check(prefix+f'council fits {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   page.screenshot(path=str(QA/f'council-board-{lang}.png'))
   with page.expect_download(timeout=90000) as download:page.locator('[data-co="board"]').click()
   pack=QA/f'council-board-{lang}.zip';download.value.save_as(str(pack))
   with zipfile.ZipFile(pack) as z:
    check(prefix+'ZIP has PDF PPTX appendix calendar',set(z.namelist())=={'SULTAN_Board.pdf','SULTAN_Board.pptx','SULTAN_Board_Appendix.html','SULTAN_Review_Dates.ics'})
    check(prefix+'multipage PDF',z.read('SULTAN_Board.pdf').startswith(b'%PDF-') and len(re.findall(rb'/Type /Page\b',z.read('SULTAN_Board.pdf')))>=9)
    with zipfile.ZipFile(io.BytesIO(z.read('SULTAN_Board.pptx'))) as pptx:
     slides=[n for n in pptx.namelist() if re.match(r'ppt/slides/slide\d+\.xml$',n)];check(prefix+'editable PowerPoint text and shapes',len(slides)>=9 and all(b'<a:t>' in pptx.read(n) for n in slides) and any(b'<p:sp>' in pptx.read(n) for n in slides))
    appendix=z.read('SULTAN_Board_Appendix.html').decode();check(prefix+'appendix preserves review and escaped comments','Synthetic pilot decision' in appendix and 'What would disprove it?' in appendix and '&lt;img' in appendix)
   check(prefix+'export preserves document identity',page.evaluate('SultanApp.getProject().documentNumber')==1);page.reload();page.wait_for_selector('.co-tabs');check(prefix+'records survive reload',page.evaluate('SultanApp.getProject().council.responses.length===1&&SultanApp.getProject().council.checkpoints.length===1'));check(prefix+'visible version aligned',page.evaluate('SULTAN_VERSION') in page.locator('.final-version').inner_text())
   page.evaluate('SultanCouncilUI.open("journal")');page.locator('[data-co="offline"]').click()
   for attempt in range(300):
    if page.evaluate('()=>navigator.serviceWorker.controller!==null'):break
    page.wait_for_timeout(100)
   check(prefix+'worker activates under strict CSP',page.evaluate('()=>navigator.serviceWorker.controller!==null'));cdp=ctx.new_cdp_session(page);check(prefix+'browser installability',not cdp.send('Page.getInstallabilityErrors')['installabilityErrors'] and not cdp.send('Page.getAppManifest')['errors']);check(prefix+'app cache exists',page.evaluate('()=>caches.keys().then(k=>k.some(x=>x.startsWith("sultan-app-")))'))
   ctx.set_offline(True);page.reload(wait_until='load');page.wait_for_selector('.co-tabs');check(prefix+'offline app and records reopen',page.evaluate('SultanApp.getProject().council.checkpoints.length===1'));page.evaluate('SultanCouncilUI.open("board")')
   with page.expect_download(timeout=90000) as off:page.locator('[data-co="board"]').click()
   off.value.save_as(str(QA/f'council-offline-{lang}.zip'));check(prefix+'offline board export',(QA/f'council-offline-{lang}.zip').stat().st_size>10000);ctx.set_offline(False);check(prefix+'no JavaScript errors',not errors);ownerctx.close();ctx.close()
  if not LIVE:
   ctx=browser.new_context(accept_downloads=True);p=ctx.new_page();p.goto((BASE/'release/SULTAN_Strategy_Builder.html').as_uri());p.evaluate('SultanApp.setProject(Sultan.demo());SultanCouncilUI.open("board")');ctx.set_offline(True)
   with p.expect_download(timeout=90000) as d:p.locator('[data-co="board"]').click()
   d.value.save_as(str(QA/'council-standalone.zip'));check('standalone / local board pack',(QA/'council-standalone.zip').stat().st_size>10000);check('standalone / share targets hosted reader',p.evaluate('SultanShare.link("j.AA")').startswith('https://sultan-strategy-beta.onrender.com/share.html#'));ctx.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'tests':len(results),'passed':sum(x['pass'] for x in results),'results':results,'live':bool(LIVE),'url':url};(QA/'council-browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(f'Council browser checks: {report["passed"]}/{report["tests"]}')
