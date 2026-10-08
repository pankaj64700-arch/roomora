import React,{useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight,Image as ImageIcon} from 'lucide-react';
import MarketplaceImage from './MarketplaceImage';
import {getMarketplaceImage} from './marketplace';

export default function MarketplaceGallery({item,className=''}) {
  const images=useMemo(()=>{
    const values=Array.isArray(item?.image_urls)?item.image_urls:[];
    const all=[item?.image_url,...values].filter(Boolean);
    return [...new Set(all)];
  },[item]);
  const [index,setIndex]=useState(0);
  const list=images.length?images:[getMarketplaceImage(item)];
  const current=Math.min(index,list.length-1);
  const previous=()=>setIndex(v=>(v-1+list.length)%list.length);
  const next=()=>setIndex(v=>(v+1)%list.length);
  return <div className={`market-gallery ${className}`.trim()}>
    <div className="market-gallery-main">
      <MarketplaceImage item={{...item,image_url:list[current]}} category={item?.category} alt={item?.title||'Marketplace item'} loading="eager"/>
      {list.length>1&&<>
        <button type="button" className="market-gallery-nav prev" onClick={previous} aria-label="Previous image"><ChevronLeft size={18}/></button>
        <button type="button" className="market-gallery-nav next" onClick={next} aria-label="Next image"><ChevronRight size={18}/></button>
        <span className="market-gallery-count">{current+1} / {list.length}</span>
      </>}
    </div>
    {list.length>1&&<div className="market-gallery-thumbs" aria-label="Item images">
      {list.map((src,i)=><button type="button" key={src+i} className={`market-gallery-thumb ${i===current?'active':''}`} onClick={()=>setIndex(i)} aria-label={`View image ${i+1}`}>
        <img src={src} alt="" loading="lazy"/>
      </button>)}
    </div>}
    {!images.length&&<span className="market-gallery-fallback"><ImageIcon size={14}/> Image preview</span>}
  </div>;
}
