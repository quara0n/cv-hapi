// Records the operator's decision to permit AI submissions.
// It does not certify compliance or establish provider processing terms.
export const privacyApproved=env=>env.AI_PRIVACY_APPROVED==='true';
const localSandbox=(env,request)=>['localhost','127.0.0.1'].includes(new URL(request.url).hostname)&&env.PAYMENTS_ENABLED==='test'&&/^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY||'');
export const localOwnerCredit=(env,request)=>localSandbox(env,request)&&env.LOCAL_TEST_REPAIR_ATTEMPT==='true'&&env.LOCAL_TEST_OWNER_CREDIT==='true';
export const localUnlimitedReviews=(env,request)=>localOwnerCredit(env,request)&&env.LOCAL_TEST_UNLIMITED_REVIEWS==='true';
export const reviewModel=env=>env.DEEPSEEK_MODEL==='deepseek-v4-pro'?'deepseek-v4-pro':'deepseek-flash';
// Explicitly authorized owner retries; never apply on a hosted domain.
export function reviewLimit(env,request){
 if(localUnlimitedReviews(env,request))return Infinity;
 if(localSandbox(env,request)){
  if(env.LOCAL_TEST_REPAIR_ATTEMPT==='true')return 15;
  if(env.LOCAL_TEST_FINAL_ATTEMPT==='true')return 12;
  if(env.LOCAL_TEST_EXTRA_ATTEMPT==='true')return 11;
 }
 // The configured lifetime allowance is explicit and bounded; never reset usage.
 const limit=Number(env.AI_MAX_REVIEWS);
 return Number.isSafeInteger(limit)&&limit>0?Math.min(1000,limit):0;
}
