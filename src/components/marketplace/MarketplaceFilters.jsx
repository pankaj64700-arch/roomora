import React from 'react';
import {Filter,ChevronDown} from 'lucide-react';
import {MARKETPLACE_CATEGORIES} from './marketplace';
export default function MarketplaceFilters({value='all',onChange,counts={},className=''}){
 const label=value==='all'?'All':MARKETPLACE_CATEGORIES.find(([key])=>key===value)?.[1]||'Filter';
 return <label className={`market-filters ${className}`} aria-label="Marketplace category filter"><Filter size={15} aria-hidden="true"/><select value={value} onChange={e=>onChange(e.target.value)} aria-label="Filter marketplace by category">{[['all','All'],...MARKETPLACE_CATEGORIES].map(([key,text])=><option key={key} value={key}>{text}{key==='all'&&counts[key]!=null?` · ${counts[key]}`:''}</option>)}</select><span className="market-filter-label">{label}</span><ChevronDown size={15} aria-hidden="true"/></label>;
}
