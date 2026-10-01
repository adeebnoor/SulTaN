/* Field guidance and disclosure: every workspace field has a why + example in both languages; patterns and rules hold. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const index=read('index.html'),css=read('src/guided.css'),app=read('src/app.js'),finalUi=read('src/final-ui.js');
for(const asset of ['src/guided.css','src/locales/guided.js','src/locales/field-guide.js','src/context-core.js','src/sector-library.js','src/draft-engine.js','src/ai.js','src/field-guide.js','src/guided.js'])assert.ok(index.includes(asset),'index must declare '+asset);
assert.ok(index.indexOf('src/locales/field-guide.js')<index.indexOf('src/i18n.js'),'locale add-ons load before i18n');
assert.ok(index.indexOf('src/context-core.js')>index.indexOf('src/final-core.js')&&index.indexOf('src/draft-engine.js')>index.indexOf('src/sector-library.js'),'engine layers load in dependency order');
assert.ok(index.includes("connect-src 'self' https://api.anthropic.com https://sultan-strategy-ai.onrender.com"),'CSP allows only the AI endpoints');
for(const token of ['.fx-advanced','.fg-panel','.fg-toggle','.ux-mode','.gw-steps','.ctx-dossier','.ai-review','.fx-banner'])assert.ok(css.includes(token),token);
/* Every field rendered by the base workspace and the final layer has a guide entry. */
const ctx={globalThis:{SultanLocales:{en:{},ar:{}}}};vm.createContext(ctx);vm.runInContext(read('src/locales/field-guide.js'),ctx);
const en=ctx.globalThis.SultanLocales.en,ar=ctx.globalThis.SultanLocales.ar,patterns=ctx.globalThis.SultanFieldGuide.patterns;
const expected=['institution_name','institution_sector','institution_mission','institution_beneficiaries','institution_assets','institution_liabilities','institution_context','institution_culture','institution_vision','institution_notDoing','institution_startYear','institution_endYear',
 'mandates_title','mandates_relationship','mandates_source','mandates_contribution',
 'options_title','options_type','options_outcome','options_whyUs','options_foothold','options_tradeoff','options_owner','options_decision','options_decisionReason','options_stopEvidence','options_riskSource','options_riskDate','options_divestStop','options_releasedResources','options_redeployTo','options_divestEvidence','options_divestImpact','options_assumptions_text','options_assumptions_expectedPersistence','options_assumptions_owner','options_assumptions_testDate','options_assumptions_testEvidence','options_assumptions_failureImpact','options_scores_value','options_scores_note',
 'references_name','references_kind','references_source','references_purpose','references_context','references_adaptation','references_status',
 'transitions_domain','transitions_optionId','transitions_referenceId','transitions_owner','transitions_current','transitions_currentSource','transitions_targetState','transitions_kpi','transitions_unit','transitions_direction','transitions_baseline','transitions_target','transitions_frequency','transitions_dataSource','transitions_rf','transitions_trackType','transitions_maturityFamily','transitions_indicatorType','transitions_annual_milestone','transitions_annual_evidence','transitions_annual_target','transitions_annual_actual','transitions_annual_actualSource','transitions_annual_observation','transitions_history_year','transitions_history_value','transitions_history_source',
 'criteria_name','criteria_weight','criteria_low','criteria_high','weightRationale','reviewNote',
 'enablers_title','enablers_optionId','enablers_kind','enablers_action','enablers_control','enablers_owner','enablers_status','enablers_dueYear','enablers_source','enablers_route','enablers_fallback',
 'initiatives_title','initiatives_kind','initiatives_optionId','initiatives_transitionId','initiatives_owner','initiatives_status','initiatives_startYear','initiatives_endYear','initiatives_output','initiatives_acceptance','initiatives_capacity','initiatives_budgetStatus','initiatives_budget_amount','initiatives_budget_releaseEvidence','funding_available'];
for(const k of expected){assert.ok(patterns.includes(k),'guide missing pattern '+k);for(const d of [en,ar]){assert.ok(typeof d['fgw_'+k]==='string'&&d['fgw_'+k].length>20,'why '+k);assert.ok(typeof d['fge_'+k]==='string'&&d['fge_'+k].length>0,'example '+k);}}
/* Base workspace field keys referenced in app.js / final-ui.js are all covered. */
const used=new Set();for(const m of app.matchAll(/fields\('([a-z]+)\.'\+i,\[((?:\['[^']+'[^\]]*\],?)+)\]/g)){for(const f of m[2].matchAll(/\['([A-Za-z]+)'/g))used.add(m[1]+'_'+f[1]);}
for(const m of app.matchAll(/fields\('institution',\[((?:\['[^']+'[^\]]*\],?)+)\]/g))for(const f of m[1].matchAll(/\['([A-Za-z]+)'/g))used.add('institution_'+f[1]);
for(const m of finalUi.matchAll(/`options\.\$\{i\}\.([A-Za-z]+)`/g))used.add('options_'+m[1]);
for(const m of finalUi.matchAll(/`transitions\.\$\{i\}\.([A-Za-z]+)`/g))used.add('transitions_'+m[1]);
for(const k of used)assert.ok(patterns.includes(k),'workspace field without guidance: '+k);
/* Behaviour of the disclosure rules in a minimal DOM-less environment. */
global.document={addEventListener(){},body:{classList:{toggle(){},contains(){return false}}},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}};
global.location={hash:'#choices'};global.localStorage={getItem(){return null},setItem(){}};global.setTimeout=()=>0;
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};for(const f of ['final','guided','field-guide'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');global.Sultan=require('../src/import.js');require('../src/final-core.js');require('../src/context-core.js');require('../src/sector-library.js');require('../src/draft-engine.js');
require('../src/field-guide.js');const UX=global.SultanUX;
assert.equal(UX.pattern('options.3.scores.benefit.value'),'options.scores.value');assert.equal(UX.pattern('transitions.0.annual.2.milestone'),'transitions.annual.milestone');assert.equal(UX.pattern('initiatives.1.budget.0.releaseEvidence'),'initiatives.budget.releaseEvidence');assert.equal(UX.pattern('institution.mission'),'institution.mission');
const p=global.Sultan.demo();const moon=p.options.findIndex(o=>o.type==='moonshot'),diff=p.options.findIndex(o=>o.type==='differentiation');
assert.equal(UX.isAdvanced(`options.${moon}.foothold`,p),false,'moonshot foothold is essential');assert.equal(UX.isAdvanced(`options.${diff}.foothold`,p),true);
assert.equal(UX.isAdvanced('options.0.title',p),false);assert.equal(UX.isAdvanced('options.0.whyUs',p),false);assert.equal(UX.isAdvanced('options.0.tradeoff',p),false);assert.equal(UX.isAdvanced('options.0.decisionReason',p),true);
assert.equal(UX.isAdvanced('transitions.0.kpi',p),false);assert.equal(UX.isAdvanced('transitions.0.currentSource',p),true);assert.equal(UX.isAdvanced('transitions.0.annual.0.milestone',p),false,'annual rows stay visible');
assert.equal(UX.isAdvanced('institution.name',p),false);assert.equal(UX.isAdvanced('institution.culture',p),true);assert.equal(UX.isAdvanced('enablers.0.fallback',p),true);assert.equal(UX.isAdvanced('enablers.0.control',p),false);
assert.equal(UX.mode(),'simple','without a project the default is the simple mode');
global.SultanApp={getProject:()=>p};assert.equal(UX.mode(),'expert','the fictional example opens in expert mode so every field stays visible');
global.SultanApp={getProject:()=>global.Sultan.blank()};assert.equal(UX.mode(),'simple','a fresh project opens in simple mode');
assert.ok(UX.guide('options.0.whyUs').why.length>20&&UX.guide('nothing.here')===null);
console.log(JSON.stringify({suite:'field-guide',passed:true,patterns:patterns.length,workspaceFieldsCovered:used.size}));
