import React, { useEffect, useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { supabase } from './lib/supabase';
import './marketplace.css';

const rows = [
  ['room', 'Rooms', 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=85'],
  ['furniture', 'Furniture', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85'],
  ['stationery', 'Stationery', 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85'],
  ['second_hand', 'Other second-hand items', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85']
];

export default function MarketplacePanel() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      setLoading(true);
      const { data } = await supabase.from('marketplace_items').select('*').eq('status', 'published').gt('expires_at', new Date().toISOString()).order('published_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const matches = item => `${item.title || ''} ${item.description || ''} ${item.locality || ''} ${item.city || ''}`.toLowerCase().includes(q.toLowerCase());
  const imageFor = (item, fallback) => item.image_url || item.image || fallback;

  return <section className="marketplace-panel">
    <div className="market-head"><div><span className="dash-kicker">ROOMORA MARKETPLACE</span><h2>Browse by category.</h2><p>Listing details are visible here after sign-in.</p></div><ShoppingBag size={22}/></div>
    <div className="market-tools"><div className="market-search"><Search size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your marketplace"/></div></div>
    {loading ? <div className="dash-empty">Loading marketplace…</div> : <div className="market-landing-rows">
      {rows.map(([category, label, fallback]) => {
        const list = items.filter(item => (category === 'second_hand' ? ['second_hand', 'other'].includes(item.category) : item.category === category)).filter(matches);
        return <div className="market-landing-row" key={category} style={{ opacity: 1 }}>
          <div className="market-row-title"><h3>{label}</h3><span className="market-row-count">{list.length} available</span></div>
          {list.length ? <div className="market-horizontal">
            {list.map(item => <article className="market-detail-card" key={item.id}>
              <div className="market-detail-image"><img src={imageFor(item, fallback)} alt="" loading="lazy"/></div>
              <div className="market-detail-body"><span className="market-detail-category">{label}</span><h4>{item.title}</h4><p>{item.description}</p><strong>₹{Number(item.price || 0).toLocaleString('en-IN')}</strong><small>{item.locality}, {item.city}</small><footer>Available until {new Date(item.expires_at).toLocaleDateString()}</footer></div>
            </article>)}
          </div> : <div className="dash-empty"><div className="dash-empty-icon"><ShoppingBag size={20}/></div><b>No {label.toLowerCase()} available</b><span>Published items will appear here until they expire.</span></div>}
        </div>;
      })}
    </div>}
  </section>;
}
