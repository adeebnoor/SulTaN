'use strict';
const assert=require('node:assert/strict'),http=require('node:http');
process.env.GEMINI_API_KEY='test-gemini-secret';process.env.GEMINI_MODEL='gemini-2.5-flash';process.env.ALLOWED_ORIGINS='https://app.example';
const calls=[];let fail=false;
const upstream=http.createServer((req,res)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{calls.push({url:req.url,headers:req.headers,body:JSON.parse(raw)});res.writeHead(fail?403:200,{'content-type':'application/json'});res.end(JSON.stringify(fail?{error:{status:'PERMISSION_DENIED',message:'test-gemini-secret'}}:{candidates:[{content:{parts:[{text:'{"answer":"OK"}'}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:3,candidatesTokenCount:4}}));});});
(async()=>{let server;try{
 await new Promise(r=>upstream.listen(0,r));process.env.GEMINI_BASE_URL='http://127.0.0.1:'+upstream.address().port;
 const relay=require('../server/ai-proxy.js');server=relay.server;await new Promise(r=>server.listen(0,r));const base='http://127.0.0.1:'+server.address().port;
 const body={model:'gemini-2.5-flash',max_tokens:100,system:'Keep unknowns unknown.',messages:[{role:'user',content:[{type:'text',text:'Test only'},{type:'document',source:{type:'base64',media_type:'application/pdf',data:'QUJD'}},{type:'document',title:'notes',source:{type:'text',data:'Plain text'}}]}],output_config:{format:{schema:{type:'object',properties:{answer:{type:'string'}},required:['answer']}}}};
 const post=b=>fetch(base+'/v1/messages',{method:'POST',headers:{'content-type':'application/json',origin:'https://app.example'},body:JSON.stringify(b)});
 const health=await(await fetch(base+'/healthz')).json();assert.equal(health.provider,'gemini');assert.equal(health.keyConfigured,true);assert.ok(!JSON.stringify(health).includes('test-gemini-secret'));
 const response=await post(body);assert.equal(response.status,200);const m=await response.json();assert.equal(m.model,'gemini-2.5-flash');assert.equal(m.content[0].text,'{"answer":"OK"}');assert.equal(m.usage.output_tokens,4);
 const c=calls[0];assert.equal(c.headers['x-goog-api-key'],'test-gemini-secret');assert.equal(c.body.generationConfig.responseMimeType,'application/json');assert.equal(c.body.systemInstruction.parts[0].text,body.system);assert.equal(c.body.contents[0].parts[1].inlineData.mimeType,'application/pdf');assert.equal(c.body.contents[0].parts[2].text,'notes\nPlain text');assert.equal(c.body.generationConfig.thinkingConfig.thinkingBudget,0);
 const streamed=await post({...body,stream:true});const wire=await streamed.text();assert.ok(wire.includes('content_block_delta'));assert.ok(!wire.includes('test-gemini-secret'));
 fail=true;const denied=await post(body);assert.equal(denied.status,403);assert.ok(!(await denied.text()).includes('test-gemini-secret'),'provider errors cannot expose keys');
 const research=relay.geminiPayload({...body,output_config:undefined,tools:[{name:'web_search'}]});assert.deepEqual(research.tools,[{googleSearch:{}}]);
 console.log(JSON.stringify({suite:'gemini-relay',passed:true,requests:calls.length}));
 }finally{server?.close();upstream.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
