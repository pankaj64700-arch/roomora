import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Menu, ShieldCheck, UserRound, LogOut, X, Eye, EyeOff } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { supabase } from './lib/supabase';
import Dashboard from './Dashboard';
import MarketplaceLanding from './MarketplaceLanding';
import './styles.css';
import './auth.css';
import './mobile-commerce.css';

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
  const [mode, setMode] = useState('signin'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [displayName, setDisplayName] = useState(''); const [role, setRole] = useState('tenant'); const [shopOwner, setShopOwner] = useState(false); const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { if (open) { setMessage(''); setBusy(false); } }, [open]);
  if (!open) return null;
  const submit = async (e) => { e.preventDefault(); setMessage(''); if (!supabase) { setMessage('Supabase is not configured yet.'); return; } setBusy(true); try { if (mode === 'signin') { const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error; try { await initializeProfile(data.user); } catch {} onSignedIn(data.user); onClose(); } else { const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName.trim(), roomora_role: role, shop_owner: role === 'shop' && shopOwner } } }); if (error) throw error; if (data.session) { await initializeProfile(data.user, role); onSignedIn(data.user); onClose(); } else { setMessage('Account created. Check your email to confirm your account, then sign in.'); setMode('signin'); } } } catch (error) { setMessage(error.message || 'Something went wrong. Please try again.'); } finally { setBusy(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="auth-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button><div className="eyebrow"><ShieldCheck size={14}/> ROOMORA ACCOUNT</div><h2>{mode === 'signin' ? 'Welcome back.' : 'Create your RoomOra account.'}</h2><p className="modal-copy">{mode === 'signin' ? 'Sign in to manage your rooms, listings and contact access.' : 'Choose your starting role.'}</p><form onSubmit={submit}>{mode === 'signup' && <label className="form-label">Your name<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" required/></label>}<label className="form-label">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required/></label><label className="form-label">Password<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required/><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>{mode === 'signup' && <><div className="form-label">I am joining as</div><div className="role-grid">{roleOptions.map(o => <button key={o.key} type="button" className={role === o.key ? 'role-option active' : 'role-option'} onClick={() => setRole(o.key)}><strong>{o.label}</strong><span>{o.note}</span></button>)}</div>{role === 'shop' && <label className="check-row"><input type="checkbox" checked={shopOwner} onChange={e => setShopOwner(e.target.checked)}/><span>My shop also has rooms for rent</span></label>}</>}{message && <div className="auth-message">{message}</div>}<button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></form><button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'New to RoomOra? Create an account' : 'Already have an account? Sign in'}</button></section></div>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false), [authOpen, setAuthOpen] = useState(false), [sessionUser, setSessionUser] = useState(null), [profile, setProfile] = useState(null);
  const heroRef = useRef(null);
  const loadProfile = async user => { if (!supabase || !user) { setProfile(null); return; } const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(); setProfile(data || null); };
  useEffect(() => { if (!supabase) return; let active = true; supabase.auth.getSession().then(async ({ data }) => { if (!active) return; const user = data.session?.user || null; setSessionUser(user); if (user) await loadProfile(user); }); const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => { const user = session?.user || null; setSessionUser(user); if (user) { try { await initializeProfile(user); } catch {} await loadProfile(user); } else setProfile(null); }); return () => { active = false; listener.subscription.unsubscribe(); }; }, []);
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; if (!heroRef.current) return; animate(heroRef.current.querySelectorAll('[data-animate]'), { opacity: [0, 1], translateY: [18, 0], delay: stagger(90), duration: 650, ease: 'out(3)' }); }, []);
  const openAuth = () => { setMenuOpen(false); setAuthOpen(true); }, signOut = async () => { if (supabase) await supabase.auth.signOut(); setSessionUser(null); setProfile(null); };
  if (sessionUser && profile) return <Dashboard user={sessionUser} profile={profile} onSignOut={signOut}/>;
  return <div className="app"><header className="topbar"><a className="brand" href="#top"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></a><nav className={menuOpen ? 'nav open' : 'nav'}><a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a><a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>{sessionUser ? <><span className="signed-user"><UserRound size={15}/>{profile?.display_name || sessionUser.email}</span><button className="nav-login" onClick={signOut}><LogOut size={15}/> Sign out</button></> : <><button className="nav-login" onClick={openAuth}>Sign in</button><button className="nav-cta" onClick={openAuth}>Get started</button></>}</nav><button className="menu-btn" aria-label="Toggle menu" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X/> : <Menu/>}</button></header>
    <main id="top"><section className="hero" ref={heroRef}><div className="hero-art" aria-hidden="true" data-animate><div className="art-card art-main"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85" alt=""/></div><div className="hero-art-shade"/></div><div className="hero-copy"><div className="eyebrow" data-animate><ShieldCheck size={15}/> Simple, local &amp; human</div><h1 data-animate>Find a room that<br/><em>feels like home.</em></h1><p data-animate>Find rooms, furniture, stationery and useful second-hand items in one place. Listing details stay private until you sign in.</p><button className="search-btn" data-animate onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}><ArrowRight size={18}/> Browse marketplace</button><div className="hero-notes" data-animate><span>✓ Image-first browsing</span><span>✓ Four clear categories</span><span>✓ Details after sign-in</span></div></div></section>
      <section className="trust-row"><span>Rooms</span><span>•</span><span>Furniture</span><span>•</span><span>Stationery</span><span>•</span><span>Other second-hand items</span></section><MarketplaceLanding onOpenAuth={openAuth}/><section className="feature-band" id="how"><div className="feature-icon"><ArrowRight/></div><div><div className="eyebrow">DESIGNED AROUND YOU</div><h2>See it first. Sign in for the details.</h2><p>RoomOra keeps the public landing page visual and simple. Authenticated users get the full listing information and their own workspace.</p></div><div className="feature-points"><span><b>01</b> Browse images</span><span><b>02</b> Choose a category</span><span><b>03</b> Sign in for details</span></div></section></main><footer><div className="brand"><span className="brand-mark">R</span><span>Room<span className="brand-accent">Ora</span></span></div><span>© 2026 RoomOra</span></footer><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={setSessionUser}/></div>;
}

createRoot(document.getElementById('root')).render(<App />);
