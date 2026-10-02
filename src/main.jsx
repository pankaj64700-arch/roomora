import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, MapPin, SlidersHorizontal, Heart, ArrowRight, ShieldCheck, Sofa, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { animate, stagger } from 'animejs';
import './styles.css';

const rooms = [
  { id: 1, title: 'Bright private room near campus', location: 'Aliganj, Lucknow', price: 8500, tags: ['Wi-Fi', 'Furnished', 'Power backup'], image: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80' },
  { id: 2, title: 'Quiet room with balcony', location: 'Gomti Nagar, Lucknow', price: 10500, tags: ['Balcony', 'Parking', 'Wi-Fi'], image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80' },
  { id: 3, title: 'Compact furnished room', location: 'Indira Nagar, Lucknow', price: 7200, tags: ['Furnished', 'Water', 'Kitchen'], image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80' }
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(15000);
  const heroRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    animate(heroRef.current?.querySelectorAll('[data-animate]'), { opacity: [0, 1], translateY: [18, 0], delay: stagger(90), duration: 650, ease: 'out(3)' });
    animate(cardsRef.current?.querySelectorAll('.room-card'), { opacity: [0, 1], translateY: [14, 0], delay: stagger(100), duration: 600, ease: 'out(3)' });
  }, []);

  const filtered = rooms.filter(r => r.price <= maxPrice && `${r.title} ${r.location} ${r.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}>
        <a href="#rooms" onClick={() => setMenuOpen(false)}>Find a room</a>
        <a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a>
        <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
        <button className="nav-login">Sign in</button>
        <button className="nav-cta">Get started</button>
      </nav>
      <button className="menu-btn" aria-label="Toggle menu" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    <main id="top">
      <section className="hero" ref={heroRef}>
        <div className="hero-copy">
          <div className="eyebrow" data-animate><ShieldCheck size={15}/> Simple, local &amp; human</div>
          <h1 data-animate>Find a room that<br/><em>feels like home.</em></h1>
          <p data-animate>Search rooms by location, price and facilities — then connect with the owner when you find the right fit.</p>
          <div className="search-panel" data-animate>
            <div className="search-field"><MapPin size={18}/><div><label>Location</label><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Area or landmark"/></div></div>
            <div className="search-divider"/>
            <div className="search-field price-field"><div><label>Max price</label><strong>₹{maxPrice.toLocaleString('en-IN')}</strong></div><input className="range" type="range" min="5000" max="20000" step="500" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}/></div>
            <button className="search-btn" onClick={() => document.getElementById('rooms')?.scrollIntoView({behavior:'smooth'})}><Search size={19}/> Search</button>
          </div>
          <div className="hero-notes" data-animate><span>✓ No endless forms</span><span>✓ Flexible listings</span><span>✓ Contact on your terms</span></div>
        </div>
        <div className="hero-art" data-animate>
          <div className="art-card art-main"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85" alt="Warm modern room"/><div className="art-caption"><div><b>Room with character</b><span>Gomti Nagar · ₹10,500/mo</span></div><Heart size={19}/></div></div>
          <div className="float-card"><span className="float-icon"><MapPin size={17}/></span><div><b>Good match</b><span>4 facilities you prefer</span></div></div>
        </div>
      </section>

      <section className="trust-row"><span>Made for everyday renting</span><span>•</span><span>Room listings</span><span>•</span><span>Second-hand essentials</span><span>•</span><span>New shop items</span></section>

      <section className="section" id="rooms">
        <div className="section-head"><div><div className="eyebrow">ROOMS NEAR YOU</div><h2>A few places to start.</h2></div><button className="filter-btn"><SlidersHorizontal size={17}/> Filters <ChevronDown size={15}/></button></div>
        <div className="room-grid" ref={cardsRef}>{filtered.map(room => <article className="room-card" key={room.id}><div className="room-image"><img src={room.image} alt=""/><button className="heart" aria-label="Save room"><Heart size={18}/></button></div><div className="room-body"><div className="room-location"><MapPin size={14}/>{room.location}</div><h3>{room.title}</h3><div className="room-tags">{room.tags.map(t => <span key={t}>{t}</span>)}</div><div className="room-foot"><strong>₹{room.price.toLocaleString('en-IN')}<small>/month</small></strong><button aria-label="Open room"><ArrowRight size={18}/></button></div></div></article>)}</div>
      </section>

      <section className="feature-band" id="how"><div className="feature-icon"><Search/></div><div><div className="eyebrow">DESIGNED AROUND YOU</div><h2>Less searching. More settling in.</h2><p>RoomOra keeps the essentials close: useful filters, clear listings, and a simple way to reach the person behind a room.</p></div><div className="feature-points"><span><b>01</b> Search your way</span><span><b>02</b> Compare clearly</span><span><b>03</b> Connect when ready</span></div></section>

      <section className="market" id="marketplace"><div><div className="eyebrow">ROOMORA MARKETPLACE</div><h2>Bring less. Find what you need.</h2><p>Tenants can pass on useful belongings when they move. Shops can offer new stationery and other approved essentials.</p><button className="outline-btn">Explore marketplace <ArrowRight size={17}/></button></div><div className="market-card"><ShoppingBag size={24}/><b>Second-hand &amp; new</b><span>Useful things, closer to home.</span></div><div className="market-card"><Sofa size={24}/><b>Room-ready essentials</b><span>Browse alongside your room search.</span></div></section>
    </main>

    <footer><div className="brand"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></div><span>© 2026 RoomOra</span></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
