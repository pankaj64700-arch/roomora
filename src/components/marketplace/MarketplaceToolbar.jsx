import React from 'react';
import {MapPin} from 'lucide-react';
import SearchInput from '../ui/SearchInput';
import MarketplaceFilters from './MarketplaceFilters';

export default function MarketplaceToolbar({query,onQueryChange,category,onCategoryChange,counts={}}){
 return <div className="market-tools">
  <div className="market-search"><SearchInput value={query} onChange={onQueryChange} placeholder="Search items, area or city…" /></div>
  <div className="market-location-hint" aria-label="Location search hint"><MapPin size={15}/><span>Search by area or city</span></div>
  <MarketplaceFilters value={category} onChange={onCategoryChange} counts={counts}/>
 </div>;
}
