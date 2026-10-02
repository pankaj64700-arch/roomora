import React, { useEffect, useMemo, useState } from 'react';
import { animate, stagger } from 'animejs';
import { Activity, ArrowUpRight, Bell, Box, Building2, ChevronRight, Coins, Home, LayoutDashboard, LogOut, Menu, Package, Plus, Search, ShieldCheck, ShoppingBag, Users, Wallet, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import './dashboard.css';

const navByRole = {
  admin: [
    ['overview', 'Overview', LayoutDashboard], ['users', 'Users', Users], ['rooms', 'Rooms', Home], ['marketplace', 'Marketplace', ShoppingBag], ['subscriptions', 'Subscriptions', Wallet], ['tokens', 'Tokens', Coins]
  ],
  owner: [['overview', 'Overview', LayoutDashboard], ['rooms', 'My rooms', Home], ['inquiries', 'Inquiries', Bell]],
  shop: [['overview', 'Overview', LayoutDashboard], ['products', 'Products', Package], ['rooms', 'Rooms', Home], ['orders', 'Orders', Box]],
  tenant: [['overview', 'Overview', LayoutDashboard], ['saved', 'Saved rooms', Home], ['marketplace', 'Marketplace', ShoppingBag], ['contacts', 'Contacts', Bell]]
};

function Stat({ icon: Icon, label, value, hint }) {
  return <article className="dash-stat"><div className="dash-stat-icon"><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>;
}

function EmptyState({ icon: Icon, title, text, action }) {
  return <div className="dash-empty"><div className="dash-empty-icon"><Icon size={20}/></div><b>{title}</b><span>{text}</span>{action && <button className="dash-primary"><Plus size={16}/>{action}</button>}</div>;
}

export default function Dashboard({ user, profile, onSignOut }) {
  const isAdmin = profile?.is_admin === true || user?.email?.toLowerCase() === 'roomora1910@gmail.com';
  const role = isAdmin ? 'admin' : profile?.is_shop ? 'shop' : profile?.is_owner ? 'owner' : 'tenant';
  const [active, setActive] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase || !user) return;
      setLoading(true);
      const [roomResult, planResult, tokenResult] = await Promise.all([
        supabase.from('rooms').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('subscription_plans').select('*').eq('active', true).order('monthly_price'),
        supabase.rpc('get_my_token_balance')
      ]);
      if (!cancelled) {
        setRooms(roomResult.data || []);
        setPlans(planResult.data || []);
        setTokenBalance(Number(tokenResult.data || 0));
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const el = document.querySelectorAll('.dash-reveal');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animate(el, { opacity: [0, 1], translateY: [10, 0], delay: stagger(55), duration: 420, ease: 'out(3)' });
  }, [active, loading]);

  const mine = useMemo(() => rooms.filter(r => r.owner_id === user?.id), [rooms, user?.id]);
  const published = rooms.filter(r => r.status === 'published').length;
  const title = role === 'admin' ? 'Platform control center' : role === 'owner' ? 'Your rental workspace' : role === 'shop' ? 'Your shop workspace' : 'Your tenant workspace';
  const subtitle = role === 'admin' ? 'Monitor RoomOra from one place.' : role === 'owner' ? 'Keep rooms, inquiries and availability organized.' : role === 'shop' ? 'Manage products and optional room listings.' : 'Find rooms and manage your marketplace activity.';

  const nav = navByRole[role];
  return <div className="dashboard-shell">
    <aside className={mobileOpen ? 'dash-sidebar open' : 'dash-sidebar'}>
      <div className="dash-brand"><span className="brand-mark">R</span><span>Room<span>Ora</span></span><button className="dash-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="dash-profile"><div className="dash-avatar">{(profile?.display_name || user?.email || 'R').slice(0, 1).toUpperCase()}</div><div><b>{profile?.display_name || 'RoomOra user'}</b><span>{role === 'admin' ? 'Administrator' : role}</span></div></div>
      <nav className="dash-nav">{nav.map(([key, label, Icon]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => { setActive(key); setMobileOpen(false); }}><Icon size={17}/><span>{label}</span><ChevronRight size={14}/></button>)}</nav>
      <button className="dash-signout" onClick={onSignOut}><LogOut size={17}/> Sign out</button>
    </aside>
    {mobileOpen && <button className="dash-overlay" aria-label="Close menu" onClick={() => setMobileOpen(false)}/>} 
    <main className="dash-main">
      <header className="dash-top"><button className="dash-menu" onClick={() => setMobileOpen(true)}><Menu size={20}/></button><div><span className="dash-kicker">ROOMORA {role.toUpperCase()}</span><h1>{title}</h1></div><div className="dash-top-actions"><button className="dash-icon-btn" aria-label="Notifications"><Bell size={18}/></button><div className="dash-top-user">{profile?.display_name || user?.email}</div></div></header>
      <section className="dash-content">
        <div className="dash-hero dash-reveal"><div><h2>{subtitle}</h2><p>{role === 'admin' ? 'Accounts, rooms, marketplace, subscriptions and token activity are grouped here.' : 'Everything important stays compact and comfortable on mobile.'}</p></div>{role === 'owner' && <button className="dash-primary"><Plus size={17}/> Add room</button>}{role === 'shop' && <button className="dash-primary"><Plus size={17}/> Add product</button>}</div>
        <div className="dash-stats">
          <Stat icon={Home} label={role === 'admin' ? 'Published rooms' : 'Available rooms'} value={published} hint="Live on RoomOra" />
          <Stat icon={Users} label="Account" value={role === 'admin' ? 'Admin' : role[0].toUpperCase() + role.slice(1)} hint={user?.email || ''} />
          <Stat icon={Coins} label="Token balance" value={tokenBalance} hint="Available to spend" />
          <Stat icon={Wallet} label="Plans" value={plans.length} hint="Active subscription plans" />
        </div>

        {active === 'overview' && <div className="dash-grid dash-reveal"><section className="dash-panel"><div className="dash-panel-head"><div><span>RECENT ACTIVITY</span><h3>{role === 'admin' ? 'Platform snapshot' : 'Your latest rooms'}</h3></div><Activity size={18}/></div>{role === 'admin' ? <div className="admin-grid"><div><strong>{rooms.length}</strong><span>Recent room records</span></div><div><strong>{plans.length}</strong><span>Active plans</span></div><div><strong>{tokenBalance}</strong><span>Your token balance</span></div></div> : mine.length ? mine.slice(0, 5).map(room => <div className="dash-row" key={room.id}><div className="row-icon"><Home size={16}/></div><div><b>{room.title}</b><span>{room.locality}, {room.city}</span></div><strong>₹{Number(room.monthly_price).toLocaleString('en-IN')}</strong></div>) : <EmptyState icon={Home} title="Nothing here yet" text={role === 'owner' ? 'Publish your first room.' : 'Your activity will appear here.'} action={role === 'owner' ? 'Add room' : null}/>}</section><section className="dash-panel"><div className="dash-panel-head"><div><span>QUICK ACCESS</span><h3>Go to a workspace</h3></div><ArrowUpRight size={18}/></div><div className="quick-links">{nav.slice(1).map(([key, label, Icon]) => <button key={key} onClick={() => setActive(key)}><Icon size={18}/><div><b>{label}</b><span>Open workspace</span></div><ChevronRight size={16}/></button>)}</div></section></div>}

        {active === 'rooms' && <section className="dash-panel dash-reveal"><div className="dash-panel-head"><div><span>ROOMS</span><h3>{role === 'admin' ? 'All room listings' : 'Your room listings'}</h3></div><Search size={18}/></div>{rooms.length ? rooms.filter(r => role === 'admin' || r.owner_id === user?.id).map(room => <div className="dash-row" key={room.id}><div className="row-icon"><Building2 size={16}/></div><div><b>{room.title}</b><span>{room.locality}, {room.city} · {room.status}</span></div><strong>₹{Number(room.monthly_price).toLocaleString('en-IN')}</strong></div>) : <EmptyState icon={Home} title="No rooms yet" text="Room listings will appear here." action={role === 'owner' ? 'Add room' : null}/>}</section>}

        {active !== 'overview' && active !== 'rooms' && <section className="dash-panel dash-reveal"><div className="dash-panel-head"><div><span>{active.toUpperCase()}</span><h3>{active === 'users' ? 'User management' : active === 'marketplace' ? 'Marketplace management' : active === 'products' ? 'Product management' : active === 'subscriptions' ? 'Subscriptions & plans' : active === 'tokens' ? 'Token management' : active.replace('-', ' ')}</h3></div><ShieldCheck size={18}/></div>{active === 'subscriptions' && plans.map(plan => <div className="dash-row" key={plan.id}><div className="row-icon"><Wallet size={16}/></div><div><b>{plan.name}</b><span>{plan.token_allowance} tokens / month</span></div><strong>₹{Number(plan.monthly_price).toLocaleString('en-IN')}</strong></div>)}{active !== 'subscriptions' && <EmptyState icon={active === 'products' || active === 'marketplace' ? ShoppingBag : active === 'users' ? Users : Coins} title="Workspace ready" text="The dashboard shell is live. The next data controls will plug into this section without changing the mobile layout." action={role === 'admin' ? 'Review data' : null}/>}</section>}
      </section>
    </main>
  </div>;
}
