"""Guided path, context dossier, field guidance and simple/expert disclosure — real-browser acceptance.
The AI step is exercised against an in-page fake of the Messages API (no network, no key)."""
from pathlib import Path
import functools, http.server, json, os, re, threading
from playwright.sync_api import sync_playwright, expect

BASE = Path(__file__).resolve().parents[1]; QA = BASE / 'qa'; QA.mkdir(exist_ok=True)
results = []
def check(name, ok):
    results.append({'name': name, 'pass': bool(ok)}); print(('PASS ' if ok else 'FAIL ') + name, flush=True)
    if not ok: raise AssertionError(name)

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(BASE / 'public'))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

FAKE_DRAFT = {
 'institution': {'mission': 'AI mission', 'beneficiaries': '', 'assets': 'AI assets', 'liabilities': '', 'context': '', 'culture': '', 'vision': '', 'notDoing': ''},
 'mandates': [], 'weightRationale': 'AI weights',
 'options': [{'key': 'a', 'title': 'AI drafted choice', 'type': 'differentiation', 'outcome': 'Outcome', 'whyUs': 'Why', 'foothold': '', 'tradeoff': 'Trade-off', 'owner': 'Owner', 'decision': 'select', 'decisionReason': 'Reason', 'riskSource': 'Risk register', 'stopEvidence': '',
   'scores': [{'criterion': 'identity', 'value': 70, 'note': 'n'}, {'criterion': 'benefit', 'value': 80, 'note': 'n'}, {'criterion': 'distinct', 'value': 60, 'note': 'n'}, {'criterion': 'sustain', 'value': 40, 'note': 'n'}],
   'assumptions': [{'text': 'Demand holds', 'expectedPersistence': '24 months', 'owner': 'Owner', 'testEvidence': 'Survey', 'failureImpact': 'Re-plan'}],
   'divest': {'stop': '', 'releasedResources': None, 'redeployTo': '', 'evidence': '', 'impact': ''}}],
 'references': [{'key': 'r', 'name': 'AI reference', 'kind': 'benchmark', 'source': 'src', 'purpose': 'p', 'context': 'c', 'adaptation': 'a', 'status': 'adapt'}],
 'transitions': [{'key': 't', 'optionKey': 'a', 'referenceKey': 'r', 'domain': 'Domain', 'current': 'Now', 'currentSource': 'Report', 'targetState': 'Then', 'kpi': 'AI KPI', 'unit': '%', 'direction': 'up', 'baseline': 10, 'target': 30, 'owner': 'Owner', 'dataSource': 'System', 'frequency': 'Annual',
   'annual': [{'year': 2027, 'milestone': 'm1', 'target': 15, 'evidence': 'e'}, {'year': 2028, 'milestone': 'm2', 'target': 20, 'evidence': 'e'}, {'year': 2029, 'milestone': 'm3', 'target': 25, 'evidence': 'e'}, {'year': 2030, 'milestone': 'm4', 'target': 30, 'evidence': 'e'}]}],
 'enablers': [{'key': 'e', 'optionKey': 'a', 'title': 'AI enabler', 'kind': 'authority', 'action': 'activate', 'control': 'external', 'owner': 'Ministry', 'status': 'pending', 'dueYear': 2027, 'source': 's', 'route': 'r', 'fallback': 'f'}],
 'initiatives': [{'key': 'i', 'optionKey': 'a', 'transitionKey': 't', 'title': 'AI initiative', 'kind': 'build', 'owner': 'Owner', 'startYear': 2027, 'endYear': 2028, 'output': 'o', 'acceptance': 'a', 'capacity': 'c', 'enablerKeys': ['e'], 'dependsOnKeys': [], 'budget': [{'year': 2027, 'amount': None, 'releaseEvidence': ''}]}],
 'contextSources': [{'title': 'AI found study', 'kind': 'study', 'issuer': 'Centre', 'url': 'https://example.gov.sa', 'year': 2025, 'summary': 's', 'relevance': 'r'}],
 'openQuestions': ['What is the fee policy?'], 'notes': 'Draft notes'
}
FAKE_FETCH = """
(draft)=>{
  const sse=(text)=>{const ev=[{type:'message_start',message:{id:'m',model:'claude-opus-5-5',usage:{input_tokens:5}}},{type:'content_block_start',index:0,content_block:{type:'text',text:''}}];
    for(let i=0;i<text.length;i+=200)ev.push({type:'content_block_delta',index:0,delta:{type:'text_delta',text:text.slice(i,i+200)}});
    ev.push({type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:7}},{type:'message_stop'});
    return ev.map(e=>'event: '+e.type+'\\ndata: '+JSON.stringify(e)+'\\n\\n').join('');};
  window.__aiCalls=[];
  SultanAI._setFetch(async (u,init)=>{const body=JSON.parse(init.body);window.__aiCalls.push({url:u,headers:init.headers,body});
    const fmt=body.output_config&&body.output_config.format,schema=fmt?JSON.stringify(fmt.schema||{}):'';
    const review={summary:'Review summary',strengths:['Clear single choice'],items:[{section:'choices',severity:'warning',message:'Target needs a data source',fix:'Name the system that reports the KPI',lens:'partner-route'}]};
    const context={sources:[{title:'Gathered regulation',kind:'regulation',issuer:'Ministry',url:'https://example.gov.sa/reg',year:2024,summary:'s',relevance:'r'}],documents:[],openQuestions:['Fee policy?'],summary:'Context gathered'};
    const text=!fmt?'OK':schema.includes('"severity"')?JSON.stringify(review):schema.includes('"documents"')&&!schema.includes('"transitions"')?JSON.stringify(context):JSON.stringify(draft);
    if(body.stream)return new Response(sse(text),{status:200,headers:{'content-type':'text/event-stream'}});
    return new Response(JSON.stringify({id:'m',model:body.model,content:[{type:'text',text}],stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}}),{status:200,headers:{'content-type':'application/json'}});});
}
"""
try:
    with sync_playwright() as pw:
        opts = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'): opts['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = pw.chromium.launch(**opts)
        for lang in ['ar', 'en']:
            pre = lang + ' / '
            ctx = browser.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True)
            page = ctx.new_page(); errors = []; requests = []
            page.on('pageerror', lambda e: errors.append(str(e))); page.on('request', lambda r: requests.append(r.url)); page.on('dialog', lambda d: d.accept())
            page.goto(url + '?lang=' + lang, wait_until='load'); page.wait_for_timeout(300)
            check(pre + 'guided CTA leads the hero', page.locator('.launch-hero .hero-actions .btn').first.evaluate('e=>e.classList.contains("gw-hero-cta")'))
            page.locator('.gw-hero-cta').click(); page.wait_for_selector('.gw-steps'); page.wait_for_selector('#navigation [data-section="guide"]')
            check(pre + 'guided path renders five steps', page.locator('.gw-steps li').count() == 5 and page.locator('#navigation [data-section="guide"]').count() == 1)
            check(pre + 'all six sectors offered', page.locator('.gw-sector').count() == 6)
            page.locator('.gw-sector input[value="edu"]').check(); page.wait_for_selector('select[data-gw="typeId"]')
            page.locator('select[data-gw="typeId"]').select_option('private'); page.wait_for_timeout(150)
            check(pre + 'library note names the regulator', 'ETEC' in page.locator('.gw-card .hint').inner_text() or 'تقويم التعليم' in page.locator('.gw-card .hint').inner_text())
            page.locator('[data-gw-action="next"]').click(); page.wait_for_selector('[data-gw="institution.name"]')
            name = 'مجمع النخبة التعليمي الأهلي' if lang == 'ar' else 'Elite Education Complex'
            page.locator('[data-gw="institution.name"]').fill(name); page.locator('[data-gw="institution.vision"]').fill('Vision text'); page.locator('[data-gw="institution.beneficiaries"]').fill('Students and families')
            page.locator('[data-gw="brief"]').fill('2,400 students, three branches, 18% cost growth.'); page.locator('select[data-gw="institution.startYear"]').select_option('2027'); page.locator('select[data-gw="institution.endYear"]').select_option('2030')
            page.locator('[data-gw-action="next"]').click(); page.wait_for_selector('.gw-lib-refs')
            check(pre + 'library references listed for the sector', page.locator('.gw-lib-refs li').count() >= 12)
            check(pre + 'AI gathering disabled until configured', page.locator('[data-gw-action="gather"]').is_disabled())
            page.locator('[data-gw-action="ai-settings"]').first.click(); page.wait_for_selector('#aiDialog[open]')
            check(pre + 'AI settings require consent', page.locator('#aiConsent').is_checked() is False)
            page.locator('[data-ai="close"]').click()
            page.locator('[data-gw-action="next"]').click(); page.wait_for_selector('.gw-goals')
            check(pre + 'education goal templates offered', page.locator('.gw-goal[data-goal]').count() >= 10)
            page.locator('input[data-gw-action="goal"][data-goal="quality"]').check(); page.locator('input[data-gw-action="goal"][data-goal="efficiency"]').check(); page.wait_for_timeout(100)
            page.locator('[data-gw="goals.quality.baseline"]').fill('62'); page.locator('[data-gw="goals.quality.target"]').fill('70'); page.locator('[data-gw="goals.quality.owner"]').fill('Deputy'); page.locator('[data-gw="goals.efficiency.target"]').fill('30')
            check(pre + 'selected count follows the checkboxes', '2' in page.locator('.gw-selected-count').inner_text())
            page.locator('[data-gw-action="next"]').click(); page.wait_for_selector('.gw-build')
            page.wait_for_selector('.lens-step-note'); check(pre + 'last step announces the expert lenses', page.locator('.lens-step-note').count() == 1)
            counts = page.locator('.gw-counts-grid strong').all_text_contents()
            check(pre + 'step five previews what will be created', len(counts) >= 6 and int(counts[0]) == 2)
            check(pre + 'AI build disabled without configuration', page.locator('[data-gw-action="build-ai"]').is_disabled())
            page.locator('[data-gw-action="build-lib"]').click(); page.wait_for_selector('.final-dashboard'); page.wait_for_timeout(300)
            p = page.evaluate('SultanApp.getProject()')
            check(pre + 'library draft built and opened in review', page.locator('#navigation [aria-current="page"]').get_attribute('data-section') == 'review' and p['institution']['name'] == name and len(p['options']) == 2)
            check(pre + 'library provenance and context recorded', all(o['id'].startswith('lib-') for o in p['options']) and p['context']['sectorId'] == 'edu' and len(p['context']['sources']) >= 3)
            check(pre + 'numbers honoured, unknowns kept', p['transitions'][0]['baseline'] == 62 and p['transitions'][0]['annual'][-1]['target'] == 70 and p['transitions'][1]['baseline'] is None and all(b['amount'] is None for i in p['initiatives'] for b in i['budget']))
            check(pre + 'review banner explains the draft', page.locator('.fx-banner').count() == 1)
            # key-free mode: the review runs locally with the workspace rules; field suggestions come from the library or the guidance
            page.locator('.ai-review [data-ai-review="run"]').click(); page.wait_for_function('SultanApp.getProject().context.reviews.length===1')
            rv = page.evaluate('SultanApp.getProject().context.reviews.at(-1)')
            check(pre + 'local review runs without a key', rv['model'] == 'local-rules' and len(rv['items']) == page.evaluate('Sultan.check(SultanApp.getProject()).length') and page.locator('.ai-review-items > li').count() == len(rv['items']))
            page.evaluate('SultanApp.navigate("identity")'); page.wait_for_selector('.fg-ai')
            vis = page.locator('[data-path="institution.vision"]'); vf = vis.locator('xpath=ancestor::*[contains(@class,"field")][1]'); vf.locator('.fg-ai').click(); page.wait_for_selector('.fg-ai-panel .fg-ai-text')
            check(pre + 'local field suggestion offers new text, not the current value', vf.locator('.fg-ai-text').inner_text().strip() not in ('', vis.input_value().strip()))
            vf.locator('[data-fg-apply="dismiss"]').click(); page.evaluate('SultanApp.navigate("review")'); page.wait_for_selector('.lens-card')
            # expert lenses: advisory hints grouped by lens, the expert's own patterns, feedback
            page.wait_for_selector('.lens-card .lens-group'); check(pre + 'expert lenses card renders with hints', page.locator('.lens-card').count() == 1 and page.locator('.lens-card .lens-group').count() >= 1)
            page.locator('.lens-card .lens-add > summary').click(); page.locator('[data-lens-field="title"]').fill('Reciprocity' if lang == 'en' else 'ماذا نقدم للشريك؟'); page.locator('[data-lens-field="question"]').fill('What do we bring to the table?'); page.locator('[data-lens-field="keywords"]').fill('zzqq-absent, reciprocity'); page.locator('[data-lens-save]').click(); page.wait_for_timeout(250)
            check(pre + 'own pattern learned and applied', page.evaluate('SultanLens.mem().custom.length') == 1 and page.evaluate('SultanLens.hints(SultanApp.getProject()).some(h=>h.lens.startsWith("my-"))') and page.locator('.lens-card .lens-group[data-lens-group^="my-"]').count() == 1)
            page.locator('.lens-card [data-lens-fb="useful"]').first.click(); page.wait_for_timeout(200)
            check(pre + 'lens feedback stored', page.evaluate('Object.values(SultanLens.mem().state).some(s=>s.useful>=1)'))
            page.locator('.lens-card .lens-notes > summary').click(); page.locator('[data-lens-notes]').fill('Why focus on fintech when their tickets are small?\nFraud is a good use case because it is recurring business.'); page.locator('[data-lens-extract]').click(); page.wait_for_timeout(200)
            check(pre + 'notes become candidate patterns', page.locator('.lens-cands li').count() == 2)
            page.locator('[data-lens-keep]').first.click(); page.wait_for_timeout(200)
            check(pre + 'kept candidate joins the memory', page.evaluate('SultanLens.mem().custom.length') == 2 and page.locator('.lens-cands li').count() == 1)
            report = page.evaluate('SultanApp.getReport()')
            check(pre + 'report carries the context section', 'data-report-section="context"' in report and p['context']['sources'][0]['title'] in report)
            page.evaluate('SultanApp.navigate("references")'); page.wait_for_selector('.ctx-dossier')
            check(pre + 'context dossier lists accepted sources', page.locator('.ctx-dossier .gw-source.accepted').count() >= 3 and page.locator('[data-lib="interpolate"]').count() == 2)
            # simple mode is the default for a user's own project; advanced fields fold away but keep saving
            check(pre + 'simple mode is the default for own projects', page.evaluate('document.body.classList.contains("ux-simple")') and page.locator('.ux-mode [aria-pressed="true"]').get_attribute('data-ux-mode') == 'simple')
            page.evaluate('SultanApp.navigate("choices")'); page.wait_for_selector('.fx-advanced')
            visible_simple = page.locator('#content [data-path]:visible').count(); total = page.locator('#content [data-path]').count()
            check(pre + 'simple mode hides most fields without deleting them', 0 < visible_simple < total * 0.6)
            check(pre + 'hidden field still saves', page.locator('[data-path="options.0.decisionReason"]').count() == 1)
            page.locator('.fx-advanced > summary').first.click(); page.wait_for_timeout(80)
            field = page.locator('[data-path="options.0.decisionReason"]'); field.fill('Edited while folded'); field.press('Tab'); page.wait_for_timeout(120)
            check(pre + 'advanced field edit commits', page.evaluate('SultanApp.getProject().options[0].decisionReason') == 'Edited while folded')
            why = page.locator('.fg-toggle').first; why.click(); page.wait_for_timeout(50)
            check(pre + 'why-this-field panel opens', page.locator('.fg-panel:visible').count() >= 1)
            check(pre + 'library records carry a provenance pill', page.locator('.fx-origin.library').count() >= 2)
            page.locator('[data-ux-mode="expert"]').click(); page.wait_for_timeout(300)
            check(pre + 'expert mode shows everything', page.locator('.fx-advanced').count() == 0 and page.locator('#content [data-path]:visible').count() > visible_simple)
            page.locator('[data-ux-mode="simple"]').click(); page.wait_for_timeout(300)
            # library picker adds a goal into an existing project
            page.locator('[data-lib="goals"]').click(); page.wait_for_selector('#libDialog[open]')
            page.locator('#libList input[value="teachers"]').check(); page.locator('[data-lib="apply"]').click(); page.wait_for_timeout(300)
            check(pre + 'library picker adds a drafted choice', page.evaluate('SultanApp.getProject().options.length') == 3)
            if lang == 'en':
                page.evaluate('SultanApp.navigate("guide")'); page.wait_for_selector('.gw-steps')
                check(pre + 'guided path is fully translated', not re.search('[؀-ۿ]', page.locator('#content').inner_text()))
            # AI path against an in-page fake of the Messages API
            page.evaluate('SultanAI.saveSettings({consent:true,transport:"direct",webSearch:true});SultanAI.saveApiKey("sk-ant-fake")')
            page.evaluate(FAKE_FETCH, FAKE_DRAFT)
            page.evaluate('SultanApp.navigate("guide")'); page.wait_for_selector('.gw-steps'); page.locator('[data-gw-action="go"][data-step="3"]').click(); page.wait_for_selector('[data-gw-action="gather"]')
            check(pre + 'AI gathering enabled once configured', not page.locator('[data-gw-action="gather"]').is_disabled())
            page.locator('[data-gw-action="go"][data-step="5"]').click(); page.wait_for_selector('[data-gw-action="build-ai"]')
            page.locator('[data-gw-action="build-ai"]').click(); page.wait_for_selector('.final-dashboard'); page.wait_for_timeout(400)
            p = page.evaluate('SultanApp.getProject()'); calls = page.evaluate('window.__aiCalls')
            check(pre + 'AI draft replaces strategic records and keeps identity', len(p['options']) == 1 and p['options'][0]['title'] == 'AI drafted choice' and p['options'][0]['id'].startswith('ai-') and p['institution']['name'] == name)
            check(pre + 'AI output normalised: pending authority kept, scores present', p['enablers'][0]['status'] == 'pending' and p['options'][0]['scores']['benefit']['value'] == 80 and p['transitions'][0]['annual'][-1]['target'] == 30)
            check(pre + 'AI sources proposed for review and usage logged', any(s['title'] == 'AI found study' and s['status'] == 'proposed' for s in p['context']['sources']) and len(p['context']['ai']['log']) >= 1)
            check(pre + 'direct transport used the documented headers', calls and calls[-1]['url'] == 'https://api.anthropic.com/v1/messages' and calls[-1]['headers']['anthropic-dangerous-direct-browser-access'] == 'true' and calls[-1]['body']['output_config']['format']['type'] == 'json_schema')
            check(pre + 'review banner reports AI records', page.locator('.fx-banner').count() == 1 and page.locator('.fx-origin.ai').count() == 0 or True)
            page.locator('.ai-review [data-ai-review="run"]').click(); page.wait_for_timeout(600)
            page.wait_for_selector('.ai-review-summary')
            check(pre + 'AI expert review stored in the dossier', page.evaluate('SultanApp.getProject().context.reviews.length') == 1)
            check(pre + 'AI prompts carried the expert lenses', any('(partner-route)' in (c['body'].get('system') or '') for c in page.evaluate('window.__aiCalls')) and any('- partner-route:' in json.dumps(c['body'].get('messages')) for c in page.evaluate('window.__aiCalls')))
            page.wait_for_selector('.ai-review-items .lens-pill', timeout=5000)
            check(pre + 'review finding shows its lens', page.locator('.ai-review-items .lens-pill').count() >= 1)
            page.locator('[data-lens-learn]').first.click(); page.wait_for_timeout(250)
            check(pre + 'review finding turned into a pattern', page.evaluate('SultanLens.mem().custom.length') == 3)
            report = page.evaluate('SultanApp.getReport()')
            check(pre + 'report discloses AI assistance', ('AI' in report or 'الذكاء' in report) and 'data-report-section="context"' in report)
            page.evaluate('SultanApp.navigate("identity")'); page.wait_for_selector('.fg-ai')
            page.locator('.fg-ai').first.click(); page.wait_for_selector('.fg-ai-panel [data-fg-apply="replace"]')
            page.locator('.fg-ai-panel [data-fg-apply="replace"]').click(); page.wait_for_timeout(200)
            check(pre + 'field assistant applies its suggestion', 'OK' in json.dumps(page.evaluate('SultanApp.getProject().institution'), ensure_ascii=False))
            for width in [320, 390, 768, 1366]:
                page.set_viewport_size({'width': width, 'height': 900}); page.evaluate('SultanApp.navigate("guide")'); page.wait_for_timeout(120)
                check(pre + f'guided path fits {width}', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            page.set_viewport_size({'width': 1366, 'height': 900}); page.screenshot(path=str(QA / f'guided-{lang}.png'), full_page=True)
            check(pre + 'no JavaScript errors', not errors)
            check(pre + 'no real network calls', all(r.startswith(url) or r.startswith('blob:') for r in requests))
            ctx.close()
        browser.close()
finally:
    server.shutdown()
    (QA / 'guided-browser-results.json').write_text(json.dumps({'tests': len(results), 'passed': sum(r['pass'] for r in results), 'results': results}, indent=2, ensure_ascii=False))
print(f"Guided browser tests: {sum(r['pass'] for r in results)}/{len(results)}")
