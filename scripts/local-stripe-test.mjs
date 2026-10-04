import {createServer} from 'node:http';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {createServer as createViteServer} from 'vite';
import {handleAPI} from '../worker/index.js';
import {createLocalDatabase,localTestEnvironment} from './local-test-runtime.mjs';

const port=5174,origin=`http://localhost:${port}`;
mkdirSync('test-output',{recursive:true});
const db=createLocalDatabase('test-output/local-stripe-test.sqlite');
// This server never loads .env, which can contain live credentials.
const configuration=()=>{try{return parseEnv(readFileSync('.env.local-test','utf8'))}catch{return {}}};
const vite=await createViteServer({configFile:false,envDir:'test-output/no-env',server:{middlewareMode:true,hmr:false},appType:'spa'});
const server=createServer(async(req,res)=>{
 if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host)){
  res.writeHead(403);res.end('Local test only');return;
 }
 if(!req.url?.startsWith('/api/')){vite.middlewares(req,res);return}
 try{
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>125000){res.writeHead(413);res.end();return}chunks.push(chunk)}
  const request=new Request(`http://${req.headers.host}${req.url}`,{
   method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})
  });
  const diagnostics=[],reviewStarted=Date.now();
  const transport=async(url,options)=>{
   const start=Date.now();
   try{const response=await fetch(url,options);
    if(new URL(url).hostname==='api.deepseek.com'){
     diagnostics.push({provider:'DeepSeek',status:response.status,headersElapsedMs:Date.now()-start});
    }
    return response;
   }catch(error){if(new URL(url).hostname==='api.deepseek.com')diagnostics.push({provider:'DeepSeek',elapsedMs:Date.now()-start,error:['TimeoutError','AbortError'].includes(error.name)?'timeout':'connection_failed'});throw error}
  };
  const response=await handleAPI(request,localTestEnvironment(configuration(),db),transport);
  if(new URL(request.url).pathname==='/api/review'){
   const value=await response.clone().json().catch(()=>({}));
   writeFileSync('test-output/local-test-diagnostics.json',JSON.stringify({time:new Date().toISOString(),status:response.status,elapsedMs:Date.now()-reviewStarted,error:value.error||null,reason:value.reason||null,payment:value.payment||null,counts:JSON.parse(response.headers.get('X-Review-Counts')||'null'),provider:diagnostics},null,2));
  }
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"local_test_unavailable"}')}
});
server.listen(port,'127.0.0.1',()=>{
 const values=configuration();
 console.log(`Local Stripe TEST + real AI review: ${origin}/`);
 console.log(`Stripe sandbox key: ${/^(sk|rk)_test_/.test(values.STRIPE_SECRET_KEY||'')?'configured':'missing (live keys rejected)'}`);
 console.log(`DeepSeek key: ${values.DEEPSEEK_API_KEY?'configured':'missing'}`);
 console.log('Keys reload from .env.local-test on each API request. No real Stripe charges.');
});
async function close(){server.close();await vite.close();db.close();process.exit(0)}
process.once('SIGINT',close);process.once('SIGTERM',close);
