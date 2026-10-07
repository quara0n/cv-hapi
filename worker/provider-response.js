// Regenerate a token-truncated response once; never parse or deliver its partial JSON.
// Both requests share the caller's deadline and count as one customer review.
export async function completeResponse(transport,url,options,readJSON,limit){
 let response=await transport(url,options);
 let result=response.ok?await readJSON(response,limit):null;
 if(result?.choices?.[0]?.finish_reason==='length'&&!options.signal?.aborted){
  const body=JSON.parse(options.body);
  response=await transport(url,{...options,body:JSON.stringify({...body,max_tokens:Math.min(16000,body.max_tokens*2)})});
  result=response.ok?await readJSON(response,limit):null;
 }
 return {response,result};
}
