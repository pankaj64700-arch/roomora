import React from 'react';
import {Bookmark,ShoppingBag} from 'lucide-react';
import MarketplaceCard from './components/marketplace/MarketplaceCard';
import EmptyState from './components/ui/EmptyState';
import useSavedItems from './hooks/useSavedItems';

export default function SavedItemsPanel({user}){
 const{saved,loading,error,toggle}=useSavedItems(user?.id);
 if(loading)return <section className="dash-panel"><div className="dash-empty">Loading saved items…</div></section>;
 return <section className="dash-panel dash-reveal">
  <div className="dash-panel-head"><div><span>YOUR SAVED MARKETPLACE</span><h3>Saved items</h3></div><Bookmark size={18}/></div>
  {error&&<div className="auth-message">{error}</div>}
  {saved.length?<div className="saved-marketplace-grid">{saved.map(item=><MarketplaceCard key={item.id} item={item} saved onSave={()=>toggle(item.id)} onOpen={()=>{}} />)}</div>:<EmptyState icon={<ShoppingBag size={20}/>} title="No saved items yet" message="Save any marketplace item here."/>}
 </section>
}
