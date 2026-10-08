import React,{useEffect,useMemo,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import PublishItemPanel from './PublishItemPanel';
import {supabase} from './lib/supabase';
import MarketplaceCard from './components/marketplace/MarketplaceCard';
import MarketplaceEditForm from './components/marketplace/MarketplaceEditForm';
import MarketplaceToolbar from './components/marketplace/MarketplaceToolbar';
import {MARKETPLACE_CATEGORIES,matchesMarketplaceSearch,normalizedCategory} from './components/marketplace/marketplace';
import Modal from './components/ui/Modal';
import EmptyState from './components/ui/EmptyState';
import Button from './components/ui/Button';

export default function MyListingsPanel({user,tokenBalance,onCreated}){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[edit,setEdit]=useState(null),[deleteTarget,setDeleteTarget]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[category,setCategory]=useState('all');
 const load=async()=>{setLoading(true);const {data,error}=await supabase.from('marketplace_items').select('*').eq('user_id',user.id).order('created_at',{ascending:false});if(error)setNotice(error.message);setItems(data||[]);setLoading(false)};
 useEffect(()=>{if(user?.id)load()},[user?.id]);
 const counts=useMemo(()=>Object.fromEntries(MARKETPLACE_CATEGORIES.map(([cat])=>[cat,items.filter(x=>normalizedCategory(x.category)===cat&&matchesMarketplaceSearch(x,query)).length])),[items,query]);
 const visibleItems=useMemo(()=>items.filter(item=>(category==='all'||normalizedCategory(item.category)===category)&&matchesMarketplaceSearch(item,query)),[items,category,query]);
 const save=async()=>{if(!edit)return;setBusy(true);setNotice('');const {data,error}=await supabase.from('marketplace_items').update({category:edit.category,title:edit.title.trim(),description:(edit.description||'').trim(),price:Number(edit.price)||0,locality:(edit.locality||'').trim(),city:(edit.city||'').trim()}).eq('id',edit.id).eq('user_id',user.id).select().single();setBusy(false);if(error){setNotice(error.message);return}setEdit(null);setItems(v=>v.map(x=>x.id===data.id?data:x));setNotice('Listing updated.');};
 const remove=async()=>{if(!deleteTarget)return;setBusy(true);setNotice('');const {error}=await supabase.from('marketplace_items').delete().eq('id',deleteTarget.id).eq('user_id',user.id);setBusy(false);if(error){setNotice(error.message);return}setItems(v=>v.filter(x=>x.id!==deleteTarget.id));setDeleteTarget(null);setNotice('Listing deleted.');};
 return <section className="dash-panel dash-reveal">
  <div className="dash-panel-head"><div><span>MY MARKETPLACE</span><h3>My published items</h3></div><PublishItemPanel user={user} tokenBalance={tokenBalance} onCreated={onCreated||load}/></div>
  <p className="panel-subcopy">Publish new items and manage everything you have already published from this single workspace.</p>
  <MarketplaceToolbar query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} counts={counts}/>
  {notice&&<div className="auth-message" role="status">{notice}</div>}
  {loading?<div className="dash-empty">Loading your listings…</div>:visibleItems.length?<div className="marketplace-owner-grid">{visibleItems.map(item=><MarketplaceCard key={item.id} item={item} owner onEdit={setEdit} onDelete={setDeleteTarget}/>)}</div>:<EmptyState title={items.length?'No matching listings':'No published items yet'} message={items.length?'Try another item, area, city or category.':'Publish your first room, furniture or second-hand item.'} action={!items.length&&<Button variant="primary" onClick={onPublish}><Plus size={16}/> Publish item</Button>}/>} 
  <Modal open={!!edit} onClose={()=>!busy&&setEdit(null)} title="Update your item" className="marketplace-edit-modal">{edit&&<MarketplaceEditForm value={edit} onChange={setEdit} onSubmit={save} onCancel={()=>setEdit(null)} busy={busy}/>}</Modal>
  <Modal open={!!deleteTarget} onClose={()=>!busy&&setDeleteTarget(null)} title="Delete listing" className="marketplace-delete-modal">{deleteTarget&&<><p>Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.</p><div className="dash-action-row"><Button variant="danger" onClick={remove} disabled={busy}>{busy?'Deleting…':<><Trash2 size={16}/> Delete listing</>}</Button><Button variant="secondary" onClick={()=>setDeleteTarget(null)} disabled={busy}>Cancel</Button></div></>}</Modal>
 </section>;
}
