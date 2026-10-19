import React from 'react';
import { Mail, MapPin, Code2, ExternalLink } from 'lucide-react';
import { ArrowLeft, ShieldCheck, FileText, UserRound, Code2, Building2, LockKeyhole } from 'lucide-react';
import './trust-pages.css';

const UPDATED = '19 October 2026';
const VERSION = '2026-10-19';

const sections = {
  terms: {
    eyebrow: 'ROOMORA POLICIES',
    title: 'Terms & Conditions',
    intro: 'These terms explain the rules for using RoomOra. Please read them carefully before creating an account, publishing a listing, contacting another user, or using any token-based feature.',
    content: [
      ['1. About RoomOra and acceptance', 'RoomOra is an online marketplace intended to help people discover rooms and paying guests (PGs), furniture, stationery, and new or second-hand student items. By browsing, registering, posting, saving, messaging, or otherwise using the service, you agree to these Terms and the Privacy Notice. If you do not agree, do not create an account or use account-only features. Where required by law, mandatory consumer and other statutory rights remain unaffected.'],
      ['2. Eligibility and account security', 'You must be legally capable of entering into a binding agreement and meet any minimum age required by applicable law. If you are under the age of majority, use the service only where lawful and with the involvement and consent of a parent or legal guardian. Provide accurate information, keep your login credentials confidential, and promptly tell us if you suspect unauthorised account access. You are responsible for activity performed through your account, except where applicable law provides otherwise. Do not create impersonating, duplicate, or fraudulent accounts.'],
      ['3. Marketplace role and limitations', 'RoomOra provides discovery and listing tools; unless a specific feature expressly says otherwise, it is not the landlord, tenant, broker, seller, buyer, payment intermediary, guarantor, or party to transactions between users. Listings are submitted by users and may not be independently verified. RoomOra does not guarantee that a room, PG, product, seller, buyer, price, description, photograph, address, ownership claim, availability, or user identity is accurate, lawful, safe, or suitable. Users must independently inspect, verify, and assess listings before making commitments.'],
      ['4. Room and PG listings', 'Anyone publishing a room or PG listing must have the authority to advertise it and must accurately describe location, rent, deposit, occupancy, amenities, restrictions, availability, and other material terms. Do not advertise a property you cannot lawfully offer, misrepresent ownership or authority, discriminate unlawfully, conceal material conditions, or request unlawful deposits or fees. Users should verify property access, identity, ownership or authorisation, written rental terms, receipts, and applicable local requirements before paying or moving in. RoomOra does not guarantee a tenancy or resolve landlord-tenant disputes.'],
      ['5. Product listings and transactions', 'Sellers must own the item or have permission to sell it and provide truthful descriptions, condition, price, photographs, and delivery or collection terms. Do not list counterfeit, stolen, recalled, illegal, dangerous, restricted, or otherwise prohibited goods. Buyers should inspect goods where practical, agree on collection, delivery, payment, refunds, and any warranty directly with the seller, and retain receipts and communications. Do not assume a product is tested, authentic, safe, or warrantied unless expressly documented by the seller.'],
      ['6. User conduct and prohibited content', 'You must not use RoomOra for fraud, scams, harassment, threats, discrimination, stalking, doxxing, impersonation, spam, phishing, unlawful discrimination in housing, deceptive pricing, fake reviews, manipulation of tokens, unauthorised data collection, malware, or any illegal activity. Do not publish another person’s private information, copyrighted material, or images without permission. Do not bypass access controls, scrape the service, interfere with operations, or attempt to access another account. We may restrict, remove, or investigate content and accounts where reasonably necessary for safety, integrity, compliance, or enforcement of these Terms.'],
      ['7. User content and licence', 'You retain rights you hold in content you submit. You grant RoomOra a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, format, display, and distribute that content only as reasonably necessary to operate, secure, improve, and promote the service and show your listing to intended audiences. You confirm that you have the rights and permissions required to upload it. You can remove or edit listings through available controls; copies may persist temporarily in backups, caches, logs, or where retention is legally required.'],
      ['8. Tokens, fees, and payments', 'If RoomOra provides tokens, credits, subscriptions, or paid features, the applicable screen will describe their intended use and any price or limits before purchase or use. Unless expressly stated otherwise and permitted by law, tokens are service credits, not cash, deposits, bank balances, or an investment; they are not transferable and have no cash value. Do not attempt to exploit, resell, forge, or reverse transactions. Token availability, expiry, refunds, and adjustments are subject to the terms disclosed for the relevant feature and applicable law. RoomOra does not ask users to send money to an unknown person outside the agreed transaction flow. Never share passwords, OTPs, or payment credentials.'],
      ['9. Safety, fraud reports, and disputes', 'Meet other users in sensible public or otherwise safe settings, tell someone about property visits, verify identity and authority, and avoid advance payments until you have independently verified the other party and arrangement. Report suspected scams, unlawful listings, harassment, or security issues through the contact channel published by RoomOra. We may review reports and take proportionate action, but cannot guarantee detection, prevention, recovery of funds, or resolution of every dispute. Users are primarily responsible for their own due diligence and for resolving transaction-specific issues, subject to non-waivable legal rights.'],
      ['10. Moderation and account suspension', 'We may remove, hide, limit, or refuse content; suspend or terminate access; preserve relevant records; or cooperate with lawful requests when reasonably necessary to enforce these Terms, protect users, investigate abuse, maintain security, or comply with law. Where appropriate and lawful, we may provide notice or an opportunity to appeal. Nothing in this section prevents users from exercising rights available under applicable law.'],
      ['11. Availability, third-party services, and security', 'The service may change, be interrupted, or be unavailable for maintenance, technical issues, security incidents, or events outside our reasonable control. Authentication, hosting, storage, analytics, and other capabilities may rely on third-party providers subject to their own terms and privacy practices. We take reasonable steps to maintain the service but cannot promise uninterrupted operation or absolute security of data transmitted over the internet.'],
      ['12. Intellectual property', 'RoomOra’s name, branding, interface, software, and original materials are protected by applicable intellectual-property laws. Except as permitted by law or expressly authorised, you may not copy, modify, redistribute, reverse engineer, or commercially exploit them. You may not use RoomOra branding in a way that implies endorsement or affiliation without written permission.'],
      ['13. Disclaimers and limitation of liability', 'To the maximum extent permitted by applicable law, the service is provided on an “as available” basis and RoomOra makes no promise that listings or user conduct will meet your expectations. RoomOra is not responsible for agreements, payments, deposits, product condition, property condition, personal injury, loss, fraud, or disputes between users except to the extent responsibility cannot lawfully be excluded or is caused by a duty that applicable law imposes on RoomOra. Nothing in these Terms excludes or limits liability for fraud, wilful misconduct, or any liability that cannot legally be excluded. Any lawful limitation of liability applies only to the extent permitted by applicable law.'],
      ['14. Indemnity', 'To the extent permitted by law, you agree to be responsible for claims, losses, and reasonable costs arising from your unlawful use of RoomOra, your breach of these Terms, or content you submit that infringes another person’s rights. This does not require you to indemnify RoomOra for losses caused by RoomOra’s own unlawful conduct or any liability that cannot lawfully be shifted to you.'],
      ['15. Privacy and personal data', 'RoomOra processes account and listing information to operate the marketplace, secure accounts, support users, and meet legal obligations. Avoid including sensitive personal information in public listings. The Privacy Notice explains categories of data, purposes, service providers, retention, security, and how to contact RoomOra about privacy requests. The notice should be read together with these Terms.'],
      ['16. Changes to the service or terms', 'We may update these Terms when features, law, or operational practices change. The current version and effective date will be displayed on this page. For material changes, we will provide notice where required by law. Where fresh consent is legally required, we will request it before the relevant continued use. Your rights under applicable law are not reduced by this clause.'],
      ['17. Governing law and complaints', 'These Terms are intended to be interpreted consistently with applicable laws of India, where applicable, and any mandatory law that applies to a user. Disputes are subject to the competent courts or dispute-resolution process determined under applicable law; nothing here removes statutory consumer remedies or mandatory jurisdiction rules. Before escalating a complaint, contact RoomOra using the verified support details published on the service. The owner should insert a monitored support email and any legally required grievance-officer details before public launch.'],
      ['18. Severability and entire agreement', 'If a provision is found invalid or unenforceable, it will be applied to the maximum lawful extent and the remaining provisions will continue. These Terms and the Privacy Notice form the general agreement governing use of RoomOra, together with any additional terms shown for a specific feature. Failure to enforce a provision immediately does not waive the right to enforce it later.'],
      ['19. Contact and legal review', 'Questions or complaints should be sent to the official RoomOra contact published on the service. The operator must add verified legal owner identity, business/contact address where required, support email, and any required grievance contact before launch. This template is general information, not legal advice, and should be reviewed by a lawyer familiar with Indian information-technology, consumer, data-protection, e-commerce, and housing requirements.']
    ]
  },
  privacy: {
    eyebrow: 'YOUR INFORMATION',
    title: 'Privacy Notice',
    intro: 'This notice explains the main ways RoomOra may use information when you browse, register, save items, publish listings, or contact another user. It should be checked against the actual production data flows before launch.',
    content: [
      ['1. Information we may collect', 'Depending on the features you use, RoomOra may process account details such as name, email, profile and role; listing content, photos, prices and approximate location; saved-item and token activity; support reports and messages you choose to submit; and technical data such as device/browser details, logs, security events, and session information. Do not place passwords, OTPs, financial credentials, government identity numbers, or other sensitive information in public listing fields.'],
      ['2. How information is used', 'Information may be used to create and secure accounts, display listings, provide saved items and publishing tools, administer tokens or subscriptions, prevent fraud and abuse, respond to support requests, maintain reliability, comply with legal obligations, and improve the service. Optional analytics or marketing uses should be described and enabled only where lawful and appropriate.'],
      ['3. Public listings and sharing', 'Information you include in a public listing may be visible to other visitors. RoomOra may share necessary data with infrastructure and service providers such as authentication, database, hosting, storage, and security vendors to operate the app. Information may also be disclosed when legally required, to address abuse or protect rights, or with your direction. We do not promise that content shared publicly can be fully recalled after another person has copied it.'],
      ['4. Cookies, local storage, and security', 'The app and its providers may use cookies, local storage, session tokens, or similar technologies needed for authentication, preferences, and security. Reasonable technical and organisational safeguards should be used, but no internet service can guarantee perfect security. Keep your device and account credentials secure and notify the operator promptly about suspected account misuse.'],
      ['5. Retention and your choices', 'Information is retained for as long as reasonably necessary for the purposes described, account operation, safety, dispute handling, backups, and legal obligations. You may request access, correction, deletion, or other rights available under applicable law using the verified RoomOra support contact. Some information may need to be retained where legally required or for legitimate security and recordkeeping purposes.'],
      ['6. Children and eligibility', 'RoomOra is not intended to collect personal information from children in a manner prohibited by applicable law. Users must meet legal eligibility requirements and obtain parental or guardian involvement where required. If you believe a child’s information has been submitted improperly, contact the operator.'],
      ['7. Changes and contact', 'This notice may be updated as the app changes. The displayed update date identifies the current draft version. Before launch, the operator should confirm the actual database, logs, analytics, storage, email, and third-party integrations; set a retention schedule; and publish verified privacy and grievance contact details. This notice is a draft for legal review, not a guarantee of compliance.']
    ]
  },
  about: {
    eyebrow: 'A MORE HUMAN MARKETPLACE',
    title: 'About RoomOra',
    intro: 'RoomOra brings room and PG discovery together with useful student essentials—furniture, stationery, and second-hand items—in one simple marketplace.',
    content: [
      ['What we are building', 'A visual, location-aware place to discover listings, compare the details that matter, and help students and local communities make more informed choices. The experience is designed to be approachable on mobile devices as well as desktop.'],
      ['How RoomOra works', 'People can browse available listings, choose a category, and use account features to save items or manage their own listings. Listings are created by users, so details should always be verified directly with the person offering the room or product.'],
      ['Trust is a shared responsibility', 'We aim to make the rules visible, encourage accurate listings, and provide a way to raise concerns. A profile or listing on RoomOra is not, by itself, proof of identity, property ownership, product quality, or trustworthiness. Please use sensible safety practices before meeting someone or paying money.'],
      ['Our commitment', 'We want RoomOra to be clear about what it offers, what it cannot guarantee, and how users can raise concerns. We will continue to improve usability, transparency, and reporting as the platform develops.']
    ]
  },
  owner: {
    eyebrow: 'FOUNDER & ACCOUNTABILITY',
    title: 'Owner & Founder',
    intro: 'RoomOra is founded and developed by Er. Pankaj Yadav, a full-stack developer based in Prayagraj, Uttar Pradesh, India.',
    content: [
      ['Meet the founder', 'Er. Pankaj Yadav is the owner and full-stack developer behind RoomOra. He is building the platform to bring room and PG discovery together with furniture, stationery, and second-hand student essentials in one accessible marketplace.'],
      ['Location', 'Prayagraj, Uttar Pradesh, India'],
      ['Contact RoomOra', 'For company, platform, or support enquiries, email roomora1910@gmail.com.'],
      ['Contact the founder', 'For personal or professional enquiries, email pankaj64700@gmail.com.'],
      ['Marketplace responsibility', 'RoomOra aims to make listing information and platform rules clearer. Listings are user-submitted and should be independently verified. The platform does not certify every user, room, property, or product, and this statement does not limit any responsibility required by applicable law.']
    ]
  },
  developer: {
    eyebrow: 'FOUNDER · OWNER · BUILDER',
    title: 'Meet the Developer',
    intro: 'Er. Pankaj Yadav — Full-Stack Developer and the founder and owner of RoomOra.',
    content: [
      ['Building RoomOra', 'Pankaj is developing RoomOra as a mobile-friendly marketplace for students and local communities. The product brings room and PG discovery together with furniture, stationery, and second-hand items, with an emphasis on approachable design and practical listing tools.'],
      ['Product approach', 'The goal is to make it easier to browse, compare, save, and manage listings while being transparent about what the platform can and cannot verify. RoomOra is an ongoing project and its features may continue to evolve.'],
      ['Company contact', 'Email: roomora1910@gmail.com'],
      ['Founder contact', 'Email: pankaj64700@gmail.com'],
      ['Based in', 'Prayagraj, Uttar Pradesh, India']
    ]
  },
  about: {
    eyebrow: 'A MORE HUMAN MARKETPLACE',
    title: 'About RoomOra',
    intro: 'RoomOra brings room and PG discovery together with useful student essentials—furniture, stationery, and second-hand items—in one simple marketplace.',
    content: [
      ['What we are building', 'A visual, location-aware place to discover listings, compare the details that matter, and help students and local communities make more informed choices. The experience is designed to be approachable on mobile devices as well as desktop.'],
      ['How RoomOra works', 'People can browse available listings, choose a category, and use account features to save items or manage their own listings. Listings are created by users, so details should always be verified directly with the person offering the room or product.'],
      ['Trust is a shared responsibility', 'We aim to make the rules visible, encourage accurate listings, and provide a way to raise concerns. A profile or listing on RoomOra is not, by itself, proof of identity, property ownership, product quality, or trustworthiness. Please use sensible safety practices before meeting someone or paying money.'],
      ['Our commitment', 'We want RoomOra to be clear about what it offers, what it cannot guarantee, and how users can raise concerns. We will continue to improve usability, transparency, and reporting as the platform develops.']
    ]
  },
  owner: {
    eyebrow: 'ACCOUNTABILITY',
    title: 'Owner & platform responsibility',
    intro: 'A trustworthy marketplace should make it clear who operates it and what the operator is responsible for.',
    content: [
      ['Who operates RoomOra?', 'RoomOra is the project represented by this application. The legal owner/operator’s verified name and official business or correspondence details have not been supplied in the project information available for this update, so they are intentionally not invented here. Those details should be published before the marketplace is opened to the public.'],
      ['What the owner is responsible for', 'Maintaining the service and its published policies; providing a monitored contact channel; reviewing reports in a reasonable way; handling account and security issues; and meeting legal obligations applicable to the actual operating model. The precise obligations depend on the owner’s legal status, the services enabled, and the laws that apply.'],
      ['How to contact the owner', 'Before launch, replace the configuration placeholders in this page with the legal owner/operator name, a monitored support email, and any business or grievance contact required by law. Do not rely on an unmonitored or invented contact address.'],
      ['Marketplace boundaries', 'RoomOra helps users find and publish listings. Unless a particular service expressly states otherwise, the platform does not independently certify each user, guarantee a listing, or become a party to a rental or product sale. This does not remove any duty or liability that applicable law places on the operator.']
    ]
  },
  developer: {
    eyebrow: 'HOW IT IS BUILT',
    title: 'Developer & product approach',
    intro: 'RoomOra is being developed as a mobile-friendly marketplace with a focus on straightforward browsing, clear listings, and practical account tools.',
    content: [
      ['Product and engineering', 'The application uses a React-based frontend and connected backend services for account and marketplace functionality. The developer work focuses on user experience, reusable interface components, responsive layouts, and reliable listing flows.'],
      ['What the developer does not certify', 'The presence of a developer page does not mean that every user, property, seller, product, or listing has been independently verified. Technical checks can improve service reliability, but they cannot replace real-world due diligence.'],
      ['Developer identity', 'The developer’s verified public name, professional profile, and contact details were not provided for this update, so no identity or credentials are fabricated. Add only details the developer has approved for public display.'],
      ['Report an issue', 'Users should report technical problems, suspected security issues, or misleading listings through the verified RoomOra support channel once it is configured. Avoid sending passwords, OTPs, payment credentials, or other secrets in a report.']
    ]
  }
};

export default function TrustPage({ page, onClose }) {
  const data = sections[page];
  if (!data) return null;
  const Icon = page === 'terms' ? FileText : page === 'privacy' ? LockKeyhole : page === 'owner' ? Building2 : page === 'developer' ? Code2 : UserRound;
  return <div className="trust-page-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <article className="trust-page" role="dialog" aria-modal="true" aria-labelledby="trust-page-title">
      <header className="trust-page-top"><button className="trust-back" onClick={onClose}><ArrowLeft size={17}/> Back to RoomOra</button><span className="trust-page-version"><ShieldCheck size={14}/> Updated {UPDATED}</span></header>
      <div className={page === 'owner' || page === 'developer' ? 'trust-page-hero trust-profile-hero' : 'trust-page-hero'}>{(page === 'owner' || page === 'developer') && <img className="trust-founder-photo" src="/pankaj-yadav.jpg" alt="Er. Pankaj Yadav, RoomOra founder and full-stack developer" loading="lazy"/>}<div className="trust-profile-copy"><div className="trust-page-icon"><Icon size={22}/></div><div className="trust-page-eyebrow">{data.eyebrow}</div><h1 id="trust-page-title">{data.title}</h1><p>{data.intro}</p>{(page === 'owner' || page === 'developer') && <div className="trust-contact-links"><a href="mailto:roomora1910@gmail.com"><Mail size={15}/> Company email</a><a href="mailto:pankaj64700@gmail.com"><Mail size={15}/> Personal email</a><span><MapPin size={15}/> Prayagraj, Uttar Pradesh, India</span></div>}{page === 'terms' && <span className="trust-version-tag">Terms version {VERSION}</span>}</div></div>
      <div className="trust-page-content">{data.content.map(([heading, body]) => <section className="trust-policy-section" key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      {page === 'terms' && <p className="trust-legal-note"><strong>Important:</strong> This is a practical draft, not legal advice. It cannot guarantee protection from legal claims. Have a qualified lawyer review it against RoomOra’s real business model, data flows, and applicable law before launch.</p>}
      {page === 'owner' && <div className="trust-setup-note"><strong>Owner setup required before public launch</strong><p>Publish the verified legal owner/operator name and monitored support contact. Do not leave identity or grievance-contact information unconfigured.</p></div>}
      {page === 'developer' && <div className="trust-setup-note"><strong>Developer details can be added</strong><p>Only publish a real name, approved profile link, and contact details after the developer confirms them.</p></div>}
      </div>
      <footer className="trust-page-footer"><span>RoomOra · Clear listings. Informed choices.</span><button onClick={onClose}>Close page</button></footer>
    </article>
  </div>;
}
