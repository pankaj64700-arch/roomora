import React from 'react';
import MarketplaceCard from './MarketplaceCard';
import {categoryLabel} from './marketplace';

export default function MarketplaceRows({rows,grouped,user,saved,onSelect,onSave}) {
 return <div className="market-landing-rows">
  {rows.map(([cat])=>{
   const list=grouped[cat]||[];
   if(!list.length)return null;
   return <div className="market-landing-row" key={cat}>
    <div className="market-row-title"><h3>{categoryLabel(cat)}</h3><span className="market-row-count">{list.length} available</span></div>
    <div className="market-horizontal">{list.map(item=><MarketplaceCard key={item.id} item={item} saved={saved.includes(item.id)} onOpen={onSelect} onSave={()=>onSave(item.id)}/>)}</div>
   </div>;
  })}
 </div>;
}