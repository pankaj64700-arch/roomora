import React from 'react';
import {ShoppingBag} from 'lucide-react';
import PublishItemPanel from './PublishItemPanel';
import MarketplaceFilters from './components/marketplace/MarketplaceFilters';
import {MARKETPLACE_CATEGORIES,normalizedCategory} from './components/marketplace/marketplace';
import MarketplaceCard from './components/marketplace/MarketplaceCard';
import EmptyState from './components/ui/EmptyState';
import useSavedItems from './hooks/useSavedItems';

export default function SavedItemsPanel({user,tokenBalance=0}){
 const{saved,loading,error,toggle}=useSavedItems(user?.id);
 const [category,setCategory]=React.useState('all');
 const counts=React.useMemo(()=>Object.fromEntries(MARKETPLACE_CATEGORIES.map(([cat])=>[cat,saved.filter(x=>normalizedCategory(x.category)===cat).length])),[saved]);
 const visible=saved.filter(x=>category==='all'||normalizedCategory(x.category)===category);
 if(loading)return <section className="dash-panel"><div className="dash-empty">Loading saved items…</div></section>;
 return <section className="dash-panel dash-reveal">
  <div className="dash-panel-actions">
   <PublishItemPanel user={user} tokenBalance={tokenBalance}/>
   <MarketplaceFilters value={category} onChange={setCategory} counts={counts}/>
  </div>
  {error&&<div className="auth-message">{error}</div>}
  {visible.length?<div className="saved-marketplace-grid">{visible.map(item=><MarketplaceCard key={item.id} item={item} saved onSave={()=>toggle(item.id)} onOpen={()=>{}} />)}</div>:<EmptyState icon={<ShoppingBag size={20}/>} title="No saved items yet" message="Save any marketplace item here."/>}
 </section>
}
