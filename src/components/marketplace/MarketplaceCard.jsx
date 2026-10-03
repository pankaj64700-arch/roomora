import React from 'react';
import {Bookmark,MapPin,Clock} from 'lucide-react';
import MarketplaceImage from './MarketplaceImage';
import {categoryLabel,formatMarketplacePrice} from './marketplace';

export default function MarketplaceCard({item,onOpen,onSave,saved=false,owner=false,onEdit,onDelete}){
 return <article className="market-detail-card ui-interactive">
  <button className="market-detail-image" onClick={()=>onOpen?.(item)} aria-label={`View ${item.title}`}><MarketplaceImage item={item} alt={item.title}/></button>
  <div className="market-detail-body">
   <span className="market-detail-category">{categoryLabel(item.category)}{owner?' · Your listing':''}</span>
   <h4>{item.title}</h4><p>{item.description}</p><strong>{formatMarketplacePrice(item.price)}</strong>
   <small><MapPin size={12}/> {item.locality}, {item.city}</small>
   <footer><span><Clock size={12}/> {item.expires_at?`Until ${new Date(item.expires_at).toLocaleDateString()}`:'Active'}</span>
    <div className="market-card-actions">
     {!owner&&<button className={saved?'market-save saved':'market-save'} onClick={()=>onSave?.(item)}><Bookmark size={15}/> {saved?'Saved':'Save'}</button>}
     {owner&&<><button className="market-save" onClick={()=>onEdit?.(item)}>Edit</button><button className="market-save" onClick={()=>onDelete?.(item)}>Delete</button></>}
    </div>
   </footer>
  </div>
 </article>
}
