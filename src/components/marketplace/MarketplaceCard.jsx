import React from 'react';
import {Bookmark,MapPin,Clock} from 'lucide-react';
import MarketplaceImage from './MarketplaceImage';
import {categoryLabel,formatMarketplacePrice} from './marketplace';
import {Button} from '../ui/Button';

export default function MarketplaceCard({item,onOpen,onSave,saved=false,owner=false,onEdit,onDelete}){
 const stop=e=>e.stopPropagation();
 return <article className="market-detail-card ui-interactive" onClick={()=>onOpen?.(item)} tabIndex="0" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen?.(item)}}}>
  <button className="market-detail-image" onClick={e=>{stop(e);onOpen?.(item)}} aria-label={`View details for ${item.title}`}><MarketplaceImage item={item} alt={item.title}/></button>
  <div className="market-detail-body">
   <span className="market-detail-category">{categoryLabel(item.category)}{owner?' · Your listing':''}</span>
   <h4>{item.title}</h4><p>{item.description}</p><strong>{formatMarketplacePrice(item.price)}</strong>
   <small><MapPin size={11}/> {item.locality}, {item.city}</small>
   <footer><span><Clock size={11}/> {item.expires_at?`Until ${new Date(item.expires_at).toLocaleDateString()}`:'Active'}</span>
    <div className="market-card-actions">
     {!owner&&<Button type="button" size="sm" variant={saved?'primary':'secondary'} onClick={e=>{stop(e);onSave?.(item)}}><Bookmark size={13}/> {saved?'Saved':'Save'}</Button>}
     {owner&&<><Button type="button" size="sm" variant="secondary" onClick={e=>{stop(e);onEdit?.(item)}}>Edit</Button><Button type="button" size="sm" variant="danger" onClick={e=>{stop(e);onDelete?.(item)}}>Delete</Button></>}
    </div>
   </footer>
  </div>
 </article>
}
