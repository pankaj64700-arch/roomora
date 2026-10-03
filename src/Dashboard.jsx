import React, { useEffect, useMemo, useState } from 'react';
import { animate, stagger } from 'animejs';
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, Box, Building2, ChevronRight,
  Coins, Home, LayoutDashboard, LogOut, Menu, Package, Plus, Search,
  ShieldCheck, ShoppingBag, Users, Wallet, X
} from 'lucide-react';
import { supabase } from './lib/supabase';
import AddRoomPanel from './AddRoomPanel';
import PublishItemPanel from './PublishItemPanel';
import MarketplacePanel from './MarketplacePanel';
import SubscriptionManager from './SubscriptionManager';
import './dashboard.css';

const navByRole = {
  admin: [
    ['overview', 'Overview', LayoutDashboard],
    ['users', 'Users', Users],
    ['rooms', 'Rooms', Home],
    ['marketplace', 'Marketplace', ShoppingBag],
    ['subscriptions', 'Subscriptions', Wallet],
    ['tokens', 'Tokens', Coins]
  ],
  owner: [
    ['overview', 'Overview', LayoutDashboard],
    ['rooms', 'My rooms', Home],
    ['inquiries', 'Inquiries', Bell]
  ],
  shop: [
    ['overview', 'Overview', LayoutDashboard],
    ['products', 'Products', Package],
    ['rooms', 'Rooms', Home],
    ['orders', 'Orders', Box]
  ],
  tenant: [
    ['overview', 'Overview', LayoutDashboard],
    ['marketplace', 'Marketplace', ShoppingBag],
    ['saved', 'Saved rooms', Home],
    ['contacts', 'Contacts', Bell]
  ]
};

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <article className="dash-stat">
      <div className="dash-stat-icon"><Icon size={18} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon"><Icon size={20} /></div>
      <b>{title}</b>
      <span>{text}</span>
      {action && (
        <button className="dash-primary">
          <Plus size={16} />{action}
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ user, profile, onSignOut }) {
  const isAdmin = profile?.is_admin === true || user?.email?.toLowerCase() === 'roomora1910@gmail.com';
  const role = isAdmin ? 'admin' : profile?.is_shop ? 'shop' : profile?.is_owner ? 'owner' : 'tenant';
  const [active, setActive] = useState('overview');
  const [history, setHistory] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!supabase || !user) return;
    const [r, p, t, tx] = await Promise.all([
      supabase.from('rooms').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('subscription_plans').select('*').order('monthly_price'),
      supabase.rpc('get_my_token_balance'),
      supabase.from('token_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    ]);
    setRooms(r.data || []);
    setPlans(p.data || []);
    setTokenBalance(Number(t.data || 0));
    setTransactions(tx.data || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animate(document.querySelectorAll('.dash-reveal'), {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(45),
      duration: 400,
      ease: 'out(3)'
    });
  }, [active, loading]);

  const mine = useMemo(() => rooms.filter((r) => r.owner_id === user?.id), [rooms, user?.id]);
  const published = rooms.filter((r) => r.status === 'published').length;
  const nav = navByRole[role];
  const go = (key) => {
    setHistory((h) => [...h, active]);
    setActive(key);
    setMobileOpen(false);
  };
  const back = () => setHistory((h) => {
    const next = [...h];
    const previous = next.pop();
    setActive(previous || 'overview');
    return next;
  });
  const title = role === 'admin'
    ? 'Platform control center'
    : role === 'owner'
      ? 'Your rental workspace'
      : role === 'shop'
        ? 'Your shop workspace'
        : 'Your tenant workspace';

  return (
    <div className="dashboard-shell">
      <aside className={mobileOpen ? 'dash-sidebar open' : 'dash-sidebar'}>
        <div className="dash-brand">
          <span className="brand-mark">R</span>
          <span>Room<span>Ora</span></span>
          <button className="dash-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>

        <div className="dash-profile">
          <div className="dash-avatar">{(profile?.display_name || user?.email || 'R').slice(0, 1).toUpperCase()}</div>
          <div>
            <b>{profile?.display_name || 'RoomOra user'}</b>
            <span>{role === 'admin' ? 'Administrator' : role}</span>
          </div>
        </div>

        <nav className="dash-nav">
          {nav.map(([key, label, Icon]) => (
            <button key={key} className={active === key ? 'active' : ''} onClick={() => go(key)}>
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </nav>
        <button className="dash-signout" onClick={onSignOut}><LogOut size={17} /> Sign out</button>
      </aside>

      {mobileOpen && <button className="dash-overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

      <main className="dash-main">
        <header className="dash-top">
          <div className="dash-top-left">
            <button className="dash-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            {active !== 'overview' && (
              <button className="dash-back" onClick={back}><ArrowLeft size={18} /> Back</button>
            )}
            <div>
              <span className="dash-kicker">ROOMORA {role.toUpperCase()}</span>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="dash-top-actions">
            <button className="dash-icon-btn" aria-label="Notifications"><Bell size={18} /></button>
            <div className="dash-top-user">{profile?.display_name || user?.email}</div>
          </div>
        </header>

        <section className="dash-content">
          {active === 'marketplace' && role === 'tenant' ? (
            <MarketplacePanel />
          ) : (
            <>
              <div className="dash-hero dash-reveal">
                <div>
                  <h2>
                    {role === 'admin'
                      ? 'Monitor RoomOra from one place.'
                      : role === 'owner'
                        ? 'Keep your rental workspace organized.'
                        : role === 'shop'
                          ? 'Manage your shop workspace.'
                          : 'Find rooms and publish items.'}
                  </h2>
                  <p>
                    {role === 'tenant'
                      ? 'Publish any eligible item for 5 tokens or browse the marketplace.'
                      : 'Everything important stays compact and comfortable on mobile.'}
                  </p>
                </div>

                {!isAdmin && (
                  <div className="dash-action-row">
                    {(role === 'owner' || (role === 'shop' && profile?.is_owner)) && (
                      <AddRoomPanel user={user} onCreated={refresh} />
                    )}
                    <PublishItemPanel user={user} tokenBalance={tokenBalance} onCreated={refresh} />
                  </div>
                )}
              </div>

              <div className="dash-stats dash-reveal">
                <Stat icon={Home} label="Published rooms" value={published} hint="Live room records" />
                <Stat icon={Users} label="Account" value={role[0].toUpperCase() + role.slice(1)} hint={user?.email || ''} />
                <Stat icon={Coins} label="Token balance" value={tokenBalance} hint="5 tokens / item" />
                <Stat icon={Wallet} label="Plans" value={plans.filter((p) => p.active).length} hint="Active plans" />
              </div>

              {active === 'overview' && (
                <div className="dash-grid dash-reveal">
                  <section className="dash-panel">
                    <div className="dash-panel-head">
                      <div><span>ROOMORA ACTIVITY</span><h3>{isAdmin ? 'Platform snapshot' : 'Your workspace'}</h3></div>
                      <Activity size={18} />
                    </div>
                    {isAdmin ? (
                      <div className="admin-grid">
                        <div><strong>{rooms.length}</strong><span>Room records</span></div>
                        <div><strong>{plans.filter((p) => p.active).length}</strong><span>Active plans</span></div>
                        <div><strong>{transactions.length}</strong><span>Recent token events</span></div>
                      </div>
                    ) : (
                      <EmptyState icon={ShoppingBag} title="Publish or browse" text="Publishing any item costs 5 tokens and lasts one month." />
                    )}
                  </section>

                  <section className="dash-panel">
                    <div className="dash-panel-head">
                      <div><span>QUICK ACCESS</span><h3>Go to a workspace</h3></div>
                      <ArrowUpRight size={18} />
                    </div>
                    <div className="quick-links">
                      {nav.slice(1).map(([key, label, Icon]) => (
                        <button key={key} onClick={() => go(key)}>
                          <Icon size={18} />
                          <div><b>{label}</b><span>Open workspace</span></div>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {active === 'rooms' && (
                <section className="dash-panel dash-reveal">
                  <div className="dash-panel-head">
                    <div><span>ROOMS</span><h3>{role === 'admin' ? 'All room listings' : 'Your room listings'}</h3></div>
                    {role === 'owner' && <AddRoomPanel user={user} onCreated={refresh} />}
                    <Search size={18} />
                  </div>
                  {(role === 'admin' ? rooms : mine).length ? (
                    (role === 'admin' ? rooms : mine).map((r) => (
                      <div className="dash-row" key={r.id}>
                        <div className="row-icon"><Building2 size={16} /></div>
                        <div><b>{r.title}</b><span>{r.locality}, {r.city} · {r.status}</span></div>
                        <strong>₹{Number(r.monthly_price).toLocaleString('en-IN')}</strong>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={Home} title="No rooms yet" text="Room listings will appear here." />
                  )}
                </section>
              )}

              {active === 'subscriptions' && isAdmin && (
                <section className="dash-panel dash-reveal">
                  <div className="dash-panel-head">
                    <div><span>ADMIN SUBSCRIPTIONS</span><h3>Manage the two plans</h3></div>
                    <Wallet size={18} />
                  </div>
                  <SubscriptionManager
                    plans={plans.filter((p) => ['basic', 'premium'].includes(p.name.toLowerCase()))}
                    onUpdated={refresh}
                  />
                </section>
              )}

              {active === 'tokens' && isAdmin && (
                <section className="dash-panel dash-reveal">
                  <div className="dash-panel-head">
                    <div><span>TOKEN LEDGER</span><h3>Recent token activity</h3></div>
                    <Coins size={18} />
                  </div>
                  {transactions.length ? transactions.map((t) => (
                    <div className="dash-row" key={t.id}>
                      <div className="row-icon"><Coins size={16} /></div>
                      <div><b>{t.transaction_type}</b><span>{t.description || 'Token transaction'}</span></div>
                      <strong>{t.amount > 0 ? '+' : ''}{t.amount}</strong>
                    </div>
                  )) : (
                    <EmptyState icon={Coins} title="No transactions" text="No recent activity." />
                  )}
                </section>
              )}

              {active !== 'overview' && active !== 'rooms' && active !== 'subscriptions' && active !== 'tokens' && active !== 'marketplace' && (
                <section className="dash-panel dash-reveal">
                  <div className="dash-panel-head">
                    <div><span>{active.toUpperCase()}</span><h3>{active === 'users' ? 'User management' : active === 'products' ? 'Product management' : active.replace('-', ' ')}</h3></div>
                    <ShieldCheck size={18} />
                  </div>
                  <EmptyState
                    icon={active === 'products' ? ShoppingBag : active === 'users' ? Users : Coins}
                    title="Workspace ready"
                    text="This workspace is ready for the next module."
                  />
                </section>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
