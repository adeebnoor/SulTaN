/* Vision 2030 realization programs — bundled reference list. No network calls.
   Verified 2026-09-15 against the official Vision 2030 programme index.
   Re-verify before each release. SULTAN is not affiliated with any programme. */
(function(root){
'use strict';
root.SultanVision=root.SultanVision||{};
root.SultanVision.verifiedOn='2026-09-15';
root.SultanVision.source='https://www.vision2030.gov.sa/ar/explore/programs';
root.SultanVision.programs=[
{id:'ntp',code:'NTP',ar:'برنامج التحول الوطني',en:'National Transformation Program'},
{id:'hcdp',code:'HCDP',ar:'برنامج تنمية القدرات البشرية',en:'Human Capability Development Program'},
{id:'hstp',code:'HSTP',ar:'برنامج تحول القطاع الصحي',en:'Health Sector Transformation Program'},
{id:'qol',code:'QoL',ar:'برنامج جودة الحياة',en:'Quality of Life Program'},
{id:'nidlp',code:'NIDLP',ar:'برنامج تطوير الصناعة الوطنية والخدمات اللوجستية',en:'National Industrial Development and Logistics Program'},
{id:'fsdp',code:'FSDP',ar:'برنامج تطوير القطاع المالي',en:'Financial Sector Development Program'},
{id:'pif',code:'PIF',ar:'برنامج صندوق الاستثمارات العامة',en:'Public Investment Fund Program'},
{id:'pep',code:'PEP',ar:'برنامج خدمة ضيوف الرحمن',en:'Pilgrim Experience Program'},
{id:'housing',code:'HP',ar:'برنامج الإسكان',en:'Housing Program'},
{id:'priv',code:'PP',ar:'برنامج التخصيص',en:'Privatization Program'},
{id:'fsp',code:'FSP',ar:'برنامج الاستدامة المالية',en:'Fiscal Sustainability Program'}];
root.SultanVision.titles=function(lang){return root.SultanVision.programs.map(function(x){return lang==='en'?x.en:x.ar;});};
root.SultanLocales=root.SultanLocales||{};
Object.assign(root.SultanLocales.en=root.SultanLocales.en||{}, {visionListLabel:'Vision 2030 realization programs',visionListHint:'Suggestions only. Type any mandate — a programme, a royal decree, a board resolution, a regulator requirement.',visionListDisclaimer:'Reference list bundled with SULTAN, verified %{1}. SULTAN is not affiliated with and does not represent any programme. Confirm the current name in the official source before publishing.',visionListVerified:'Programme list verified %{1}',sectorList:'Government · central|Government · regional|Healthcare|Higher education|School education|Financial services|Energy & utilities|Industry & logistics|Telecom & digital|Transport|Tourism & culture|Non-profit|Regulator|Research centre',unitList:'%|minutes|hours|days|months|count|per 1,000|per 100,000|SAR|SAR million|index point|level (1–5)|percentage point|beneficiary',freqList:'Monthly|Quarterly|Semi-annual|Annual|On each release|On each incident'});
Object.assign(root.SultanLocales.ar=root.SultanLocales.ar||{}, {visionListLabel:'برامج تحقيق رؤية ٢٠٣٠',visionListHint:'اقتراحات فقط. اكتب أي ولاية تلتزم بها — برنامجًا، أو أمرًا ساميًا، أو قرار مجلس، أو مطلبًا تنظيميًا.',visionListDisclaimer:'قائمة مرجعية مضمّنة في سلطان، مُتحقَّق منها في %{1}. سلطان غير مرتبط بأي برنامج ولا يمثّله. تأكّد من الاسم الحالي في المصدر الرسمي قبل النشر.',visionListVerified:'قائمة البرامج مُتحقَّق منها في %{1}',sectorList:'جهة حكومية · مركزية|جهة حكومية · منطقة|الرعاية الصحية|التعليم العالي|التعليم العام|الخدمات المالية|الطاقة والمرافق|الصناعة واللوجستيات|الاتصالات والرقمنة|النقل|السياحة والثقافة|قطاع غير ربحي|جهة تنظيمية|مركز بحثي',unitList:'٪|دقيقة|ساعة|يوم|شهر|عدد|لكل ١٠٠٠|لكل ١٠٠٠٠٠|ريال|مليون ريال|نقطة مؤشر|مستوى (١–٥)|نقطة مئوية|مستفيد',freqList:'شهري|ربع سنوي|نصف سنوي|سنوي|عند كل إصدار|عند كل حادثة'});
})(globalThis);
