import React,{useEffect,useState} from 'react';
import {Bookmark,MapPin,Trash2,ShoppingBag} from 'lucide-react';
import {supabase} from './lib/supabase';
export default function SavedItemsPanel({user}){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{(async()=>{setLoading(true);const {data,error}=await supabase.from('marketplace_favorites').select('item_id,marketplace_items(*)').eq('user_id',user.id);if(error)setError(error.message);setItems((data||[]).map(x=>x.marketplace_items).filter(Boolean));setLoading(false)})()},[user?.id]);
 const remove=async id=>{const {error}=await supabase.from('marketplace_favorites').delete().eq('user_id',user.id).eq('item_id',id);if(error)setError(error.message);else setItems(v=>v.filter(x=>x.id!==id))};
 if(loading)return <section className="dash-panel"><div className="dash-empty">Loading saved items…</div></section>;
 return <section className="dash-panel dash-reveal"><div className="dash-panel-head"><div><span>YOUR SAVED MARKETPLACE</span><h3>Saved items</h3></div><Bookmark size={18}/></div>{error&&<div className="auth-message">{error}</div>}{items.length?<div className="my-listings-grid">{items.map(item=><article className="my-listing-card" key={item.id}><img src={item.image_url} alt={item.title}/><div className="my-listing-body"><span className="listing-status published">{item.category}</span><h4>{item.title}</h4><p>{item.description}</p><strong>₹{Number(item.price||0).toLocaleString('en-IN')}</strong><small><MapPin size={12}/> {item.locality}, {item.city}</small><div className="my-listing-actions"><button className="outline-btn danger-btn" onClick={()=>remove(item.id)}><Trash2 size={14}/> Remove saved</button></div></div></article>)}</div>:<div className="dash-empty"><div className="dash-empty-icon"><ShoppingBag size={20}/></div><b>No saved items yet</b><span>Save any marketplace item here.</span></div>}</section>;
}
