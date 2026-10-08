import React,{useEffect,useMemo,useState} from 'react';
import {MessageCircle,Send,RefreshCw} from 'lucide-react';
import {supabase} from './lib/supabase';
import Button from './components/ui/Button';

export default function ChatPanel({user}){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState(null),[draft,setDraft]=useState('');
 const load=async()=>{
  if(!user?.id)return;
  setLoading(true);setError('');
  const {data,error:e}=await supabase.from('marketplace_inquiries').select('*,marketplace_items(title,city,locality,price)').or(`publisher_id.eq.${user.id},requester_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(100);
  if(e){setError(e.message);setRows([])}else setRows(data||[]);
  setLoading(false);
 };
 useEffect(()=>{load()},[user?.id]);
 const items=useMemo(()=>rows.filter(r=>`${r.message||''} ${r.marketplace_items?.title||''} ${r.status||''}`.toLowerCase().includes(query.trim().toLowerCase())),[rows,query]);
 return <section className="dash-panel dash-reveal chat-panel">
  <div className="dash-panel-head"><div><span>ROOMORA CHAT</span><h3>Chats & inquiries</h3></div><Button variant="secondary" size="sm" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</Button></div>
  <div className="chat-layout">
   <aside className="chat-list">
    <div className="workspace-search"><MessageCircle size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search chats…"/></div>
    {loading?<div className="chat-empty">Loading chats…</div>:items.length?items.map(row=><button type="button" key={row.id} className={selected?.id===row.id?'chat-list-item active':'chat-list-item'} onClick={()=>{setSelected(row);setDraft('')}}><strong>{row.marketplace_items?.title||'Marketplace inquiry'}</strong><span>{row.message||'No message'}</span><small>{row.created_at?new Date(row.created_at).toLocaleDateString('en-IN'):''} · {row.status||'pending'}</small></button>):<div className="chat-empty"><MessageCircle size={22}/><b>No chats yet</b><span>When someone contacts you about a marketplace item, it will appear here.</span></div>}
   </aside>
   <div className="chat-thread">
    {selected?<><div className="chat-thread-head"><div><strong>{selected.marketplace_items?.title||'Marketplace inquiry'}</strong><span>{[selected.marketplace_items?.locality,selected.marketplace_items?.city].filter(Boolean).join(', ')}</span></div><span className="chat-status">{selected.status||'pending'}</span></div><div className="chat-messages"><div className="chat-bubble incoming"><small>Inquiry</small><p>{selected.message||'No message supplied.'}</p><time>{selected.created_at?new Date(selected.created_at).toLocaleString('en-IN'):''}</time></div></div><div className="chat-composer"><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Reply support will be added to threaded chat…" disabled/><button type="button" disabled aria-label="Send message"><Send size={16}/></button></div></>:<div className="chat-empty chat-empty-main"><MessageCircle size={30}/><b>Select a chat</b><span>Your marketplace conversations will open here.</span></div>}
   </div>
  </div>
  {error&&<div className="auth-message" role="alert">{error}</div>}
 </section>;
}