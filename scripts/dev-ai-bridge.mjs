import {createServer} from 'vite';
import {createInterface} from 'node:readline';

// Owner-only local testing against the private deployed backend. Credentials
// arrive through stdin, stay in this process, and never enter Vite's client env.
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const input=createInterface({input:process.stdin,terminal:false});
console.log('Waiting for private backend connection.');
const config=await new Promise(resolve=>input.once('line',line=>resolve(JSON.parse(line))));
input.close();
if(process.stdin.isTTY)process.stdin.setRawMode(false);
const remote=new URL(config.url);
if(remote.protocol!=='https:'||!config.token)throw Error('Invalid private backend configuration');
const send=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body))};
const bridge={name:'owner-ai-test-bridge',enforce:'pre',configureServer(server){
 server.middlewares.use('/api/',async(req,res,next)=>{
  const route=req.url?.split('?')[0];
  if(route==='/payments/config')return send(res,200,{enabled:false,test:true,amount:200,currency:'eur'});
  if(!['/review','/review/status'].includes(route))return send(res,404,{error:'not_found'});
  if(req.headers.host!=='127.0.0.1:5173')return send(res,403,{error:'origin'});
  if(route==='/review'&&(req.method!=='POST'||req.headers.origin!=='http://127.0.0.1:5173'))return send(res,403,{error:'origin'});
  if(route==='/review/status'&&req.method!=='GET')return send(res,405,{error:'method'});
  try{
   let body;
   if(req.method==='POST'){
    let size=0,chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>125000)return send(res,413,{error:'invalid_body'});chunks.push(chunk)}
    body=Buffer.concat(chunks).toString('utf8');
    const review=JSON.parse(body);
    // The deployed CV-only version must never silently ignore a supplied letter.
    if(review.letter?.trim())return send(res,409,{error:'letter_review_not_deployed'});
   }
   const response=await fetch(new URL('/api'+route,remote),{method:req.method,headers:{'Content-Type':'application/json',Origin:remote.origin,'OAI-Sites-Authorization':`Bearer ${config.token}`},body,redirect:'error',signal:AbortSignal.timeout(55000)});
   const result=await response.json();
   if(route==='/review/status'&&result.available===true)result.testMode='private_cv_only';
   send(res,response.status,result);
  }catch{send(res,502,{error:'private_backend_unavailable'})}
 });
}};
const server=await createServer({plugins:[bridge],server:{host:'127.0.0.1',port:5173,strictPort:true}});
await server.listen();
console.log('Private CV review testing connected at http://127.0.0.1:5173/ — uses the existing lifetime quota.');
server.printUrls();
