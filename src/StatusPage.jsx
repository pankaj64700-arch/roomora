import React from 'react';
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Home, MailCheck, ShieldCheck, TriangleAlert } from 'lucide-react';
import './status-pages.css';

const STATES = {
  thankyou: { eyebrow: 'THANK YOU', title: 'We appreciate you.', copy: 'Your request has been received. We’ll take it from here and keep you updated.', icon: CircleCheck, tone: 'success', action: 'Back to RoomOra' },
  error: { eyebrow: 'SOMETHING WENT WRONG', title: 'That didn’t go as planned.', copy: 'We couldn’t complete that request. Your account and saved information haven’t been changed.', icon: TriangleAlert, tone: 'warning', action: 'Try again' },
  failed: { eyebrow: 'PAYMENT NOT COMPLETED', title: 'No charge was confirmed.', copy: 'Your payment didn’t go through. You can return to your account and try again when you’re ready.', icon: CircleX, tone: 'danger', action: 'Return to account' },
  success: { eyebrow: 'ALL SET', title: 'Your action was successful.', copy: 'Everything is confirmed. You can safely continue using RoomOra.', icon: CircleCheck, tone: 'success', action: 'Continue to RoomOra' },
  verified: { eyebrow: 'ACCOUNT VERIFIED', title: 'You’re verified.', copy: 'Your email has been confirmed. Sign in to find rooms, message owners, and manage your listings.', icon: MailCheck, tone: 'success', action: 'Go to RoomOra' },
  notfound: { eyebrow: '404 · PAGE NOT FOUND', title: 'Looks like you took a wrong turn.', copy: 'This page may have moved or the address may be incorrect. Your next great find is still just a click away.', icon: Home, tone: 'neutral', action: 'Back to RoomOra' },
};

const routeKey = pathname => {
  const path = pathname.toLowerCase().replace(/\/+$/, '').split('/').pop();
  if (!path || path === 'index.html') return null;
  if (['thank-you', 'thankyou', 'thank_you'].includes(path)) return 'thankyou';
  if (['error', 'something-went-wrong'].includes(path)) return 'error';
  if (['failed', 'payment-failed', 'failure'].includes(path)) return 'failed';
  if (['success', 'payment-success', 'complete'].includes(path)) return 'success';
  if (['verified', 'verified-successfully', 'email-verified', 'confirm'].includes(path)) return 'verified';
  return 'notfound';
};

export function getStatusRoute(pathname) { return routeKey(pathname); }

export default function StatusPage({ type = 'notfound' }) {
  const state = STATES[type] || STATES.notfound;
  const Icon = state.icon;
  return <main className="status-page">
    <header className="status-nav"><a className="status-brand" href="/" aria-label="RoomOra home"><span className="status-brand-mark">R</span><span>Room<span>Ora</span></span></a><span className="status-nav-note"><ShieldCheck size={15}/> A little more room to feel at home</span></header>
    <section className="status-content" aria-labelledby="status-title">
      <div className={`status-visual ${state.tone}`}><div className="status-orbit orbit-one"/><div className="status-orbit orbit-two"/><div className="status-icon"><Icon size={38} strokeWidth={1.65}/></div><span className="status-spark spark-one"/><span className="status-spark spark-two"/></div>
      <div className="status-copy"><div className={`status-eyebrow ${state.tone}`}><span/>{state.eyebrow}</div><h1 id="status-title">{state.title}</h1><p>{state.copy}</p><div className="status-actions"><a className="status-primary" href="/">{state.action}<ArrowRight size={17}/></a><a className="status-secondary" href="/"> <ArrowLeft size={15}/> Visit the homepage</a></div></div>
      <div className="status-support"><span>Need a hand?</span><a href="mailto:support@roomora.in">Contact RoomOra support</a></div>
    </section>
    <footer className="status-footer"><span>© 2026 RoomOra</span><span>Find your place. Make it home.</span></footer>
  </main>;
}
