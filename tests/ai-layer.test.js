/* AI layer: nothing leaves without consent; transports send the documented headers; streams and errors are handled. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.SultanLocales={en:require('../src/locales/en.js'),ar:require('../src/locales/ar.js')};
for(const f of ['final','guided','field-guide'])require('../src/locales/'+f+'.js');
global.SultanI18n=require('../src/i18n.js');
for(const f of ['lens'])require('../src/locales/'+f+'.js');
global.Sultan=require('../src/import.js');require('../src/final-core.js');require('../src/context-core.js');require('../src/sector-library.js');require('../src/draft-engine.js');
const Lens=require('../src/expert-lens.js');const lensMem={};Lens._setStorage({get:k=>lensMem[k]??null,set:(k,v)=>{lensMem[k]=v;}});
const AI=require('../src/ai.js'),E=global.Sultan,D=global.SultanDraft;
const src=fs.readFileSync(path.join(__dirname,'../src/ai.js'),'utf8');
assert.ok(src.includes("'anthropic-dangerous-direct-browser-access'")&&src.includes("anthropic-version"),'documented browser headers');
assert.ok(!/sk-ant-[A-Za-z0-9]{10,}/.test(src),'no key literal in source');
const mem={};AI._setStorage({get:k=>mem[k]??null,set:(k,v)=>{mem[k]=v;},remove:k=>{delete mem[k];}});
const calls=[];
function sse(events){return events.map(e=>`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');}
function streamResponse(text,extra={}){const body=sse([{type:'message_start',message:{id:'msg_1',model:'claude-opus-5-5',usage:{input_tokens:11}}},{type:'content_block_start',index:0,content_block:{type:'text',text:''}},...text.match(/.{1,40}/gs).map(t=>({type:'content_block_delta',index:0,delta:{type:'text_delta',text:t}})),{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:extra.stop||'end_turn'},usage:{output_tokens:22}},{type:'message_stop'}]);const chunks=[];for(let i=0;i<body.length;i+=37)chunks.push(new TextEncoder().encode(body.slice(i,i+37)));let n=0;return {ok:true,status:200,body:{getReader(){return {read:async()=>n<chunks.length?{value:chunks[n++],done:false}:{value:undefined,done:true}};}},json:async()=>({})};}
function jsonResponse(status,obj){return {ok:status<400,status,json:async()=>obj};}
let next=()=>jsonResponse(200,{id:'m',model:'claude-opus-5-5',content:[{type:'text',text:'OK'}],stop_reason:'end_turn',usage:{input_tokens:3,output_tokens:1}});
AI._setFetch(async(url,init)=>{calls.push({url,init,body:JSON.parse(init.body)});return next();});
(async()=>{
 assert.equal(AI.configured(),false);AI.saveSettings({model:'claude-opus-5-5',extractModel:'claude-sonnet-5-5'});
 await assert.rejects(()=>AI.call({model:'claude-opus-5-5',max_tokens:10,messages:[]}),e=>e.code==='consent','nothing is sent before consent');
 assert.equal(calls.length,0);
 AI.saveSettings({consent:true,transport:'direct'});assert.equal(AI.configured(),false,'direct needs a key');
 await assert.rejects(()=>AI.ping(),e=>e.code==='auth');
 AI.saveApiKey('sk-ant-test-key');assert.equal(AI.configured(),true);
 assert.ok(!JSON.stringify(mem['sultan.ai.v1']).includes('sk-ant'),'key is stored separately from settings');
 const pong=await AI.ping();assert.equal(pong.ok,true);
 let c=calls.at(-1);assert.equal(c.url,'https://api.anthropic.com/v1/messages');assert.equal(c.init.headers['x-api-key'],'sk-ant-test-key');assert.equal(c.init.headers['anthropic-dangerous-direct-browser-access'],'true');assert.equal(c.init.headers['anthropic-version'],'2023-06-01');assert.ok(c.init.headers['anthropic-beta'].includes('server-side-fallback'));assert.equal(c.body.fallbacks,'default');assert.equal(c.body.output_config.effort,'low');assert.equal(c.body.thinking,undefined,'adaptive thinking by default; no budget_tokens');
 AI.saveSettings({transport:'proxy',endpoint:'https://relay.example/'});await AI.ping();c=calls.at(-1);assert.equal(c.url,'https://relay.example/v1/messages');assert.equal(c.init.headers['x-api-key'],undefined,'proxy never receives the browser key');assert.equal(c.init.headers['x-sultan-client'],'web');
 /* error mapping */
 next=()=>jsonResponse(401,{error:{message:'bad key'}});await assert.rejects(()=>AI.ping(),e=>e.code==='auth');
 next=()=>jsonResponse(429,{error:{message:'slow'}});await assert.rejects(()=>AI.ping(),e=>e.code==='rate');
 next=()=>jsonResponse(500,{});await assert.rejects(()=>AI.ping(),e=>e.code==='server');
 next=()=>jsonResponse(200,{content:[],stop_reason:'refusal',stop_details:{explanation:'no'}});await assert.rejects(()=>AI.ping(),e=>e.code==='refusal');
 /* streamed structured output */
 const project=D.build({sectorId:'edu',typeId:'private',brief:'Private school, 2,400 students',institution:{name:'School',vision:'V',beneficiaries:'B',startYear:2027,endYear:2030},goals:[{goalId:'quality',baseline:60,target:70}]});
 const draft={institution:{mission:'',beneficiaries:'',assets:'',liabilities:'',context:'',culture:'',vision:'',notDoing:''},mandates:[],weightRationale:'',options:[{key:'a',title:'AI choice',type:'differentiation',outcome:'o',whyUs:'w',foothold:'',tradeoff:'t',owner:'x',decision:'select',decisionReason:'r',riskSource:'rs',stopEvidence:'',scores:[],assumptions:[],divest:{stop:'',releasedResources:null,redeployTo:'',evidence:'',impact:''}}],references:[],transitions:[],enablers:[],initiatives:[],contextSources:[],openQuestions:[],notes:''};
 next=()=>streamResponse(JSON.stringify(draft));
 const progress=[];const r=await AI.generateStrategy({project,goalHints:['Quality'],onProgress:x=>progress.push(x.chars)});
 c=calls.at(-1);assert.equal(c.body.stream,true);assert.equal(c.body.output_config.format.type,'json_schema');assert.equal(c.body.output_config.effort,'high');assert.ok(c.body.system.includes('Unknown is never zero'));assert.ok(c.body.messages[0].content.includes('Quality'));assert.ok(c.body.messages[0].content.includes('etec.gov.sa'),'library grounding travels with the prompt');
 assert.ok(c.body.system.includes('(partner-route)')&&c.body.system.includes('(recurring)'),'the expert lenses travel in the system prompt');
 Lens.setIncludeInAI(false);await AI.generateStrategy({project});assert.ok(!calls.at(-1).body.system.includes('(partner-route)'),'the expert can keep lenses out of the prompts');Lens.setIncludeInAI(true);
 assert.deepEqual(r.data.options[0].title,'AI choice');assert.deepEqual(r.usage,{inputTokens:11,outputTokens:22,model:'claude-opus-5-5'});assert.ok(progress.length>1,'streaming progress is reported');
 const merged=D.fromAI(r.data,project,{mode:'replace'});assert.equal(merged.options[0].title,'AI choice');
 /* research step: web search tool + documents + two calls */
 let step=0;next=()=>{step++;return step===1?streamResponse('Memo with sources\n1. Regulation X — MoE — https://moe.gov.sa — 2024'):streamResponse(JSON.stringify({sources:[{title:'Regulation X',kind:'regulation',issuer:'MoE',url:'https://moe.gov.sa',year:2024,summary:'s',relevance:'r'}],documents:[{name:'report.pdf',summary:'baseline 61'}],openQuestions:['Fees?'],summary:'done'}));};
 const g=await AI.gatherContext({project,documents:[{name:'report.pdf',kind:'pdf',base64:'QUJD'},{name:'notes.txt',kind:'text',text:'hello'}]});
 const research=calls.at(-2),extract=calls.at(-1);
 assert.deepEqual(research.body.tools,[{type:'web_search_20260209',name:'web_search',max_uses:10}]);
 assert.equal(research.body.messages[0].content[0].type,'document');assert.equal(research.body.messages[0].content[0].source.media_type,'application/pdf');assert.equal(research.body.messages[0].content[1].source.type,'text');
 assert.equal(extract.body.model,'claude-sonnet-5-5','extraction uses the configured extractor model');assert.equal(extract.body.output_config.format.type,'json_schema');
 assert.equal(g.data.sources[0].title,'Regulation X');assert.equal(g.usage.length,2);
 AI.saveSettings({webSearch:false});step=0;await AI.gatherContext({project});assert.equal(calls.at(-2).body.tools,undefined,'web search can be switched off');
 AI.saveSettings({webSearch:true});step=0;next=()=>++step===1?jsonResponse(429,{error:{message:'search quota'}}):streamResponse('Library context requiring verification');
 const fallback=await AI.researchContext({project});assert.equal(step,2);assert.equal(calls.at(-1).body.tools,undefined);assert.ok(fallback.memo.includes('Web search was unavailable'));assert.ok(calls.at(-1).body.messages[0].content.at(-1).text.includes('Do not claim any online verification'));
 AI.saveSettings({webSearch:false});
 /* field suggestion and review */
 next=()=>jsonResponse(200,{model:'claude-opus-5-5',content:[{type:'text',text:'  A concise mission.  '}],stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:2}});
 const f=await AI.suggestField({project,path:'institution.mission',label:'Mission',why:'why',current:'',section:'identity'});assert.equal(f.text,'A concise mission.');assert.equal(calls.at(-1).body.output_config.effort,'medium');
 next=()=>streamResponse(JSON.stringify({summary:'ok',strengths:['s'],items:[{section:'choices',severity:'blocking',message:'m',fix:'f'}]}));
 const rv=await AI.reviewStrategy({project});assert.equal(rv.data.items[0].severity,'blocking');assert.ok(calls.at(-1).body.messages[0].content.includes('40 years'));
 assert.ok(calls.at(-1).body.messages[0].content.includes('- partner-route:'),'the review applies the lenses explicitly');assert.ok(calls.at(-1).body.output_config.format.schema.properties.items.items.required.includes('lens'),'findings name their lens');
 /* learning patterns from the adviser's notes */
 next=()=>jsonResponse(200,{model:'claude-opus-5-5',content:[{type:'text',text:JSON.stringify({lenses:[{title:'Recurring business',question:'Is it recurring?',lookFor:'Subscriptions',keywords:['recurring','اشتراك'],group:'growth'}]})}],stop_reason:'end_turn',usage:{input_tokens:5,output_tokens:9}});
 const lx=await AI.extractLenses({text:'Fraud is a good use case because it is recurring business.'});assert.equal(lx.data.lenses[0].group,'growth');assert.deepEqual(calls.at(-1).body.output_config.format.schema.required,['lenses']);assert.ok(calls.at(-1).body.messages[0].content.includes('recurring business'));
 /* parse tolerance and truncation flag */
 assert.deepEqual(AI.parseJson('Here you go: {"a":1} thanks'),{a:1});assert.throws(()=>AI.parseJson('nope'),e=>e.code==='parse');
 next=()=>streamResponse(JSON.stringify(draft),{stop:'max_tokens'});const tr=await AI.generateStrategy({project});assert.equal(tr.truncated,true);
 /* forgetting */
 AI.saveApiKey('');AI.saveSettings({consent:false});assert.equal(AI.configured(),false);assert.equal(mem['sultan.ai.key'],undefined);
 console.log(JSON.stringify({suite:'ai-layer',passed:true,calls:calls.length}));
})().catch(err=>{console.error(err);process.exitCode=1;});
