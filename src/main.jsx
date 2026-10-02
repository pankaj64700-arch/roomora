import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, MapPin, SlidersHorizontal, Heart, ArrowRight, ShieldCheck, Sofa, ShoppingBag, Menu, X, ChevronDown, UserRound, LogOut, Eye, EyeOff, Plus, Home, Package, MessageCircle, CheckCircle2 } from 'lucide-react';
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

async function initializeProfile(user, roleOverride) {
  if (!supabase || !user) return null;
  const meta = user.user_metadata || {};
  const role = roleOverride || meta.roomora_role;
  if (!role) return null;
  const { data, error } = await supabase.rpc('set_initial_profile', {
    requested_tenant: role === 'tenant',
    requested_owner: role === 'owner' || (role === 'shop' && Boolean(meta.shop_owner)),
    requested_shop: role === 'shop'
  });
  if (error) throw error;
  return data;
}

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

  useEffect(() => { if (open) { setMessage(''); setBusy(false); } }, [open]);
  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault(); setMessage('');
    if (!supabase) { setMessage('Supabase is not configured yet. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'); return; }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        try { await initializeProfile(data.user); } catch (profileError) { if (!/profile could not be initialized/i.test(profileError.message || '')) throw profileError; }
        onSignedIn(data.user); onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: displayName.trim(), roomora_role: role, shop_owner: role === 'shop' && shopOwner } }
        });
        if (error) throw error;
        if (data.session) {
          await initializeProfile(data.user, role);
          onSignedIn(data.user); onClose();
        } else { setMessage('Account created. Check your email to confirm your account, then sign in.'); setMode('signin'); }
      }
    } catch (error) { setMessage(error.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button>
      <div className="eyebrow"><ShieldCheck size={14}/> ROOMORA ACCOUNT</div>
      <h2 id="auth-title">{mode === 'signin' ? 'Welcome back.' : 'Create your RoomOra account.'}</h2>
      <p className="modal-copy">{mode === 'signin' ? 'Sign in to manage your rooms, listings and contact access.' : 'Choose your starting role. RoomOra keeps role rules enforced at the database level.'}</p>
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

function OwnerWorkspace({ user, profile, onChanged }) {
  const canManageRooms = profile?.is_owner || profile?.is_shop;
  const [roomsOwned, setRoomsOwned] = useState([]);
  const [title, setTitle] = useState(''); const [city, setCity] = useState(''); const [locality, setLocality] = useState('');
  const [address, setAddress] = useState(''); const [price, setPrice] = useState(''); const [facilities, setFacilities] = useState('Wi-Fi, Water');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [marketplace, setMarketplace] = useState([]);

  const load = async () => {
    if (!supabase || !user) return;
    const [{ data: roomData }, { data: marketData }] = await Promise.all([
      supabase.from('rooms').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('marketplace_listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
    ]);
    setRoomsOwned(roomData || []); setMarketplace(marketData || []);
  };
  useEffect(() => { load(); }, [user?.id]);

  if (!canManageRooms && !profile?.is_tenant) return null;
  const createRoom = async (e) => {
    e.preventDefault(); setBusy(true); setMessage('');
    const payload = { owner_id: user.id, title: title.trim(), address: address.trim(), locality: locality.trim(), city: city.trim(), monthly_price: Number(price), facilities: facilities.split(',').map(v => v.trim()).filter(Boolean), status: 'published' };
    const { error } = await supabase.from('rooms').insert(payload);
    if (error) setMessage(error.message); else { setMessage('Room published successfully.'); setTitle(''); setPrice(''); await load(); onChanged?.(); }
    setBusy(false);
  };

  return <section className="workspace section" id="workspace">
    <div className="section-head"><div><div className="eyebrow">YOUR ROOMORA SPACE</div><h2>Manage your listings.</h2></div><div className="workspace-role"><UserRound size={15}/>{profile?.is_shop ? 'Shop + rooms' : profile?.is_owner ? 'Owner' : 'Tenant'}</div></div>
    <div className="workspace-grid">
      {canManageRooms && <form className="workspace-card" onSubmit={createRoom}><div className="workspace-card-head"><span className="workspace-icon"><Home size={18}/></span><div><b>Publish a room</b><span>Rooms go live immediately.</span></div></div><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Listing title" required/><div className="two-inputs"><input value={locality} onChange={e => setLocality(e.target.value)} placeholder="Locality" required/><input value={city} onChange={e => setCity(e.target.value)} placeholder="City" required/></div><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" required/><div className="two-inputs"><input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="Monthly price ₹" required/><input value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="Facilities, comma separated"/></div>{message && <div className="workspace-message"><CheckCircle2 size={15}/>{message}</div>}<button className="auth-submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish room'} <Plus size={17}/></button></form>}
      {profile?.is_tenant && <div className="workspace-card marketplace-seller"><div className="workspace-card-head"><span className="workspace-icon"><Package size={18}/></span><div><b>Sell your used belongings</b><span>You're a tenant, not a Shop.</span></div></div><p>When you move, you can list useful second-hand items for other RoomOra users. We'll add the item form next.</p><button className="outline-btn" disabled><Plus size={17}/> Add second-hand item</button></div>}
      {canManageRooms && <div className="workspace-card listing-summary"><div className="workspace-card-head"><span className="workspace-icon"><Home size={18}/></span><div><b>Your rooms</b><span>{roomsOwned.length} published or saved</span></div></div>{roomsOwned.length ? roomsOwned.slice(0, 4).map(room => <div className="mini-listing" key={room.id}><div><b>{room.title}</b><span>{room.locality}, {room.city} · ₹{Number(room.monthly_price).toLocaleString('en-IN')}</span></div><span className="status-pill">{room.status}</span></div>) : <div className="empty-mini">No rooms yet. Publish your first one above.</div>}</div>}
      {profile?.is_shop && <div className="workspace-card listing-summary"><div className="workspace-card-head"><span className="workspace-icon"><ShoppingBag size={18}/></span><div><b>Shop products</b><span>{marketplace.length} listings</span></div></div><div className="empty-mini">New-product listing tools are next in the marketplace milestone.</div></div>}
    </div>
  </section>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false); const [authOpen, setAuthOpen] = useState(false); const [sessionUser, setSessionUser] = useState(null); const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState(''); const [maxPrice, setMaxPrice] = useState(15000); const heroRef = useRef(null); const cardsRef = useRef(null);
  const [liveRooms, setLiveRooms] = useState([]); const [roomsLoading, setRoomsLoading] = useState(false);

  const loadProfile = async (user) => { if (!supabase || !user) { setProfile(null); return; } const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(); setProfile(data || null); };
  const loadRooms = async () => { if (!supabase) return; setRoomsLoading(true); const { data } = await supabase.from('rooms').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(12); setLiveRooms(data || []); setRoomsLoading(false); };

  useEffect(() => { if (!supabase) return undefined; supabase.auth.getSession().then(async ({ data }) => { const user = data.session?.user ?? null; setSessionUser(user); if (user) await loadProfile(user); }); const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => { const user = nextSession?.user ?? null; setSessionUser(user); if (user) { try { await initializeProfile(user); } catch {} await loadProfile(user); } else setProfile(null); }); loadRooms(); return () => listener.subscription.unsubscribe(); }, []);

  useEffect(() => { const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduceMotion) return; animate(heroRef.current?.querySelectorAll('[data-animate]'), { opacity: [0, 1], translateY: [18, 0], delay: stagger(90), duration: 650, ease: 'out(3)' }); animate(cardsRef.current?.querySelectorAll('.room-card'), { opacity: [0, 1], translateY: [14, 0], delay: stagger(100), duration: 600, ease: 'out(3)' }); }, [liveRooms.length]);

  const openAuth = () => { setMenuOpen(false); setAuthOpen(true); };
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setSessionUser(null); setProfile(null); };
  const sourceRooms = liveRooms.length ? liveRooms.map(r => ({ id: r.id, title: r.title, location: `${r.locality}, ${r.city}`, price: r.monthly_price, tags: r.facilities || [], image: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=80' })) : rooms;
  const filtered = sourceRooms.filter(r => r.price <= maxPrice && `${r.title} ${r.location} ${r.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="app">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></a><nav className={menuOpen ? 'nav open' : 'nav'}><a href="#rooms" onClick={() => setMenuOpen(false)}>Find a room</a><a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a><a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>{sessionUser ? <><span className="signed-user"><UserRound size={15}/>{profile?.display_name || sessionUser.email}</span><button className="nav-login" onClick={signOut}><LogOut size={15}/> Sign out</button></> : <><button className="nav-login" onClick={openAuth}>Sign in</button><button className="nav-cta" onClick={openAuth}>Get started</button></>}</nav><button className="menu-btn" aria-label="Toggle menu" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X/> : <Menu/>}</button></header>
    <main id="top">
      <section className="hero" ref={heroRef}><div className="hero-copy"><div className="eyebrow" data-animate><ShieldCheck size={15}/> Simple, local &amp; human</div><h1 data-animate>Find a room that<br/><em>feels like home.</em></h1><p data-animate>Search rooms by location, price and facilities — then connect with the owner when you find the right fit.</p><div className="search-panel" data-animate><div className="search-field"><MapPin size={18}/><div><label>Location</label><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Area or landmark"/></div></div><div className="search-divider"/><div className="search-field price-field"><div><label>Max price</label><strong>₹{maxPrice.toLocaleString('en-IN')}</strong></div><input className="range" type="range" min="5000" max="20000" step="500" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}/></div><button className="search-btn" onClick={() => document.getElementById('rooms')?.scrollIntoView({behavior:'smooth'})}><Search size={19}/> Search</button></div><div className="hero-notes" data-animate><span>✓ No endless forms</span><span>✓ Flexible listings</span><span>✓ Contact on your terms</span></div></div><div className="hero-art" data-animate><div className="art-card art-main"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85" alt="Warm modern room"/><div className="art-caption"><div><b>Room with character</b><span>Gomti Nagar · ₹10,500/mo</span></div><Heart size={19}/></div></div><div className="float-card"><span className="float-icon"><MapPin size={17}/></span><div><b>Good match</b><span>4 facilities you prefer</span></div></div></div></section>
      <section className="trust-row"><span>Made for everyday renting</span><span>•</span><span>Room listings</span><span>•</span><span>Second-hand essentials</span><span>•</span><span>New shop items</span></section>
      <section className="section" id="rooms"><div className="section-head"><div><div className="eyebrow">ROOMS NEAR YOU</div><h2>{liveRooms.length ? 'Live RoomOra listings.' : 'A few places to start.'}</h2></div><button className="filter-btn"><SlidersHorizontal size={17}/> Filters <ChevronDown size={15}/></button></div>{roomsLoading ? <div className="empty-state">Loading live rooms…</div> : filtered.length ? <div className="room-grid" ref={cardsRef}>{filtered.map(room => <article className="room-card" key={room.id}><div className="room-image"><img src={room.image} alt=""/><button className="heart" aria-label="Save room"><Heart size={18}/></button></div><div className="room-body"><div className="room-location"><MapPin size={14}/>{room.location}</div><h3>{room.title}</h3><div className="room-tags">{room.tags.map(t => <span key={t}>{t}</span>)}</div><div className="room-foot"><strong>₹{Number(room.price).toLocaleString('en-IN')}<small>/month</small></strong><button aria-label="Open room"><ArrowRight size={18}/></button></div></div></article>)}</div> : <div className="empty-state">No rooms match those filters yet.</div>}</section>
      {sessionUser && <OwnerWorkspace user={sessionUser} profile={profile} onChanged={loadRooms}/>} 
      <section className="feature-band" id="how"><div className="feature-icon"><Search/></div><div><div className="eyebrow">DESIGNED AROUND YOU</div><h2>Less searching. More settling in.</h2><p>RoomOra keeps the essentials close: useful filters, clear listings, and a simple way to reach the person behind a room.</p></div><div className="feature-points"><span><b>01</b> Search your way</span><span><b>02</b> Compare clearly</span><span><b>03</b> Connect when ready</span></div></section>
      <section className="market" id="marketplace"><div><div className="eyebrow">ROOMORA MARKETPLACE</div><h2>Bring less. Find what you need.</h2><p>Tenants can pass on useful belongings when they move. Shops can offer new stationery and other approved essentials.</p><button className="outline-btn" onClick={openAuth}>Join RoomOra <ArrowRight size={17}/></button></div><div className="market-card"><ShoppingBag size={24}/><b>Second-hand &amp; new</b><span>Useful things, closer to home.</span></div><div className="market-card"><Sofa size={24}/><b>Room-ready essentials</b><span>Browse alongside your room search.</span></div></section>
    </main><footer><div className="brand"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></div><span>© 2026 RoomOra</span></footer><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={setSessionUser}/>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);