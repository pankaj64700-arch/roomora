import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,Check,CheckCheck,MessageCircle,RefreshCw,Search,Send} from 'lucide-react';
import {supabase} from './lib/supabase';
import Button from './components/ui/Button';

const initials=name=>(name||'R').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const formatTime=value=>value?new Date(value).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'';
const formatDate=value=>value?new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'';

export default function ChatPanel({user}){
 const [conversations,setConversations]=useState([]),[messages,setMessages]=useState([]),[profiles,setProfiles]=useState({}),[items,setItems]=useState({});
 const [loading,setLoading]=useState(true),[threadLoading,setThreadLoading]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState('');
 const [selectedId,setSelectedId]=useState(null),[draft,setDraft]=useState(''),[sending,setSending]=useState(false),[mobileThread,setMobileThread]=useState(false);
 const threadEndRef=useRef(null);

 const load=useCallback(async()=>{
  if(!user?.id)return;
  setLoading(true);setError('');
  const {data,error:e}=await supabase.from('marketplace_conversations').select('id,item_id,buyer_id,seller_id,created_at,updated_at,last_message_at').order('last_message_at',{ascending:false}).limit(100);
  if(e){setError(e.message);setConversations([]);setLoading(false);return}
  const rows=data||[]; setConversations(rows);
  const ids=[...new Set(rows.flatMap(r=>[r.buyer_id,r.seller_id]).filter(Boolean))];
  const itemIds=[...new Set(rows.map(r=>r.item_id).filter(Boolean))];
  const [{data:p,error:pe},{data:i,error:ie}]=await Promise.all([
   ids.length?supabase.from('profiles').select('id,display_name,phone,contact_email,contact_phone').in('id',ids):Promise.resolve({data:[],error:null}),
   itemIds.length?supabase.from('marketplace_items').select('id,title,city,locality,price,image_url,image_urls').in('id',itemIds):Promise.resolve({data:[],error:null})
  ]);
  if(pe||ie)setError((pe||ie)?.message||'Unable to load chat details.');
  setProfiles(Object.fromEntries((p||[]).map(x=>[x.id,x])));
  setItems(Object.fromEntries((i||[]).map(x=>[x.id,x])));
  setLoading(false);
 },[user?.id]);

 const loadMessages=useCallback(async conversationId=>{
  if(!conversationId)return;
  setThreadLoading(true);setError('');
  const {data,error:e}=await supabase.from('marketplace_messages').select('id,conversation_id,sender_id,body,created_at,read_at').eq('conversation_id',conversationId).order('created_at',{ascending:true});
  if(e){setError(e.message);setMessages([])}else setMessages(data||[]);
  setThreadLoading(false);
  await supabase.rpc('mark_marketplace_conversation_read',{p_conversation_id:conversationId});
 },[]);

 useEffect(()=>{load()},[load]);
 useEffect(()=>{
  if(!selectedId)return;
  loadMessages(selectedId);setDraft('');setMobileThread(true);
  const channel=supabase.channel('roomora-chat-'+selectedId).on('postgres_changes',{event:'INSERT',schema:'public',table:'marketplace_messages',filter:'conversation_id=eq.'+selectedId},payload=>{
   setMessages(current=>current.some(m=>m.id===payload.new.id)?current:[...current,payload.new]);
   if(payload.new.sender_id!==user?.id)supabase.rpc('mark_marketplace_conversation_read',{p_conversation_id:selectedId});
   setConversations(current=>current.map(c=>c.id===selectedId?{...c,last_message_at:payload.new.created_at,updated_at:payload.new.created_at}:c));
  }).subscribe();
  return()=>{supabase.removeChannel(channel)};
 },[selectedId,loadMessages,user?.id]);
 useEffect(()=>{threadEndRef.current?.scrollIntoView({behavior:'smooth',block:'end'})},[messages.length,selectedId]);

 const selected=conversations.find(c=>c.id===selectedId)||null;
 const visible=useMemo(()=>{
  const term=query.trim().toLowerCase();
  return conversations.filter(c=>{
   if(!term)return true;
   const otherId=c.buyer_id===user?.id?c.seller_id:c.buyer_id;
   const person=profiles[otherId]?.display_name||'',item=items[c.item_id]?.title||'';
   return (person+' '+item).toLowerCase().includes(term);
  });
 },[conversations,profiles,items,query,user?.id]);
 const otherId=selected?(selected.buyer_id===user?.id?selected.seller_id:selected.buyer_id):null;
 const other=otherId?profiles[otherId]:null;
 const selectedItem=selected?items[selected.item_id]:null;

 const send=async e=>{
  e?.preventDefault();const body=draft.trim();
  if(!body||!selectedId||sending)return;
  setSending(true);setError('');
  const {error:e2}=await supabase.rpc('send_marketplace_message',{p_conversation_id:selectedId,p_message:body});
  setSending(false);if(e2){setError(e2.message);return}
  setDraft('');await loadMessages(selectedId);await load();
 };

 return <section className="dash-panel dash-reveal chat-panel">
  <div className="dash-panel-head chat-panel-head"><div><span>ROOMORA CHAT</span><h3>Messages</h3></div><Button variant="secondary" size="sm" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</Button></div>
  <div className={'chat-layout '+(mobileThread?'show-thread':'')}>
   <aside className="chat-list">
    <div className="chat-list-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search people or items…"/></div>
    {loading?<div className="chat-empty">Loading conversations…</div>:visible.length?visible.map(row=>{
      const personId=row.buyer_id===user?.id?row.seller_id:row.buyer_id,person=profiles[personId],item=items[row.item_id];
      return <button type="button" key={row.id} className={'chat-list-item '+(selectedId===row.id?'active':'')} onClick={()=>{setSelectedId(row.id);setMobileThread(true)}}>
       <span className="chat-avatar">{initials(person?.display_name)}</span><span className="chat-list-copy"><strong>{person?.display_name||'RoomOra user'}</strong><small>{item?.title||'Marketplace item'}</small></span><time>{formatDate(row.last_message_at)}</time>
      </button>;
    }):<div className="chat-empty"><MessageCircle size={22}/><b>No chats yet</b><span>Start a conversation from a marketplace listing.</span></div>}
   </aside>
   <div className="chat-thread">
    {selected?<><div className="chat-thread-head"><button type="button" className="chat-back-mobile" onClick={()=>setMobileThread(false)} aria-label="Back to chats"><ArrowLeft size={18}/></button><span className="chat-avatar">{initials(other?.display_name)}</span><div className="chat-thread-person"><strong>{other?.display_name||'RoomOra user'}</strong><span>{selectedItem?.title||'Marketplace item'}{selectedItem?.locality?' · '+selectedItem.locality:''}</span></div><span className="chat-status">Chat</span></div>
      <div className="chat-item-strip">{selectedItem?.title||'Marketplace item'}{selectedItem?.price!=null?' · ₹'+Number(selectedItem.price).toLocaleString('en-IN'):''}</div>
      <div className="chat-messages">
       {threadLoading?<div className="chat-empty"><span>Loading messages…</span></div>:messages.length?messages.map(message=>{
        const mine=message.sender_id===user?.id;
        return <div key={message.id} className={'chat-message-row '+(mine?'mine':'theirs')}><div className={'chat-bubble '+(mine?'outgoing':'incoming')}><p>{message.body}</p><span className="chat-meta">{formatTime(message.created_at)} {mine&&(message.read_at?<CheckCheck size={13}/>:<Check size={13}/>)}</span></div></div>;
       }):<div className="chat-empty"><MessageCircle size={24}/><b>Start chatting</b><span>Send a message to {other?.display_name||'this user'}.</span></div>}
       <div ref={threadEndRef}/>
      </div>
      <form className="chat-composer" onSubmit={send}><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000} placeholder="Type a message…" disabled={sending}/><button type="submit" disabled={!draft.trim()||sending} aria-label="Send message"><Send size={17}/></button></form>
    </>:<div className="chat-empty chat-empty-main"><MessageCircle size={30}/><b>Select a chat</b><span>Your conversations show the person, listing and full message history.</span></div>}
   </div>
  </div>
  {error&&<div className="auth-message" role="alert">{error}</div>}
 </section>;
}
