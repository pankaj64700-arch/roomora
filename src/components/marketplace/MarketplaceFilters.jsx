import React from 'react';
import {Filter} from 'lucide-react';
import {MARKETPLACE_CATEGORIES} from './marketplace';
export default function MarketplaceFilters({value='all',onChange,counts={},className=''}){return <div className={`market-filters ${className}`} aria-label="Marketplace categories"><Filter size={15}/><button className={value==='all'?'active':''} onClick={()=>onChange('all')}>All</button>{MARKETPLACE_CATEGORIES.map(([key,label])=><button key={key} className={value===key?'active':''} onClick={()=>onChange(key)}>{label}{value==='all'&&counts[key]!=null?` · ${counts[key]}`:''}</button>)}</div>}
