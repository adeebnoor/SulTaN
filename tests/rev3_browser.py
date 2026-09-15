"""Measured rev-3 homepage guard: length, contrast, repetition and evidence tabs."""
from pathlib import Path
import functools,http.server,json,os,threading
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1];QA=BASE/'qa';QA.mkdir(exist_ok=True)
LIVE=os.environ.get('SULTAN_LIVE_URL','');server=None
if LIVE:url=LIVE
else:
 handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(BASE/'public'))
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
results=[];measurements={}
def check(name,ok):
 results.append({'name':name,'pass':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
contrast_js=r'''() => {const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>Number(x.trim()));return[p[0],p[1],p[2],p.length>3?p[3]:1]},bg=el=>{for(let n=el;n;n=n.parentElement){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c[3]>.90)return c}return[255,255,255,1]},lum=c=>{const a=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]},ratio=(a,b)=>{a=lum(a);b=lum(b);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};return[...document.querySelectorAll('a,button')].filter(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return el.textContent.trim()&&cs.visibility!=='hidden'&&cs.display!=='none'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight}).map(el=>({text:el.textContent.trim().replace(/\s+/g,' ').slice(0,80),ratio:ratio(parse(getComputedStyle(el).color),bg(el))}))}'''
try:
 with sync_playwright() as pw:
  opts={'headless':True};
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts)
  for lang in ['ar','en']:
   page=browser.new_page(viewport={'width':1440,'height':900});page.goto(url+'?lang='+lang,wait_until='load');page.wait_for_function("document.body.dataset.rev3==='ready'");page.wait_for_timeout(120)
   pre=lang+' / '
   check(pre+'repetition bands removed',page.locator('.proof-strip,#value-difference').count()==0)
   check(pre+'comparison merged into methodology',page.locator('#methodology .rev3-method-contrast').count()==1 and page.locator('body>.hv-contrast,.public-entrance>.hv-contrast').count()==0)
   check(pre+'five evidence tabs one visible panel',page.locator('[data-rev3-tab]').count()==5 and page.locator('[data-rev3-panel]:visible').count()==1)
   check(pre+'quick journey merged into closing CTA',page.locator('.quick-section').count()==0 and page.locator('.bottom-cta .rev3-quick-inline').count()==1)
   page.evaluate('scrollTo(0,0)');dcontrast=page.evaluate(contrast_js);dratio=page.evaluate('document.documentElement.scrollHeight/innerHeight')
   check(pre+'desktop <= 5.5 screens',dratio<=5.5);check(pre+'desktop above-fold contrast >= 4.5',dcontrast and min(x['ratio'] for x in dcontrast)>=4.5)
   page.set_viewport_size({'width':390,'height':844});page.evaluate('scrollTo(0,0)');page.wait_for_timeout(80);mcontrast=page.evaluate(contrast_js);mratio=page.evaluate('document.documentElement.scrollHeight/innerHeight')
   check(pre+'mobile <= 9 screens',mratio<=9.0);check(pre+'mobile above-fold contrast >= 4.5',mcontrast and min(x['ratio'] for x in mcontrast)>=4.5);check(pre+'mobile two-number summary before CTA',page.locator('.rev3-mobile-metrics:visible').count()==1)
   measurements[lang]={'desktopScreens':dratio,'mobileScreens':mratio,'desktopMinContrast':min(x['ratio'] for x in dcontrast),'mobileMinContrast':min(x['ratio'] for x in mcontrast)}
   page.screenshot(path=str(QA/f'rev3-home-{lang}.png'),full_page=True);page.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'tests':len(results),'passed':sum(x['pass'] for x in results),'results':results,'measurements':measurements,'live':bool(LIVE)};(QA/'rev3-browser-results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(f"SULTAN rev3: {report['passed']}/{report['tests']}")
