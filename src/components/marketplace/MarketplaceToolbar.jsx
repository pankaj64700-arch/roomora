import React from 'react';
import { Filter, Search, MapPin } from 'lucide-react';

export default function MarketplaceToolbar({ query, onQueryChange, category, onCategoryChange, categories }) {
  return (
    <div className="market-tools">
      <div className="market-search">
        <Search size={16} />
        <input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Search items, rooms, furniture…" aria-label="Search marketplace" />
      </div>
      <div className="market-location-hint" aria-label="Location search hint">
        <MapPin size={15} />
        <span>Search by area or city</span>
      </div>
      <div className="market-filters" aria-label="Marketplace categories">
        <Filter size={15} />
        <button className={category === 'all' ? 'active' : ''} onClick={() => onCategoryChange('all')}>All</button>
        {categories.map(([value, label]) => <button key={value} className={category === value ? 'active' : ''} onClick={() => onCategoryChange(value)}>{label}</button>)}
      </div>
    </div>
  );
}
