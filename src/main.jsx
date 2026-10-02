import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, MapPin, SlidersHorizontal, Heart, ArrowRight, ShieldCheck, Sofa, ShoppingBag, Menu, X, ChevronDown, UserRound, LogOut, Eye, EyeOff } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { supabase } from './lib/supabase';
import './styles.css';
import './auth.css';

const rooms = [
  { id: 1, title: 'Bright private room near campus', location: 'Aliganj, Lucknow', price: 8500, tags: ['Wi-Fi', 'Furnished', 'Power backup'], image: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80' },
  { id: 2, title: 'Quiet room with balcony', location: 'Gomti Nagar, Lucknow', price: 10500, tags: ['Balcony', 'Parking', 'Wi-Fi'], image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80' },
  { id: 3, title: 'Compact furnished room', location: 'Indira Nagar, Lucknow', price: 7200, tags: ['Furnished', 'Water', 'Kitchen'], image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80' }
];

const roleOptions = [
  { key: 'tenant', label: 'Tenant', note: 'Find rooms and sell used belongings when moving.' },
  { key: 'owner', label: 'Owner', note: 'List rooms for rent.' },
  { key: 'shop', label: 'Shop', note: 'Sell new products; shops can also list rooms.' }
];

function AuthModal({ open, onClose, onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('tenant');
  const [shopOwner, setShopOwner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setMessage('');
    setBusy(false);
  }, [open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Supabase is not configured yet. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onSignedIn(data.user);
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName.trim() } } });
        if (error) throw error;
        if (data.session) {
          const { error: profileError } = await supabase.rpc('set_initial_profile', {
            requested_tenant: role === 'tenant',
            requested_owner: role === 'owner' || (role === 'shop' && shopOwner),
            requested_shop: role === 'shop'
          });
          if (profileError) throw profileError;
          onSignedIn(data.user);
          onClose();
        } else {
          setMessage('Account created. Check your email to confirm your account, then sign in.');
          setMode('signin');
        }
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button>
      <div className="eyebrow"><ShieldCheck size={14}/> ROOMORA ACCOUNT</div>
      <h2 id="auth-title">{mode === 'signin' ? 'Welcome back.' : 'Create your RoomOra account.'}</h2>
      <p className="modal-copy">{mode === 'signin' ? 'Sign in to manage your rooms, listings and contact access.' : 'Choose your starting role. You can update your profile later where permitted.'}</p>
      <form onSubmit={submit}>
        {mode === 'signup' && <label className="form-label">Your name<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" required/></label>}
        <label className="form-label">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></label>
        <label className="form-label">Password<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {mode === 'signup' && <>
          <div className="form-label">I am joining as</div>
          <div className="role-grid">{roleOptions.map(option => <button key={option.key} type="button" className={role === option.key ? 'role-option active' : 'role-option'} onClick={() => setRole(option.key)}><strong>{option.label}</strong><span>{option.note}</span></button>)}</div>
          {role === 'shop' && <label className="check-row"><input type="checkbox" checked={shopOwner} onChange={e => setShopOwner(e.target.checked)}/><span>My shop also has rooms for rent</span></label>}
        </>}
        {message && <div className="auth-message" role="alert">{message}</div>}
        <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'New to RoomOra? Create an account' : 'Already have an account? Sign in'}</button>
    </section>
  </div>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(15000);
  const heroRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSessionUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSessionUser(nextSession?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    animate(heroRef.current?.querySelectorAll('[data-animate]'), { opacity: [0, 1], translateY: [18, 0], delay: stagger(90), duration: 650, ease: 'out(3)' });
    animate(cardsRef.current?.querySelectorAll('.room-card'), { opacity: [0, 1], translateY: [14, 0], delay: stagger(100), duration: 600, ease: 'out(3)' });
  }, []);

  const filtered = rooms.filter(r => r.price <= maxPrice && `${r.title} ${r.location} ${r.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const openAuth = () => { setMenuOpen(false); setAuthOpen(true); };
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); };

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}>
        <a href="#rooms" onClick={() => setMenuOpen(false)}>Find a room</a>
        <a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a>
        <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
        {sessionUser ? <><span className="signed-user"><UserRound size={15}/>{sessionUser.email}</span><button className="nav-login" onClick={signOut}><LogOut size={15}/> Sign out</button></> : <><button className="nav-login" onClick={openAuth}>Sign in</button><button className="nav-cta" onClick={openAuth}>Get started</button></>}
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
        {filtered.length ? <div className="room-grid" ref={cardsRef}>{filtered.map(room => <article className="room-card" key={room.id}><div className="room-image"><img src={room.image} alt=""/><button className="heart" aria-label="Save room"><Heart size={18}/></button></div><div className="room-body"><div className="room-location"><MapPin size={14}/>{room.location}</div><h3>{room.title}</h3><div className="room-tags">{room.tags.map(t => <span key={t}>{t}</span>)}</div><div className="room-foot"><strong>₹{room.price.toLocaleString('en-IN')}<small>/month</small></strong><button aria-label="Open room"><ArrowRight size={18}/></button></div></div></article>)}</div> : <div className="empty-state">No demo rooms match those filters. Try a higher price or another location.</div>}
      </section>

      <section className="feature-band" id="how"><div className="feature-icon"><Search/></div><div><div className="eyebrow">DESIGNED AROUND YOU</div><h2>Less searching. More settling in.</h2><p>RoomOra keeps the essentials close: useful filters, clear listings, and a simple way to reach the person behind a room.</p></div><div className="feature-points"><span><b>01</b> Search your way</span><span><b>02</b> Compare clearly</span><span><b>03</b> Connect when ready</span></div></section>

      <section className="market" id="marketplace"><div><div className="eyebrow">ROOMORA MARKETPLACE</div><h2>Bring less. Find what you need.</h2><p>Tenants can pass on useful belongings when they move. Shops can offer new stationery and other approved essentials.</p><button className="outline-btn" onClick={openAuth}>Join RoomOra <ArrowRight size={17}/></button></div><div className="market-card"><ShoppingBag size={24}/><b>Second-hand &amp; new</b><span>Useful things, closer to home.</span></div><div className="market-card"><Sofa size={24}/><b>Room-ready essentials</b><span>Browse alongside your room search.</span></div></section>
    </main>

    <footer><div className="brand"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></div><span>© 2026 RoomOra</span></footer>
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={setSessionUser}/>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
