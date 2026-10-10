import React,{useEffect,useState} from 'react';
import {Check,Wallet,LoaderCircle,ShieldCheck,PartyPopper,RefreshCw} from 'lucide-react';
import Button from './components/ui/Button';
import {supabase} from './lib/supabase';

export default function SubscriptionsPanel({plans=[],tokenBalance=0,onRefresh=()=>{}}){
 const active=plans.filter(p=>p.active);
 const [busyPlan,setBusyPlan]=useState('');
 const [notice,setNotice]=useState(null);
 const [checking,setChecking]=useState(false);

 const verifyOrder=async(orderId)=>{
  if(!orderId||!supabase)return;
  setChecking(true);
  try{
   const {data,error}=await supabase.functions.invoke('phonepe-verify-order',{body:{merchantOrderId:orderId}});
   if(error)throw error;
   if(data?.state==='completed'){
    setNotice({kind:'success',title:'Payment successful!',message:Number(data.tokensGranted)===55?'You received 50 subscription tokens + 5 bonus tokens. Total: 55 tokens 🎉':`You received ${data.tokensGranted} tokens. Your subscription is active. 🎉`});
    await onRefresh();
    const url=new URL(window.location.href);url.searchParams.delete('phonepe_order');window.history.replaceState({},'',url);
   }else if(data?.state==='failed'){
    setNotice({kind:'error',title:'Payment not completed',message:data.message||'No tokens were added. You can try again.'});
   }else{
    setNotice({kind:'pending',title:'Confirming your payment',message:data?.message||'PhonePe is still confirming your payment. Please check again shortly.'});
   }
  }catch(e){setNotice({kind:'error',title:'Could not verify payment',message:e.message||'Please refresh this page in a moment.'});}
  finally{setChecking(false);}
 };

 useEffect(()=>{const url=new URL(window.location.href);const orderId=url.searchParams.get('phonepe_order');if(orderId)void verifyOrder(orderId);},[]);

 const choosePlan=async(plan)=>{
  setNotice(null);
  if(Number(plan.monthly_price||0)===0){setNotice({kind:'info',title:'Free plan',message:'This plan does not need a payment. Contact support if you need help activating it.'});return;}
  if(!supabase){setNotice({kind:'error',title:'Payments unavailable',message:'RoomOra payment services are not configured.'});return;}
  setBusyPlan(plan.id);
  try{
   const {data,error}=await supabase.functions.invoke('phonepe-create-order',{body:{planId:plan.id}});
   if(error)throw error;
   if(!data?.redirectUrl)throw new Error('PhonePe did not return a checkout link.');
   window.location.assign(data.redirectUrl);
  }catch(e){setNotice({kind:'error',title:'Unable to start PhonePe checkout',message:e.message||'Please try again later.'});setBusyPlan('');}
 };

 return <section className="dash-panel dash-reveal subscription-panel">
  <div className="dash-panel-head"><div><span>ROOMORA PLANS</span><h3>Subscriptions</h3></div><Wallet size={18}/></div>
  <div className="subscription-balance"><div><span>Available tokens</span><strong>{tokenBalance}</strong></div><small>Tokens are used for publishing and other paid marketplace actions.</small></div>
  {notice&&<div className={`phonepe-notice ${notice.kind}`} role={notice.kind==='success'?'status':'alert'}>
   {notice.kind==='success'?<PartyPopper size={20}/>:notice.kind==='pending'?<LoaderCircle size={20}/>:<ShieldCheck size={20}/>}
   <div><strong>{notice.title}</strong><span>{notice.message}</span></div>
   {notice.kind==='pending'&&<button type="button" onClick={()=>verifyOrder(new URL(window.location.href).searchParams.get('phonepe_order'))} disabled={checking}><RefreshCw size={15}/> Check</button>}
  </div>}
  <div className="phonepe-offer"><div><span>MONTHLY LAUNCH OFFER</span><strong>50 + 5 bonus tokens</strong><small>One ₹10 payment · 55 tokens total</small></div><b>₹10<span>/ month</span></b></div>
  {active.length?<div className="subscription-plan-grid">{active.map(plan=>{
   const base=Number(plan.token_allowance||0),bonus=Number(plan.monthly_bonus_tokens||0);
   const isOffer=Number(plan.monthly_price)===10&&base===50;
   return <article className="subscription-plan-card" key={plan.id}>
    <span className="subscription-plan-badge">{plan.name}</span>
    <strong>₹{Number(plan.monthly_price||0).toLocaleString('en-IN')}<small>/ month</small></strong>
    <ul><li><Check size={14}/> {base.toLocaleString('en-IN')} subscription tokens / month</li>{bonus>0&&<li><PartyPopper size={14}/> +{bonus} bonus tokens</li>}<li><Check size={14}/> Marketplace access</li><li><Check size={14}/> Publish & manage items</li></ul>
    {isOffer&&<small className="phonepe-total">You'll receive 55 tokens in total 🎉</small>}
    <Button variant="primary" type="button" disabled={!!busyPlan||checking} onClick={()=>choosePlan(plan)}>{busyPlan===plan.id?<><LoaderCircle size={15}/> Opening PhonePe…</>:Number(plan.monthly_price)===0?'Choose free plan':<>Pay securely with PhonePe</>}</Button>
   </article>;
  })}</div>:<div className="dash-empty"><Wallet size={22}/><b>No subscription plans available</b><span>Plans will appear here when they are activated.</span></div>}
  <p className="phonepe-disclaimer"><ShieldCheck size={14}/> Payments are verified securely by RoomOra before tokens are credited. Gateway fees are handled by RoomOra and do not reduce your advertised tokens.</p>
 </section>;
}
