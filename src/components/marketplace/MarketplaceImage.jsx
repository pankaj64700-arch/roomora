import React from 'react';
import {getMarketplaceImage} from './marketplace';
export default function MarketplaceImage({item,category,className='',alt='',...props}){const fallback=getMarketplaceImage({},category||item?.category);return <img className={className} src={getMarketplaceImage(item,category)} alt={alt||item?.title||'Marketplace item'} onError={e=>{if(e.currentTarget.src!==fallback)e.currentTarget.src=fallback}} loading="lazy" {...props}/>}
