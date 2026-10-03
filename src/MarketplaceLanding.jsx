import React, { useEffect, useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { supabase } from './lib/supabase';
import { animate, stagger } from 'animejs';
import './marketplace.css';

const rows = [
  ['room', 'Rooms', 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=85'],
  ['furniture', 'Furniture', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85'],
  ['stationery', 'Stationery', 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85'],
  ['second_hand', 'Other second-hand items', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85']
];

export default function MarketplaceLanding({ onOpenAuth }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('marketplace_items')
        .select('id,category,image_url,status,published_at,expires_at')
        .eq('status', 'published')
        .gt('expires_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(80);
      if (mounted) setItems(data || []);
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animate('.market-landing-row', { opacity: [0, 1], translateY: [14, 0], delay: stagger(70), duration: 500, ease: 'out(3)' });
  }, [items.length]);

  const rowItems = category => items.filter(item => category === 'second_hand'
    ? ['second_hand', 'other'].includes(item.category)
    : item.category === category);

  return (
    <section className="market-landing" id="marketplace">
      <div className="market-landing-head">
        <div>
          <div className="eyebrow"><ShoppingBag size={14} /> ROOMORA MARKETPLACE</div>
          <h2>Browse by category.</h2>
          <p>Images first. Listing details become available after sign in.</p>
        </div>
        <button className="outline-btn" onClick={onOpenAuth}>Sign in to view details <ArrowRight size={16} /></button>
      </div>

      <div className="market-landing-rows">
        {rows.map(([category, label, fallback]) => {
          const list = rowItems(category);
          const cards = list.length ? list : [
            { id: `${category}-placeholder-1`, image_url: fallback },
            { id: `${category}-placeholder-2`, image_url: fallback }
          ];
          return (
            <div className="market-landing-row" key={category}>
              <div className="market-row-title">
                <h3>{label}</h3>
                <button onClick={onOpenAuth}>View details <ArrowRight size={14} /></button>
              </div>
              <div className="market-horizontal" aria-label={`${label} marketplace items`}>
                {cards.map((item, index) => (
                  <button className="market-image-card" key={item.id || index} onClick={onOpenAuth} aria-label={`Sign in to view ${label} details`}>
                    <img src={item.image_url || fallback} alt="" loading="lazy" onError={e => { e.currentTarget.src = fallback; }} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
