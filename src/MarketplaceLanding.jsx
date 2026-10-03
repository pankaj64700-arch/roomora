import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { supabase } from './lib/supabase';
import { animate, stagger } from 'animejs';
import './marketplace.css';

const rows = [
  ['room', 'Rooms'],
  ['furniture', 'Furniture'],
  ['stationery', 'Stationery'],
  ['second_hand', 'Other second-hand items']
];

const fallback = {
  room: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=85',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85',
  stationery: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85',
  second_hand: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85'
};

const imageFor = (item, category) => item.image_url || item.image_urls?.[0] || fallback[category];

export default function MarketplaceLanding({ onOpenAuth }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('id,category,image_url,image_urls,status,published_at,expires_at')
        .eq('status', 'published')
        .gt('expires_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(80);
      if (mounted && !error) setItems(data || []);
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animate('.market-landing-row', { opacity: [0, 1], translateY: [14, 0], delay: stagger(70), duration: 500, ease: 'out(3)' });
  }, [items.length, filter]);

  const grouped = useMemo(() => {
    const map = {};
    rows.forEach(([category]) => {
      map[category] = items.filter(item => category === 'second_hand'
        ? ['second_hand', 'other'].includes(item.category)
        : item.category === category);
    });
    return map;
  }, [items]);

  const visibleRows = rows.filter(([category]) => filter === 'all' ? grouped[category]?.length : filter === category);
  const selectedItems = filter === 'all' ? null : grouped[filter] || [];

  return (
    <section className="market-landing" id="marketplace">
      <div className="market-landing-head">
        <div>
          <div className="eyebrow"><ShoppingBag size={14} /> ROOMORA MARKETPLACE</div>
          <h2>Browse by category.</h2>
          <p>Fresh published listings appear here automatically. Sign in for full details.</p>
        </div>
        <button className="outline-btn" onClick={onOpenAuth}>Sign in to view details <ArrowRight size={16} /></button>
      </div>

      <div className="landing-filters" aria-label="Marketplace category filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        {rows.map(([category, label]) => (
          <button key={category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{label}</button>
        ))}
      </div>

      {filter !== 'all' && selectedItems.length === 0 ? (
        <div className="landing-no-results"><ShoppingBag size={20}/><b>No {rows.find(x => x[0] === filter)?.[1].toLowerCase()} available right now.</b><span>Try another category.</span></div>
      ) : (
        <div className="market-landing-rows">
          {visibleRows.map(([category, label]) => {
            const list = grouped[category] || [];
            return (
              <div className="market-landing-row" key={category}>
                <div className="market-row-title">
                  <h3>{label}</h3>
                  <span className="market-row-count">{list.length} available</span>
                </div>
                <div className="market-horizontal" aria-label={`${label} marketplace items`}>
                  {list.map(item => (
                    <button className="market-image-card" key={item.id} onClick={onOpenAuth} aria-label={`Sign in to view ${label} details`}>
                      <img src={imageFor(item, category)} alt="" loading="lazy" onError={e => { e.currentTarget.src = fallback[category]; }} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
