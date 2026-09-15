"""Rendered regressions for final SULTAN review, exports and missing-cost states.

These are behavioral browser assertions: no source-code matching. Each scenario
starts through the public demo UI and inspects rendered state and downloaded
client documents in Arabic and English.
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
            expect(page.locator('.final-dashboard')).to_be_visible()
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
        doc = page.context.new_page()
        doc.set_content(destination.read_text(encoding='utf-8'))
        return doc

    def fill_field(page, path, value):
        field = page.locator(f'[data-path="{path}"]')
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
                ctx.add_init_script('window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;}')
                page = ctx.new_page(); errors = []; dialogs = []; accept_dialog = [True]
                page.on('pageerror', lambda e: errors.append(str(e)))

                def handle_dialog(d):
                    dialogs.append(d.message)
                    d.accept() if accept_dialog[0] else d.dismiss()

                page.on('dialog', handle_dialog)
                page.goto(base_url + '?lang=' + lang)
                expect(page.locator('.export-menu')).to_be_attached()
                expect(page.locator('[data-action="report"]')).to_be_disabled()
                page.locator('[data-action="demo"]').first.click()
                demo = page.evaluate('SultanApp.getProject()')
                check(prefix + 'demo is fictional and includes four choices', demo['isDemo'] and len(demo['options']) == 4)

                navigate(page, 'choices')
                assumption_paths = [f'options.{i}.assumptions.0.text' for i in range(4)]
                check(prefix + 'structured assumptions are visible', all(page.locator(f'[data-path="{p}"]').count() == 1 and page.locator(f'[data-path="{p}"]').input_value().strip() for p in assumption_paths))
                check(prefix + 'assumption accountability is structured', page.locator('[data-path="options.0.assumptions.0.expectedPersistence"]').count() == 1 and page.locator('[data-path="options.0.assumptions.0.testEvidence"]').count() == 1)
                check(prefix + 'risk assessment link is populated in the demo', all(page.locator(f'[data-path="options.{i}.riskSource"]').input_value().strip() for i in range(4)))

                navigate(page, 'priorities')
                expect(page.locator('[data-polarity="3"]')).to_have_value('cost')
                before = page.evaluate('Sultan.score(SultanApp.getProject(),SultanApp.getProject().options[0]).value')
                accept_dialog[0] = False
                page.locator('[data-polarity="0"]').select_option('cost')
                expect(page.locator('[data-polarity="0"]')).to_have_value('benefit')
                check(prefix + 'polarity cancellation preserves score', page.evaluate('Sultan.score(SultanApp.getProject(),SultanApp.getProject().options[0]).value') == before)
                accept_dialog[0] = True
                snapshot = page.evaluate('JSON.stringify(SultanApp.getProject())')
                slider = page.locator('[data-sensitivity="identity"]'); slider.focus(); slider.press('ArrowRight')
                weight = float(slider.input_value())
                expected = page.evaluate('(w)=>Sultan.rankingAt(SultanApp.getProject(),"identity",w).slice(0,5).map(x=>Math.round(x.value).toLocaleString("en-US"))', weight)
                expect(page.locator('.sensitivity-preview .rank strong')).to_have_text(expected)
                check(prefix + 'live sensitivity does not mutate project', page.evaluate('JSON.stringify(SultanApp.getProject())') == snapshot)

                navigate(page, 'enablers')
                model = page.evaluate('Sultan.authoritySpace(SultanApp.getProject())')
                o1 = next(x for x in model if x['optionId'] == 'o1')
                check(prefix + 'blocked and pending authority actions surface', 'resolve' in o1['actions'] and 'escalate' in o1['actions'])

                navigate(page, 'review')
                expect(page.locator('.executive-summary')).to_be_visible()

                # 0.8 RC: full-horizon dashboard, localized client exports and success-only document numbering.
                rc_labels = page.evaluate('Object.fromEntries(["clientDeliverables","decisionExtensions","pdfPopupBlocked","qualitativeRecorded"].map(k=>[k,SultanI18n.t(k)]))')
                check(prefix + 'visible release candidate version', '0.8.0-rc' in page.locator('.final-version').inner_text())
                menu(page)
                check(prefix + 'client deliverables heading localized', page.locator('.final-deliverables > b').inner_text().strip() == rc_labels['clientDeliverables'])
                check(prefix + 'single status legend for progress panel', page.locator('.dashboard-progress .dashboard-status-legend').count() == 1)
                check(prefix + 'single trajectory legend for progress panel', page.locator('.dashboard-progress .trajectory-legend').count() == 1)
                numeric_track = page.locator('.track-card[data-transition-id="t1"]')
                qualitative_track = page.locator('.track-card[data-transition-id="t2"]')
                check(prefix + 'numeric target path is rendered', numeric_track.locator('path.target-line[data-series="target"]').count() == 1)
                check(prefix + 'numeric baseline marker is rendered', numeric_track.locator('circle.baseline-dot[data-series="baseline"]').count() == 1)
                check(prefix + 'all annual target markers are rendered', numeric_track.locator('circle.target-dot[data-series="target"]').count() == 4)
                check(prefix + 'actual reading marker is rendered', numeric_track.locator('circle.actual-dot[data-series="actual"]').count() >= 1)
                axis_text = numeric_track.locator('svg text').all_text_contents()
                check(prefix + 'full 2027-2030 horizon visible at once', all(str(y) in axis_text for y in [2027,2028,2029,2030]))
                check(prefix + 'qualitative track is rendered without numeric SVG', qualitative_track.locator('.qualitative-track').count() == 1 and qualitative_track.locator('svg').count() == 0)
                check(prefix + 'qualitative track starts without fabricated numeric status', qualitative_track.locator('.status.noReading').count() == 1)
                note = 'Recorded governance observation' if lang == 'en' else 'ملاحظة حوكمة مسجلة'
                page.evaluate('(note)=>{const p=SultanApp.getProject();const t=p.transitions.find(x=>x.id==="t2");t.annual[0].observation=note;t.annual[0].actualSource="Workshop note";SultanApp.setProject(p);SultanApp.navigate("review");}', note)
                page.wait_for_timeout(80)
                qualitative_track = page.locator('.track-card[data-transition-id="t2"]')
                check(prefix + 'qualitative observation becomes recorded state', qualitative_track.locator('.status.recorded').count() == 1 and rc_labels['qualitativeRecorded'] in qualitative_track.inner_text())
                check(prefix + 'qualitative observation is visible to leadership', note in qualitative_track.inner_text())
                check(prefix + 'qualitative observation is not no-reading', qualitative_track.locator('.status.noReading').count() == 0)

                # A blocked print window must not consume a document number or surface a raw DOM exception.
                before_doc = page.evaluate('SultanApp.getProject().documentNumber')
                page.evaluate('window.__sultanOpen=window.open;window.open=()=>null')
                menu(page); page.locator('[data-final-export="strategy"][data-format="pdf"]').click(); page.wait_for_timeout(40)
                page.evaluate('window.open=window.__sultanOpen')
                check(prefix + 'blocked PDF does not consume document number', page.evaluate('SultanApp.getProject().documentNumber') == before_doc)
                check(prefix + 'blocked PDF error is localized and human readable', page.locator('.export-status').inner_text().strip() == rc_labels['pdfPopupBlocked'])
                check(prefix + 'blocked PDF has no raw SecurityError dialog', not any('SecurityError' in d for d in dialogs))

                # Successful client HTML/Word/PDF routes advance one document number each.
                menu(page)
                with page.expect_download() as client_html_event:
                    page.locator('[data-final-export="strategy"][data-format="html"]').click()
                client_html = client_html_event.value; html_no = before_doc + 1
                client_html_path = qa/f'client-strategy-{lang}-{width}.html'; client_html.save_as(str(client_html_path))
                check(prefix + 'successful client HTML increments document number once', page.evaluate('SultanApp.getProject().documentNumber') == html_no)
                check(prefix + 'client HTML filename uses committed document number', f'_D{html_no}.html' in client_html.suggested_filename)
                client_doc = page.context.new_page(); client_doc.set_content(client_html_path.read_text(encoding='utf-8'))
                check(prefix + 'decision-extension heading localized in client document', client_doc.locator('.extension-report h2').inner_text().strip() == rc_labels['decisionExtensions'])
                check(prefix + 'client document carries its document number', str(html_no) in client_doc.locator('[data-doc-number]').first.inner_text())
                client_doc.close()

                menu(page)
                with page.expect_download() as client_word_event:
                    page.locator('[data-final-export="strategy"][data-format="word"]').click()
                word_no = html_no + 1
                check(prefix + 'successful Word increments document number once', page.evaluate('SultanApp.getProject().documentNumber') == word_no)
                check(prefix + 'Word filename uses committed document number', f'_D{word_no}.doc' in client_word_event.value.suggested_filename)

                menu(page)
                with page.expect_popup() as client_pdf_event:
                    page.locator('[data-final-export="strategy"][data-format="pdf"]').click()
                client_pdf = client_pdf_event.value; client_pdf.wait_for_timeout(40); pdf_no = word_no + 1
                check(prefix + 'PDF uses browser print route', client_pdf.evaluate('window.__printCalls||0') == 1)
                check(prefix + 'successful PDF increments document number once', page.evaluate('SultanApp.getProject().documentNumber') == pdf_no)
                check(prefix + 'PDF print document contains no canvas renderer', client_pdf.locator('canvas').count() == 0)
                client_pdf.close()
                expect(page.locator('.matrix-unplotted [data-option-id="o4"]')).to_be_visible()
                check(prefix + 'unmapped choice is not drawn at zero', page.locator('.matrix-dot[data-option-id="o4"]').count() == 0)
                expect(page.locator('.matrix-tick')).to_have_count(4)
                matrix = page.locator('.matrix').bounding_box()
                for dot in page.locator('.matrix-dot').all():
                    r = dot.bounding_box(); v = float(dot.get_attribute('data-value')); a = float(dot.get_attribute('data-authority'))
                    from_left = r['x'] + r['width']/2 - matrix['x']
                    measured = from_left if lang == 'en' else matrix['width'] - from_left
                    target = max(15, min(matrix['width']-15, matrix['width']*v/100))
                    check(prefix + 'value dot geometry ' + dot.get_attribute('data-option-id'), abs(measured-target) < 3)
                    from_bottom = matrix['y'] + matrix['height'] - (r['y'] + r['height']/2)
                    target_y = max(15, min(matrix['height']-15, matrix['height']*a/100))
                    check(prefix + 'authority dot geometry ' + dot.get_attribute('data-option-id'), abs(from_bottom-target_y) < 3)

                labels = page.evaluate('Object.fromEntries(["noInitiatives","fundingNotApplicable","fundingConfirmed","fundingMixed","costUnestimated","currencySAR","revisionLabel","authoritySpaceTitle"].map(k=>[k,SultanI18n.t(k)]))')
                row = page.locator('.value-funding-table tr[data-option-id="o4"]')
                expect(row.locator('.declared-cost')).to_have_text(labels['noInitiatives'])
                expect(row.locator('.funding-state')).to_have_text(labels['fundingNotApplicable'])
                check(prefix + 'no-initiative state is not zero cost', not re.search(r'\b0\b', row.locator('.declared-cost').inner_text()))

                internal = download_report(page, '[data-action="report"]', qa/f'internal-{lang}-{width}.html')
                expect(internal.locator('html')).to_have_attribute('lang', lang)
                expect(internal.locator('.authority-report h2')).to_have_text(labels['authoritySpaceTitle'])
                expect(internal.locator('[data-report-section="issues"]')).to_have_count(1)
                leadership = download_report(page, '[data-exec="leadership-report"]', qa/f'leadership-{lang}-{width}.html')
                expect(leadership.locator('[data-report-section="issues"]')).to_have_count(0)
                expect(leadership.locator('.authority-report')).to_have_count(1)
                expect(leadership.locator('.escalation-report')).to_have_count(1)
                issue = page.evaluate('Sultan.check(SultanApp.getProject()).find(x=>x.entity==="o4").message')
                check(prefix + 'leadership removes unresolved issue text', issue in internal.locator('body').inner_text() and issue not in leadership.locator('body').inner_text())
                assumption_text = demo['options'][0]['assumptions'][0]['text']
                for doc in [internal, leadership]:
                    stamp = doc.locator('.report-date').inner_text()
                    check(prefix + 'dual dates use Latin digits ' + doc.title(), bool(re.search(r'\d{4}', stamp)) and not re.search('[\u0660-\u0669\u06f0-\u06f9]', stamp))
                    expect(doc.locator('script')).to_have_count(0)
                    check(prefix + 'structured assumption reaches output ' + doc.title(), assumption_text in doc.locator('body').inner_text())
                    check(prefix + 'executive summary reaches output ' + doc.title(), doc.locator('.executive-summary').count() == 1)

                escalation = download_report(page, '[data-exec="escalation"]', qa/f'escalation-{lang}-{width}.html')
                header = escalation.locator('.escalation-report > p').first.inner_text()
                check(prefix + 'escalation revision is localized', labels['revisionLabel'] + ' ' + str(page.evaluate('SultanApp.getProject().revision')) in header)
                check(prefix + 'escalation dates have no Indic numerals', not re.search('[\u0660-\u0669\u06f0-\u06f9]', header))
                if lang == 'ar':
                    check(prefix + 'Arabic escalation has no English revision label', not re.search(r'\brevision\b', header, re.I))
                for doc in [internal, leadership, escalation]: doc.close()

                menu(page)
                with page.expect_popup() as event: page.locator('[data-action="print"]').click()
                printed = event.value
                expect(printed.locator('.authority-report')).to_have_count(1)
                expect(printed.locator('[data-report-section="issues"]')).to_have_count(1)
                check(prefix + 'print uses complete internal report', printed.evaluate('window.__printCalls') == 1)
                printed.close()

                # Exact reviewer reproduction: no initiative, explicit zero, confirmed zero, blank and partial estimates remain distinct.
                navigate(page, 'choices'); page.locator('[data-path="options.2.decision"]').select_option('select'); navigate(page, 'review')
                row3 = page.locator('.value-funding-table tr[data-option-id="o3"]')
                expect(row3.locator('.declared-cost')).to_have_text(labels['noInitiatives'])
                check(prefix + 'third-choice no-initiative reproduction fixed', row3.get_attribute('data-funding-state') == 'no-initiatives')

                navigate(page, 'roadmap'); page.locator('[data-action="add"][data-kind="initiatives"]').click()
                index = page.evaluate('SultanApp.getProject().initiatives.length-1')
                fill_field(page, f'initiatives.{index}.title', 'Zero-cost trial' if lang == 'en' else 'تجربة بتكلفة صفرية')
                page.locator(f'[data-path="initiatives.{index}.optionId"]').select_option('o3')
                fill_field(page, f'initiatives.{index}.budget.0.amount', '0'); navigate(page, 'review')
                row3 = page.locator('.value-funding-table tr[data-option-id="o3"]')
                expect(row3.locator('.declared-cost')).to_have_text('0 ' + labels['currencySAR'])
                expect(row3.locator('.funding-state')).to_have_text(labels['fundingMixed'])
                navigate(page, 'roadmap'); page.locator(f'[data-path="initiatives.{index}.budgetStatus"]').select_option('confirmed'); navigate(page, 'review')
                expect(page.locator('.value-funding-table tr[data-option-id="o3"] .funding-state')).to_have_text(labels['fundingConfirmed'])
                navigate(page, 'roadmap'); fill_field(page, f'initiatives.{index}.budget.0.amount', ''); navigate(page, 'review')
                expect(page.locator('.value-funding-table tr[data-option-id="o3"] .declared-cost')).to_have_text(labels['costUnestimated'])
                navigate(page, 'roadmap'); fill_field(page, f'initiatives.{index}.endYear', '2028'); fill_field(page, f'initiatives.{index}.budget.0.amount', '100'); navigate(page, 'review')
                partial = '100 ' + labels['currencySAR'] + ' ' + page.evaluate('SultanI18n.t("unestimatedYears",[1])')
                expect(page.locator('.value-funding-table tr[data-option-id="o3"] .declared-cost')).to_have_text(partial)

                check(prefix + 'review has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
                check(prefix + 'no JavaScript errors', not errors)
                ctx.close()
    finally:
        report = {'mode':'live-browser' if base_url.startswith('https:') else 'full-browser','baseUrl':base_url,'tests':len(results),'passed':sum(x['pass'] for x in results),'results':results}
        (qa/'review-browser-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Review behavioral browser tests: {len(results)} passed')
