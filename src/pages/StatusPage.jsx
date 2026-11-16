import React, { useEffect } from 'react';
import { AlertCircle, ArrowRight, Heart, Home, MailCheck, SearchX, ShieldCheck } from 'lucide-react';
import { getStatusContent } from '../lib/status-content';
import './status-page.css';

const iconMap = { heart: Heart, mail: MailCheck, shield: ShieldCheck, alert: AlertCircle, search: SearchX };

export default function StatusPage({ kind = 'not-found', context = '' }) {
  const copy = getStatusContent(kind, context);
  const Illustration = iconMap[copy.icon] || SearchX;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = copy.heading + ' | RoomOra';
    return () => { document.title = previousTitle; };
  }, [copy.heading]);

  return (
    <main className={'roomora-state roomora-state--' + copy.mood}>
      <a className="roomora-state__skip" href="#roomora-state-heading">Skip to message</a>
      <header className="roomora-state__header">
        <a className="roomora-state__brand" href="/" aria-label="RoomOra home">
          <span className="roomora-state__brand-icon" aria-hidden="true">R</span>
          <span>Room<strong>Ora</strong></span>
        </a>
        <span className="roomora-state__topline"><ShieldCheck size={15} aria-hidden="true"/> Find your place</span>
      </header>

      <div className="roomora-state__content">
        <section className="roomora-state__card" aria-labelledby="roomora-state-heading">
          <div className="roomora-state__symbol" aria-hidden="true"><Illustration size={32}/></div>
          <p className="roomora-state__eyebrow">{copy.eyebrow}</p>
          <h1 id="roomora-state-heading">{copy.heading}</h1>
          <p className="roomora-state__description">{copy.description}</p>
          <div className="roomora-state__actions">
            <a className="roomora-state__primary" href={copy.primaryHref}>{copy.primary}<ArrowRight size={18} aria-hidden="true"/></a>
            <a className="roomora-state__secondary" href={copy.secondaryHref}><Home size={16} aria-hidden="true"/>{copy.secondary}</a>
          </div>
          <div className="roomora-state__note"><ShieldCheck size={18} aria-hidden="true"/><p>{copy.note}</p></div>
        </section>
        <p className="roomora-state__tagline">Rooms, PGs and everyday essentials in one place.</p>
      </div>

      <footer className="roomora-state__footer">© 2026 RoomOra · Find a place that feels like home.</footer>
    </main>
  );
}
