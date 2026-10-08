import React from 'react';
import {Bookmark,MapPin,Pencil,Trash2} from 'lucide-react';
import MarketplaceImage from './MarketplaceImage';
import {formatMarketplacePrice,categoryLabel} from './marketplace';

export default function MarketplaceCard({item,onOpen,onSave,saved=false,owner=false,onEdit,onDelete}) {
 const open=()=>onOpen?.(item);
 return <article className="market-image-card ui-interactive">
  <button type="button" className="market-card-open" onClick={open} aria-label={`View details for ${item.title}`}>
   <div className="market-image-card-media">
    <MarketplaceImage item={item} alt={item.title}/>
    <span className="market-card-category">{categoryLabel(item.category)}</span>
   </div>
   <div className="market-image-card-info">
    <strong>{item.title}</strong>
    <span>{formatMarketplacePrice(item.price)}</span>
    {(item.locality||item.city)&&<small><MapPin size={11}/>{[item.locality,item.city].filter(Boolean).join(', ')}</small>}
   </div>
  </button>
  {(onSave||owner)&&<div className="market-card-actions">
   {onSave&&<button type="button" className={`market-save ${saved?'saved':''}`} onClick={()=>onSave(item.id)}><Bookmark size={13}/>{saved?'Saved':'Save'}</button>}
   {owner&&onEdit&&<button type="button" className="market-save" onClick={()=>onEdit(item)}><Pencil size={13}/>Edit</button>}
   {owner&&onDelete&&<button type="button" className="market-save danger" onClick={()=>onDelete(item)}><Trash2 size={13}/>Delete</button>}
  </div>}
 </article>;
}