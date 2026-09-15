/* Vision 2030 realization programs — bundled reference list. No network calls.
   Verified 2026-09-15 against the official Vision 2030 programs page and the
   2025 annual report. The official programs page still surfaces eleven program
   names; the 2025 report states that Fiscal Sustainability and Privatization
   concluded after fulfilling their objectives. Preserve all eleven as open-list
   reference suggestions and keep status explicit instead of deleting history.
   Re-verify before each release. SULTAN is not affiliated with any programme. */
(function(root){
'use strict';
root.SultanVision=root.SultanVision||{};
root.SultanVision.verifiedOn='2026-09-15';
root.SultanVision.source='https://www.vision2030.gov.sa/ar/explore/programs';
root.SultanVision.programs=[
{id:'ntp',code:'NTP',status:'active',ar:'برنامج التحول الوطني',en:'National Transformation Program'},
{id:'hcdp',code:'HCDP',status:'active',ar:'برنامج تنمية القدرات البشرية',en:'Human Capability Development Program'},
{id:'hstp',code:'HSTP',status:'active',ar:'برنامج تحول القطاع الصحي',en:'Health Sector Transformation Program'},
{id:'qol',code:'QoL',status:'active',ar:'برنامج جودة الحياة',en:'Quality of Life Program'},
{id:'nidlp',code:'NIDLP',status:'active',ar:'برنامج تطوير الصناعة الوطنية والخدمات اللوجستية',en:'National Industrial Development and Logistics Program'},
{id:'fsdp',code:'FSDP',status:'active',ar:'برنامج تطوير القطاع المالي',en:'Financial Sector Development Program'},
{id:'pif',code:'PIF',status:'active',ar:'برنامج صندوق الاستثمارات العامة',en:'Public Investment Fund Program'},
{id:'pep',code:'PEP',status:'active',ar:'برنامج خدمة ضيوف الرحمن',en:'Pilgrim Experience Program'},
{id:'housing',code:'HP',status:'active',ar:'برنامج الإسكان',en:'Housing Program'},
{id:'priv',code:'PP',status:'completed',ar:'برنامج التخصيص',en:'Privatization Program'},
{id:'fsp',code:'FSP',status:'completed',ar:'برنامج الاستدامة المالية',en:'Fiscal Sustainability Program'}];
root.SultanVision.active=root.SultanVision.programs.filter(function(x){return x.status==='active';});
root.SultanVision.completed=root.SultanVision.programs.filter(function(x){return x.status==='completed';});
root.SultanVision.titles=function(lang){return root.SultanVision.programs.map(function(x){return lang==='en'?x.en:x.ar;});};
root.SultanLocales=root.SultanLocales||{};
Object.assign(root.SultanLocales.en=root.SultanLocales.en||{}, {visionListLabel:'Vision 2030 realization programs',visionListHint:'Suggestions only. Type any mandate — a programme, a royal decree, a board resolution, a regulator requirement, or a historical programme mandate.',visionListDisclaimer:'Reference list bundled with SULTAN, verified %{1}. SULTAN is not affiliated with and does not represent any programme. The official programs page surfaces eleven program names; the 2025 annual report states that Privatization and Fiscal Sustainability concluded after fulfilling their objectives. Confirm current status before publishing.',visionListVerified:'Programme list verified %{1}',sectorList:'Government · central|Government · regional|Healthcare|Higher education|School education|Financial services|Energy & utilities|Industry & logistics|Telecom & digital|Transport|Tourism & culture|Non-profit|Regulator|Research centre',unitList:'%|minutes|hours|days|months|count|per 1,000|per 100,000|SAR|SAR million|index point|level (1–5)|percentage point|beneficiary',freqList:'Monthly|Quarterly|Semi-annual|Annual|On each release|On each incident'});
Object.assign(root.SultanLocales.ar=root.SultanLocales.ar||{}, {visionListLabel:'برامج تحقيق رؤية ٢٠٣٠',visionListHint:'اقتراحات فقط. اكتب أي ولاية تلتزم بها — برنامجًا، أو أمرًا ساميًا، أو قرار مجلس، أو مطلبًا تنظيميًا، أو تكليفًا تاريخيًا مرتبطًا ببرنامج مكتمل.',visionListDisclaimer:'قائمة مرجعية مضمّنة في سلطان، مُتحقَّق منها في %{1}. سلطان غير مرتبط بأي برنامج ولا يمثّله. تعرض الصفحة الرسمية أحد عشر اسمًا للبرامج، بينما يذكر التقرير السنوي ٢٠٢٥ أن برنامجي التخصيص والاستدامة المالية اختتما بعد تحقيق أهدافهما. تأكّد من الحالة الحالية قبل النشر.',visionListVerified:'قائمة البرامج مُتحقَّق منها في %{1}',sectorList:'جهة حكومية · مركزية|جهة حكومية · منطقة|الرعاية الصحية|التعليم العالي|التعليم العام|الخدمات المالية|الطاقة والمرافق|الصناعة واللوجستيات|الاتصالات والرقمنة|النقل|السياحة والثقافة|قطاع غير ربحي|جهة تنظيمية|مركز بحثي',unitList:'٪|دقيقة|ساعة|يوم|شهر|عدد|لكل ١٠٠٠|لكل ١٠٠٠٠٠|ريال|مليون ريال|نقطة مؤشر|مستوى (١–٥)|نقطة مئوية|مستفيد',freqList:'شهري|ربع سنوي|نصف سنوي|سنوي|عند كل إصدار|عند كل حادثة'});
})(globalThis);
