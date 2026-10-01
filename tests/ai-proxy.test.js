/* AI relay: key stays server-side, model allow-list and caps hold, origins and rate limits are enforced, streams pass through. */
'use strict';
const assert=require('node:assert/strict'),http=require('node:http');
process.env.ANTHROPIC_API_KEY='server-secret';process.env.ALLOWED_ORIGINS='https://app.example';process.env.RATE_LIMIT_PER_HOUR='3';process.env.MAX_TOKENS_CAP='500';
const received=[];
const upstream=http.createServer((req,res)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{received.push({headers:req.headers,body:JSON.parse(b)});if(req.url==='/v1/messages'&&JSON.parse(b).stream){res.writeHead(200,{'content-type':'text/event-stream'});res.write('event: message_start\ndata: {"type":"message_start"}\n\n');setTimeout(()=>{res.write('event: message_stop\ndata: {"type":"message_stop"}\n\n');res.end();},20);return;}res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'m',content:[{type:'text',text:'OK'}],stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}}));});});
(async()=>{
 await new Promise(r=>upstream.listen(0,r));process.env.ANTHROPIC_BASE_URL='http://127.0.0.1:'+upstream.address().port;
 const {server}=require('../server/ai-proxy.js');await new Promise(r=>server.listen(0,r));const base='http://127.0.0.1:'+server.address().port;
 const post=(body,headers={})=>fetch(base+'/v1/messages',{method:'POST',headers:Object.assign({'content-type':'application/json','origin':'https://app.example','anthropic-version':'2023-06-01','anthropic-beta':'server-side-fallback-2026-07-01'},headers),body:JSON.stringify(body)});
 const health=await (await fetch(base+'/healthz')).json();assert.equal(health.ok,true);assert.equal(health.keyConfigured,true);
 const pre=await fetch(base+'/v1/messages',{method:'OPTIONS',headers:{origin:'https://app.example','access-control-request-method':'POST'}});assert.equal(pre.status,204);assert.equal(pre.headers.get('access-control-allow-origin'),'https://app.example');
 const bad=await fetch(base+'/v1/messages',{method:'OPTIONS',headers:{origin:'https://evil.example'}});assert.equal(bad.status,403);
 const ok=await post({model:'claude-opus-5-5',max_tokens:9000,messages:[{role:'user',content:'hi'}]});assert.equal(ok.status,200);const okJson=await ok.json();assert.equal(okJson.content[0].text,'OK');
 const up=received.at(-1);assert.equal(up.headers['x-api-key'],'server-secret','relay injects the server key');assert.equal(up.headers['anthropic-beta'],'server-side-fallback-2026-07-01','beta header forwarded');assert.equal(up.body.max_tokens,500,'max_tokens capped');
 const denied=await post({model:'claude-haiku-4-5',max_tokens:10,messages:[{role:'user',content:'hi'}]});assert.equal(denied.status,400);
 const wrongOrigin=await post({model:'claude-opus-5-5',max_tokens:10,messages:[{role:'user',content:'hi'}]},{origin:'https://evil.example'});assert.equal(wrongOrigin.status,403);
 const streamed=await post({model:'claude-opus-5-5',max_tokens:10,stream:true,messages:[{role:'user',content:'hi'}]});assert.equal(streamed.status,200);const text=await streamed.text();assert.ok(text.includes('message_start')&&text.includes('message_stop'),'SSE passes through');
 const limited=await post({model:'claude-opus-5-5',max_tokens:10,messages:[{role:'user',content:'hi'}]});assert.equal(limited.status,429,'fourth request in the hour is rate limited');
 server.close();upstream.close();
 console.log(JSON.stringify({suite:'ai-proxy',passed:true,upstreamCalls:received.length}));
})().catch(err=>{console.error(err);process.exitCode=1;upstream.close();});
