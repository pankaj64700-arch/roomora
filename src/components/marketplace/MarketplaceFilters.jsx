import React,{useEffect,useRef,useState} from 'react';
import {Filter,ChevronDown} from 'lucide-react';
import {MARKETPLACE_CATEGORIES} from './marketplace';
export default function MarketplaceFilters({value='all',onChange,counts={},className=''}) {
 const [open,setOpen]=useState(false); const ref=useRef(null);
 const label=value==='all'?'All':MARKETPLACE_CATEGORIES.find(([key])=>key===value)?.[1]||'Filter';
 useEffect(()=>{const close=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 const options=[['all','All'],...MARKETPLACE_CATEGORIES];
 return <div ref={ref} className={'market-filters '+className}>
  <button type="button" className="market-filter-trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="listbox"><Filter size={15}/><span>{label}</span><ChevronDown size={15}/></button>
  {open&&<div className="market-filter-menu" role="listbox" aria-label="Marketplace categories">{options.map(([key,text])=><button type="button" role="option" aria-selected={value===key} className={value===key?'active':''} key={key} onClick={()=>{onChange(key);setOpen(false)}}>{text}{counts[key]!=null?' · '+counts[key]:''}</button>)}</div>}
 </div>;
}