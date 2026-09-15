"""Rendered regressions for exports, matrix semantics and missing-cost states.

Called by hardening_browser.py at a real origin (local CI or the public mirror).
No source-code matching: assertions inspect visible DOM, geometry, downloaded
report DOM and user-driven state transitions. Each case begins via the demo UI.
"""
from pathlib import Path
import json
import re
from playwright.sync_api import expect


def run_review_regressions(browser, base_url: str, qa: Path) -> None:
    results = []

    def check(name, condition):
        results.append({'name': name, 'pass': bool(condition)})
        if not condition:
            raise AssertionError(name)

    def navigate(page, section):
        page.locator(f'#navigation [data-section="{section}"]').click()
        expect(page.locator('#navigation [aria-current="page"]')).to_have_attribute('data-section', section)
        if section == 'review':
            expect(page.locator('.value-funding-table')).to_be_visible()
        elif section == 'enablers':
            expect(page.locator('.authority-space')).to_be_visible()
        elif section == 'choices':
            expect(page.locator('.assumption-register')).to_have_count(4)

    def menu(page):
        summary = page.locator('.export-menu > summary')
        expect(summary).to_be_visible()
        if not page.locator('.export-menu').evaluate('(d)=>d.open'):
            summary.click()

    def download_report(page, selector, destination):
        menu(page)
        with page.expect_download() as event:
            page.locator(selector).click()
        event.value.save_as(str(destination))
        expect(page.locator('.export-menu')).not_to_have_attribute('open', '')
        # Inspect the generated report as a document, not its serialization.
        doc = page.context.new_page()
        doc.set_content(destination.read_text(encoding='utf-8'))
        return doc

    def fill_field(page, path, value):
        field = page.locator(f'[data-path="{path}"]')
        # Expand ordinary disclosures by clicking their summaries, just as a user would.
        for details in page.locator('details').filter(has=field).all():
            if not details.evaluate('(d)=>d.open'):
                details.locator(':scope > summary').click()
        expect(field).to_be_visible()
        field.fill(value)
        field.press('Tab')

    try:
        for lang in ['en', 'ar']:
            for width in [1280, 390, 320]:
                prefix = f'{lang}/{width}: '
                ctx = browser.new_context(viewport={'width': width, 'height': 900}, accept_downloads=True)
                # Observe a real Print command without opening the operating-system dialog.
                ctx.add_init_script('window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;}')
                page = ctx.new_page()
                errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                dialogs = []
                accept_dialog = [True]

                def handle_dialog(d):
                    dialogs.append(d.message)
                    d.accept() if accept_dialog[0] else d.dismiss()

                page.on('dialog', handle_dialog)
                page.goto(base_url + '?lang=' + lang)
                expect(page.locator('.export-menu')).to_be_attached()
                expect(page.locator('[data-action="report"]')).to_be_disabled()
                page.locator('[data-action="demo"]').first.click()
                expect(page.locator('[data-path="institution.name"]')).not_to_have_value('')
                demo = page.evaluate('SultanApp.getProject()')
                check(prefix + 'demo is fictional and visibly includes four choices', demo['isDemo'] and len(demo['options']) == 4)

                navigate(page, 'choices')
                check(prefix + 'all assumptions visible without console setup', all(x.strip() for x in page.locator('[data-option-extra="assumptions"]').evaluate_all('(xs)=>xs.map(x=>x.value)')))
                check(prefix + 'all risk fields have actual demo content', all(x.strip() for x in page.locator('[data-option-extra="risks"]').evaluate_all('(xs)=>xs.map(x=>x.value)')))
                navigate(page, 'priorities')
                expect(page.locator('[data-polarity="3"]')).to_have_value('cost')
                check(prefix + 'cost anchors explain lower-is-better direction', '0:' in page.locator('[data-path="criteria.3.low"]').input_value() and '100:' in page.locator('[data-path="criteria.3.high"]').input_value())
                before = page.evaluate('Sultan.score(SultanApp.getProject(),SultanApp.getProject().options[0]).value')
                accept_dialog[0] = False
                page.locator('[data-polarity="0"]').select_option('cost')
                expect(page.locator('[data-polarity="0"]')).to_have_value('benefit')
                check(prefix + 'polarity cancellation keeps the actual score', page.evaluate('Sultan.score(SultanApp.getProject(),SultanApp.getProject().options[0]).value') == before)
                warning = page.evaluate('SultanI18n.t("polarityAnchorWarning")')
                check(prefix + 'polarity change displays the localized warning', dialogs[-1] == warning)
                accept_dialog[0] = True
                snapshot = page.evaluate('JSON.stringify(SultanApp.getProject())')
                slider = page.locator('[data-sensitivity="identity"]')
                slider.focus(); slider.press('ArrowRight')
                weight = float(slider.input_value())
                expected = page.evaluate('(w)=>Sultan.rankingAt(SultanApp.getProject(),"identity",w).slice(0,5).map(x=>Math.round(x.value).toLocaleString("en-US"))', weight)
                expect(page.locator('.sensitivity-preview .rank strong')).to_have_text(expected)
                check(prefix + 'live sensitivity does not mutate project', page.evaluate('JSON.stringify(SultanApp.getProject())') == snapshot)

                navigate(page, 'enablers')
                model = page.evaluate('Sultan.authoritySpace(SultanApp.getProject())')
                o1 = next(x for x in model if x['optionId'] == 'o1')
                check(prefix + 'blocked and pending demo actions both surface', 'resolve' in o1['actions'] and 'escalate' in o1['actions'])
                blocked = page.evaluate('SultanI18n.t("authorityResolve")')
                expect(page.locator('.authority-action').filter(has_text=blocked)).to_be_visible()
                check(prefix + 'unknown status produces visible consistency notes', page.evaluate('Sultan.check(SultanApp.getProject()).some(x=>x.entity==="e2"&&x.section==="enablers")'))

                navigate(page, 'review')
                menu(page)
                for action in ['report', 'project', 'print']:
                    controls = page.locator(f'[data-action="{action}"]')
                    expect(controls).to_have_count(1)
                    expect(controls).to_be_visible()
                    check(prefix + f'exactly one rendered {action} control', controls.count() == 1)
                expect(page.locator('.export-menu')).to_have_count(1)
                check(prefix + 'legacy internal action is not a competing output', page.locator('[data-exec="internal-report"]').count() == 0)
                expect(page.locator('.matrix-unplotted [data-option-id="o4"]')).to_be_visible()
                check(prefix + 'unmapped choice is not drawn at zero', page.locator('.matrix-dot[data-option-id="o4"]').count() == 0)
                expect(page.locator('.matrix-tick')).to_have_count(4)
                expect(page.locator('.matrix-quadrant')).to_have_count(4)
                for tick in page.locator('.matrix-tick').all():
                    expect(tick).to_be_visible()
                for label in page.locator('.matrix-quadrant').all():
                    expect(label).to_be_visible()
                check(prefix + 'both scales expose 0 and 100', all(sorted(page.locator(f'.matrix-tick[data-axis="{a}"]').all_text_contents()) == ['0', '100'] for a in ['x', 'y']))
                r0 = page.locator('.matrix-tick.x-min').bounding_box()
                r100 = page.locator('.matrix-tick.x-max').bounding_box()
                check(prefix + 'horizontal endpoints follow the reading direction', (r100['x'] > r0['x']) if lang == 'en' else (r100['x'] < r0['x']))
                y0 = page.locator('.matrix-tick.y-min').bounding_box()
                y100 = page.locator('.matrix-tick.y-max').bounding_box()
                check(prefix + 'vertical scale increases upwards', y100['y'] < y0['y'])
                matrix = page.locator('.matrix').bounding_box()
                for dot in page.locator('.matrix-dot').all():
                    r = dot.bounding_box(); v = float(dot.get_attribute('data-value')); a = float(dot.get_attribute('data-authority'))
                    from_left = r['x'] + r['width']/2 - matrix['x']
                    measured = from_left if lang == 'en' else matrix['width'] - from_left
                    target = max(15, min(matrix['width']-15, matrix['width']*v/100))
                    check(prefix + 'value dot geometry matches its labelled axis ' + dot.get_attribute('data-option-id'), abs(measured-target) < 3)
                    from_bottom = matrix['y']+matrix['height']-(r['y']+r['height']/2)
                    check(prefix + 'authority dot geometry matches its labelled axis ' + dot.get_attribute('data-option-id'), abs(from_bottom-max(15,min(matrix['height']-15,matrix['height']*a/100))) < 3)
                guide = page.locator('.matrix-guide').inner_text()
                check(prefix + 'direction and non-approval midpoint are explained', '50' in guide and ('اليسار' in guide if lang == 'ar' else 'right' in guide))

                labels = page.evaluate('Object.fromEntries(["noInitiatives","fundingNotApplicable","fundingConfirmed","fundingMixed","costUnestimated","currencySAR","revisionLabel","authoritySpaceTitle"].map(k=>[k,SultanI18n.t(k)]))')
                row = page.locator('.value-funding-table tr[data-option-id="o4"]')
                expect(row.locator('.declared-cost')).to_have_text(labels['noInitiatives'])
                expect(row.locator('.funding-state')).to_have_text(labels['fundingNotApplicable'])
                check(prefix + 'no-initiative row makes neither a zero-cost nor confirmation claim', not re.search(r'\b0\b', row.locator('.declared-cost').inner_text()))

                # A downloaded report is rendered and inspected in both languages.
                internal = download_report(page, '[data-action="report"]', qa/f'internal-{lang}-{width}.html')
                expect(internal.locator('html')).to_have_attribute('lang', lang)
                expect(internal.locator('.authority-report h2')).to_have_text(labels['authoritySpaceTitle'])
                expect(internal.locator('[data-report-section="issues"]')).to_have_count(1)
                check(prefix + 'internal report includes real issue text', bool(internal.locator('[data-report-section="issues"]').evaluate('(h)=>h.nextElementSibling.textContent.trim()')))
                leadership = download_report(page, '[data-exec="leadership-report"]', qa/f'leadership-{lang}-{width}.html')
                expect(leadership.locator('[data-report-section="issues"]')).to_have_count(0)
                expect(leadership.locator('.authority-report')).to_have_count(1)
                expect(leadership.locator('.escalation-report')).to_have_count(1)
                issue = page.evaluate('Sultan.check(SultanApp.getProject()).find(x=>x.entity==="o4").message')
                check(prefix + 'leadership removes issue paragraphs, not only heading', issue in internal.locator('body').inner_text() and issue not in leadership.locator('body').inner_text())
                for doc in [internal, leadership]:
                    stamp = doc.locator('.report-date').inner_text()
                    check(prefix + 'dual dates use Latin digits ' + doc.title(), bool(re.search(r'\d{4}', stamp)) and not re.search('[\u0660-\u0669\u06f0-\u06f9]', stamp))
                    expect(doc.locator('script')).to_have_count(0)
                    check(prefix + 'assumptions reach the output ' + doc.title(), demo['options'][0]['assumptions'] in doc.locator('body').inner_text())
                escalation = download_report(page, '[data-exec="escalation"]', qa/f'escalation-{lang}-{width}.html')
                header = escalation.locator('.escalation-report > p').first.inner_text()
                check(prefix + 'escalation revision is localized', labels['revisionLabel'] + ' ' + str(page.evaluate('SultanApp.getProject().revision')) in header)
                check(prefix + 'escalation dates have no Indic numerals', not re.search('[\u0660-\u0669\u06f0-\u06f9]', header))
                if lang == 'ar':
                    check(prefix + 'Arabic escalation has no English revision label', not re.search(r'\brevision\b', header, re.I))
                for doc in [internal, leadership, escalation]:
                    doc.close()

                menu(page)
                with page.expect_popup() as event:
                    page.locator('[data-action="print"]').click()
                printed = event.value
                expect(printed.locator('.authority-report')).to_have_count(1)
                check(prefix + 'print uses the complete internal report', printed.evaluate('window.__printCalls') == 1)
                expect(printed.locator('[data-report-section="issues"]')).to_have_count(1)
                printed.close()
                expect(page.locator('.export-menu')).not_to_have_attribute('open', '')
                page.locator('.portfolio-review').screenshot(path=str(qa/f'matrix-{lang}-{width}.png'))
                check(prefix + 'review has no horizontal page overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))

                # Reproduce the reviewer's exact choice-3 scenario using the UI.
                navigate(page, 'choices')
                page.locator('[data-path="options.2.decision"]').select_option('select')
                navigate(page, 'review')
                row3 = page.locator('.value-funding-table tr[data-option-id="o3"]')
                expect(row3.locator('.declared-cost')).to_have_text(labels['noInitiatives'])
                expect(row3.locator('.funding-state')).to_have_text(labels['fundingNotApplicable'])
                check(prefix + 'original third-choice reproduction is fixed', row3.get_attribute('data-funding-state') == 'no-initiatives')

                # Add an initiative and enter a real zero; do not blanket-replace all zeroes.
                navigate(page, 'roadmap')
                page.locator('[data-action="add"][data-kind="initiatives"]').click()
                index = page.evaluate('SultanApp.getProject().initiatives.length-1')
                fill_field(page, f'initiatives.{index}.title', 'Zero-cost trial' if lang == 'en' else 'تجربة بتكلفة صفرية')
                page.locator(f'[data-path="initiatives.{index}.optionId"]').select_option('o3')
                fill_field(page, f'initiatives.{index}.budget.0.amount', '0')
                navigate(page, 'review')
                row3 = page.locator('.value-funding-table tr[data-option-id="o3"]')
                expect(row3.locator('.declared-cost')).to_have_text('0 ' + labels['currencySAR'])
                expect(row3.locator('.funding-state')).to_have_text(labels['fundingMixed'])
                check(prefix + 'explicit zero and unconfirmed funding are distinct', row3.get_attribute('data-funding-state') == 'unconfirmed')
                navigate(page, 'roadmap')
                page.locator(f'[data-path="initiatives.{index}.budgetStatus"]').select_option('confirmed')
                navigate(page, 'review')
                row3 = page.locator('.value-funding-table tr[data-option-id="o3"]')
                expect(row3.locator('.funding-state')).to_have_text(labels['fundingConfirmed'])
                check(prefix + 'confirmed is a third genuine funding state', row3.get_attribute('data-funding-state') == 'confirmed')
                navigate(page, 'roadmap')
                fill_field(page, f'initiatives.{index}.budget.0.amount', '')
                navigate(page, 'review')
                expect(page.locator('.value-funding-table tr[data-option-id="o3"] .declared-cost')).to_have_text(labels['costUnestimated'])
                check(prefix + 'blank estimate is not a zero amount', page.locator('.value-funding-table tr[data-option-id="o3"] .declared-cost').inner_text() != '0 '+labels['currencySAR'])
                navigate(page, 'roadmap')
                fill_field(page, f'initiatives.{index}.endYear', '2028')
                fill_field(page, f'initiatives.{index}.budget.0.amount', '100')
                navigate(page, 'review')
                partial = '100 '+labels['currencySAR']+' '+page.evaluate('SultanI18n.t("unestimatedYears",[1])')
                expect(page.locator('.value-funding-table tr[data-option-id="o3"] .declared-cost')).to_have_text(partial)
                check(prefix + 'partial estimate still exposes unestimated years', page.locator('.value-funding-table tr[data-option-id="o3"] .declared-cost').inner_text() == partial)
                check(prefix + 'repeated navigation does not duplicate export actions', all(page.locator(f'[data-action="{a}"]').count() == 1 for a in ['report','project','print']))
                check(prefix + 'no JavaScript errors during user interactions', not errors)
                ctx.close()
    finally:
        report = {'mode': 'live-browser' if base_url.startswith('https:') else 'full-browser', 'baseUrl': base_url, 'tests': len(results), 'passed': sum(x['pass'] for x in results), 'results': results}
        (qa/'review-browser-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Review behavioral browser tests: {len(results)} passed')
