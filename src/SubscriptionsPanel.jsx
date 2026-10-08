import React from 'react';
import {Check,Wallet} from 'lucide-react';
import Button from './components/ui/Button';

export default function SubscriptionsPanel({plans=[],tokenBalance=0}){
 const active=plans.filter(p=>p.active);
 return <section className="dash-panel dash-reveal subscription-panel">
  <div className="dash-panel-head"><div><span>ROOMORA PLANS</span><h3>Subscriptions</h3></div><Wallet size={18}/></div>
  <div className="subscription-balance"><div><span>Available tokens</span><strong>{tokenBalance}</strong></div><small>Tokens are used for publishing and other paid marketplace actions.</small></div>
  {active.length?<div className="subscription-plan-grid">{active.map(plan=><article className="subscription-plan-card" key={plan.id}><span className="subscription-plan-badge">{plan.name}</span><strong>₹{Number(plan.monthly_price||0).toLocaleString('en-IN')}<small>/ month</small></strong><ul><li><Check size={14}/> {Number(plan.token_allowance||0).toLocaleString('en-IN')} tokens / month</li><li><Check size={14}/> Marketplace access</li><li><Check size={14}/> Publish & manage items</li></ul><Button variant="primary" type="button">Choose plan</Button></article>)}</div>:<div className="dash-empty"><Wallet size={22}/><b>No subscription plans available</b><span>Plans will appear here when they are activated.</span></div>}
 </section>;
}