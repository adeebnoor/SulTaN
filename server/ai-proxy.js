/* SULTAN AI relay — a deliberately small, dependency-free proxy for the Claude Messages API.
   It holds the Anthropic API key server-side so the public web app never ships a key, and it
   forwards POST /v1/messages bodies unchanged (model allow-list and max_tokens cap enforced),
   including streamed responses. It stores nothing: no bodies, no project data, no logs beyond
   a per-IP counter kept in memory for rate limiting.

   Environment:
     ANTHROPIC_API_KEY      required
     ALLOWED_ORIGINS        comma-separated browser origins (default: the public SULTAN site)
     PORT                   default 8787
     MODEL_ALLOWLIST        comma-separated model ids (default: the three models the app offers)
     MAX_TOKENS_CAP         default 64000
     MAX_BODY_BYTES         default 33554432 (32 MB — the API request limit)
     RATE_LIMIT_PER_HOUR    requests per IP per hour (default 60)
     ANTHROPIC_BASE_URL     default https://api.anthropic.com (tests point it at a fake upstream)

   Run: node server/ai-proxy.js */
'use strict';
const http=require('node:http');
const {URL}=require('node:url');
const env=process.env;
const PORT=Number(env.PORT||8787);
const API_KEY=env.ANTHROPIC_API_KEY||'';
const GEMINI_KEY=env.GEMINI_API_KEY||'';
const GEMINI_MODEL=env.GEMINI_MODEL||'gemini-flash-lite-latest';
const GEMINI_BASE=(env.GEMINI_BASE_URL||'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/,'');
const BASE=(env.ANTHROPIC_BASE_URL||'https://api.anthropic.com').replace(/\/+$/,'');
const ORIGINS=(env.ALLOWED_ORIGINS||'https://sultan-strategy-beta.onrender.com').split(',').map(s=>s.trim()).filter(Boolean);
const MODELS=new Set((env.MODEL_ALLOWLIST||'claude-opus-5-5,claude-sonnet-5-5,claude-fable-5-1,gemini-2.5-flash,gemini-flash-latest,gemini-flash-lite-latest').split(',').map(s=>s.trim()).filter(Boolean));
const MAX_TOKENS_CAP=Number(env.MAX_TOKENS_CAP||64000);
const MAX_BODY=Number(env.MAX_BODY_BYTES||32*1024*1024);
const RATE=Number(env.RATE_LIMIT_PER_HOUR||60);
const FORWARD_HEADERS=['anthropic-version','anthropic-beta'];
const buckets=new Map();
function allowed(ip){const now=Date.now(),b=buckets.get(ip)||[];const recent=b.filter(t=>now-t<3600000);if(recent.length>=RATE){buckets.set(ip,recent);return false;}recent.push(now);buckets.set(ip,recent);return true;}
function cors(req,res){const origin=req.headers.origin||'';const ok=ORIGINS.includes('*')||ORIGINS.includes(origin);if(ok){res.setHeader('access-control-allow-origin',origin||'*');res.setHeader('vary','origin');res.setHeader('access-control-allow-methods','POST, GET, OPTIONS');res.setHeader('access-control-allow-headers','content-type, anthropic-version, anthropic-beta, x-sultan-client');res.setHeader('access-control-max-age','600');}return ok||!origin;}
function json(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}
function readBody(req){return new Promise((resolve,reject)=>{let size=0;const chunks=[];req.on('data',c=>{size+=c.length;if(size>MAX_BODY){reject(Object.assign(new Error('payload too large'),{status:413}));req.destroy();return;}chunks.push(c);});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);});}
function validate(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Object.assign(new Error('body must be a JSON object'),{status:400});
 if(!MODELS.has(body.model))throw Object.assign(new Error('model not allowed'),{status:400});
 if(!Array.isArray(body.messages)||!body.messages.length)throw Object.assign(new Error('messages required'),{status:400});
 if(!Number.isInteger(body.max_tokens)||body.max_tokens<1)throw Object.assign(new Error('max_tokens required'),{status:400});
 body.max_tokens=Math.min(body.max_tokens,MAX_TOKENS_CAP);
 return body;
}
/* Translate the workspace protocol into Google's native generateContent API.
   Only the server owns the key. JSON schemas and uploaded PDF/text blocks retain their meaning. */
function geminiPayload(body){
 const parts=content=>typeof content==='string'?[{text:content}]:(content||[]).map(b=>{
  if(b.type==='text')return {text:b.text||''};
  if(b.type==='document'&&b.source?.type==='base64')return {inlineData:{mimeType:b.source.media_type,data:b.source.data}};
  if(b.type==='document'&&b.source?.type==='text')return {text:(b.title?b.title+'\n':'')+(b.source.data||'')};
  throw Object.assign(new Error('Unsupported content block'),{status:400});
 });
 const payload={contents:body.messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:parts(m.content)})),generationConfig:{maxOutputTokens:Math.min(body.max_tokens,MAX_TOKENS_CAP)}};
 if(GEMINI_MODEL==='gemini-2.5-flash')payload.generationConfig.thinkingConfig={thinkingBudget:0};
 if(body.system)payload.systemInstruction={parts:parts(body.system)};
 const schema=body.output_config?.format?.schema;
 if(schema){payload.generationConfig.responseMimeType='application/json';payload.generationConfig.responseJsonSchema=schema;}
 if(body.tools?.some(t=>t.name==='web_search'))payload.tools=[{googleSearch:{}}];
 return payload;
}
async function geminiRelay(body,res){
 let payload;try{payload=geminiPayload(body);}catch(e){return json(res,e.status||400,{type:'error',error:{message:e.message}});}
 let up;
 try{for(let attempt=0;attempt<3;attempt++){up=await fetch(GEMINI_BASE+'/models/'+encodeURIComponent(GEMINI_MODEL)+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':GEMINI_KEY},body:JSON.stringify(payload),signal:AbortSignal.timeout(65000)});if(up.status!==503||attempt===2)break;await up.body?.cancel();await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
 catch{return json(res,502,{type:'error',error:{message:'Gemini request timed out or is unreachable.'}});}
 let data;try{data=await up.json();}catch{return json(res,502,{type:'error',error:{message:'Invalid Gemini response.'}});}
 if(!up.ok)return json(res,up.status,{type:'error',error:{type:data.error?.status||'api_error',message:'Gemini rejected the request ('+(data.error?.status||up.status)+'). Check the API key, model access and quota in Google AI Studio.'}});
 const c=data.candidates?.[0];let text=(c?.content?.parts||[]).filter(p=>p.text&&!p.thought).map(p=>p.text).join('\n');
 const sources=c?.groundingMetadata?.groundingChunks?.map(x=>x.web).filter(Boolean)||[];
 if(sources.length)text+='\n\nGrounding sources:\n'+sources.map(x=>x.title+' — '+x.uri).join('\n');
 if(!text)return json(res,422,{type:'error',error:{message:'Gemini returned no usable text; review the prompt and safety feedback.'}});
 const message={type:'message',model:data.modelVersion||GEMINI_MODEL,content:[{type:'text',text}],stop_reason:c.finishReason==='MAX_TOKENS'?'max_tokens':'end_turn',usage:{input_tokens:data.usageMetadata?.promptTokenCount||0,output_tokens:data.usageMetadata?.candidatesTokenCount||0}};
 res.setHeader('cache-control','no-store');
 if(!body.stream)return json(res,200,message);
 res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8'});
 const send=e=>res.write('data: '+JSON.stringify(e)+'\n\n');
 send({type:'message_start',message});send({type:'content_block_start',index:0,content_block:{type:'text',text:''}});
 send({type:'content_block_delta',index:0,delta:{type:'text_delta',text}});
 send({type:'message_delta',delta:{stop_reason:message.stop_reason},usage:message.usage});send({type:'message_stop'});res.end();
}
async function relay(req,res){
 const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress||'unknown';
 if(!allowed(ip))return json(res,429,{type:'error',error:{type:'rate_limit_error',message:'Too many requests from this address; try again later.'}});
 if(!API_KEY&&!GEMINI_KEY)return json(res,503,{type:'error',error:{type:'configuration_error',message:'The relay has no provider API key configured.'}});
 let body;
 try{body=validate(JSON.parse((await readBody(req)).toString('utf8')||'{}'));}
 catch(err){return json(res,err.status||400,{type:'error',error:{type:'invalid_request_error',message:err.message}});}
 if(GEMINI_KEY)return geminiRelay(body,res);
 const headers={'content-type':'application/json','x-api-key':API_KEY,'anthropic-version':req.headers['anthropic-version']||'2023-06-01'};
 for(const h of FORWARD_HEADERS)if(req.headers[h]&&h!=='anthropic-version')headers[h]=req.headers[h];
 let upstream;
 try{upstream=await fetch(BASE+'/v1/messages',{method:'POST',headers,body:JSON.stringify(body)});}
 catch(err){return json(res,502,{type:'error',error:{type:'api_error',message:'Upstream unreachable: '+err.message}});}
 res.writeHead(upstream.status,{'content-type':upstream.headers.get('content-type')||'application/json','cache-control':'no-store'});
 if(!upstream.body){res.end();return;}
 const reader=upstream.body.getReader();
 try{for(;;){const {value,done}=await reader.read();if(done)break;res.write(Buffer.from(value));}}catch{}
 res.end();
}
const server=http.createServer(async(req,res)=>{
 const ok=cors(req,res);
 const url=new URL(req.url,'http://localhost');
 if(req.method==='OPTIONS'){res.writeHead(ok?204:403);res.end();return;}
 if(!ok)return json(res,403,{type:'error',error:{type:'permission_error',message:'Origin not allowed.'}});
 if(req.method==='GET'&&url.pathname==='/healthz')return json(res,200,{ok:true,models:[...MODELS],keyConfigured:!!(API_KEY||GEMINI_KEY),provider:GEMINI_KEY?'gemini':API_KEY?'anthropic':'none',defaultModel:GEMINI_KEY?GEMINI_MODEL:''});
 if(req.method==='POST'&&url.pathname==='/v1/messages')return relay(req,res);
 json(res,404,{type:'error',error:{type:'not_found_error',message:'Not found.'}});
});
if(require.main===module){server.listen(PORT,()=>console.log(`SULTAN AI relay listening on :${PORT}; origins=${ORIGINS.join(',')}; models=${[...MODELS].join(',')}`));}
module.exports={server,validate,allowed,MODELS,geminiPayload};
