import React,{useEffect,useMemo,useState} from 'react';
import {ArrowRight,Search,ShoppingBag,MapPin} from 'lucide-react';
import {animate,stagger} from 'animejs';
import MarketplaceImage from './components/marketplace/MarketplaceImage';
import MarketplaceFilters from './components/marketplace/MarketplaceFilters';
import {MARKETPLACE_CATEGORIES,groupMarketplaceItems,formatMarketplacePrice} from './components/marketplace/marketplace';
import useMarketplaceItems from './hooks/useMarketplaceItems';
import './marketplace.css';

export default function MarketplaceLanding({onOpenAuth}){
 const{items}=useMarketplaceItems(null); const[filter,setFilter]=useState('all'); const[query,setQuery]=useState('');
 const grouped=useMemo(()=>groupMarketplaceItems(items,filter),[items,filter]);
 const counts=useMemo(()=>Object.fromEntries(MARKETPLACE_CATEGORIES.map(([c])=>[c,groupMarketplaceItems(items,c)[c].length])),[items]);
 const visible=MARKETPLACE_CATEGORIES.filter(([c])=>grouped[c]?.length>0);
 const normalized=query.trim().toLowerCase();
 const matches=item=>!normalized||[item.title,item.description,item.city,item.locality,item.area,item.location].filter(Boolean).join(' ').toLowerCase().includes(normalized);
 useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;animate('.market-landing-row',{opacity:[0,1],translateY:[12,0],delay:stagger(55),duration:420,ease:'out(3)'})},[items.length,filter]);
 return <section className="market-landing" id="marketplace">
  <div className="market-hero">
   <div className="market-hero-copy"><span className="market-hero-kicker">ROOMORA MARKETPLACE</span><h1>Find something useful.</h1><p>Browse nearby products and services — simple, compact and clear.</p>
    <div className="market-search-wrap"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, services, or area" aria-label="Search products, services, or area"/><button onClick={()=>document.getElementById('marketplace-listings')?.scrollIntoView({behavior:'smooth',block:'start'})}>Search</button></div>
    <div className="market-location-note"><MapPin size={12}/> Search by city, locality or area</div>
   </div>
  </div>
  <div className="market-landing-content">
   <div className="market-section-head"><div><span className="eyebrow"><ShoppingBag size={13}/> FRESH LISTINGS</span><h2>Browse marketplace</h2></div><button className="market-view-all" onClick={onOpenAuth}>View all <ArrowRight size={14}/></button></div>
   <MarketplaceFilters value={filter} onChange={setFilter} counts={counts} className="landing-filters"/>
   {visible.length?<div className="market-landing-rows" id="marketplace-listings">{visible.map(([category,label])=>{const list=grouped[category].filter(matches);return list.length?<div className="market-landing-row" key={category}><div className="market-row-title"><h3>{label}</h3><span className="market-row-count">{list.length} available</span></div><div className="market-horizontal" role="region" aria-label={`${label} listings`}>{list.map(item=><button className="market-image-card" key={item.id} onClick={onOpenAuth} aria-label={`Sign in to view ${item.title}`}><div className="market-image-card-media"><MarketplaceImage item={item} category={category}/></div><div className="market-image-card-info"><strong>{item.title}</strong><span>{formatMarketplacePrice(item.price)}</span></div></button>)}</div></div>:null})}</div>:<div className="landing-no-results"><ShoppingBag size={20}/><b>No marketplace items available right now.</b><span>Try another category.</span></div>}
  </div>
 </section>
}
