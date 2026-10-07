import React,{useState} from 'react';
import {Search,MapPin,X} from 'lucide-react';
import SearchInput from '../ui/SearchInput';
import MarketplaceFilters from './MarketplaceFilters';
export default function MarketplaceToolbar({query,onQueryChange,category,onCategoryChange,counts={}}) {
 const [searchOpen,setSearchOpen]=useState(Boolean(query));
 return <div className="market-tools">
  <div className={'market-search '+(searchOpen?'is-open':'')}>
   {searchOpen?<><SearchInput value={query} onChange={onQueryChange} placeholder="Search items, area or city…"/>{query&&<button type="button" className="market-search-close" onClick={()=>{onQueryChange('');setSearchOpen(false)}} aria-label="Close search"><X size={15}/></button></>:<button type="button" className="market-tool-icon" onClick={()=>setSearchOpen(true)} aria-label="Search marketplace"><Search size={18}/></button>}
  </div>
  <div className="market-location-hint" aria-label="Location search hint"><MapPin size={15}/><span>Search by area or city</span></div>
  <MarketplaceFilters value={category} onChange={onCategoryChange} counts={counts}/>
 </div>;
}