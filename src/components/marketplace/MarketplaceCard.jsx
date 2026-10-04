import React from 'react';
import MarketplaceImage from './MarketplaceImage';
import {formatMarketplacePrice} from './marketplace';

export default function MarketplaceCard({item,onOpen}){
 const open=()=>onOpen?.(item);
 const onKeyDown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}};
 return <article className="market-detail-card market-product-card ui-interactive" role="button" tabIndex={0} onClick={open} onKeyDown={onKeyDown} aria-label={`View details for ${item.title}`}>
  <div className="market-detail-image"><MarketplaceImage item={item} alt={item.title}/></div>
  <div className="market-product-preview">
   <h4>{item.title}</h4>
   <strong>{formatMarketplacePrice(item.price)}</strong>
  </div>
 </article>;
}
