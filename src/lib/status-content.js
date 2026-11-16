/**
 * Status screens are informational. Route paths and query strings are never
 * proof that payments, account verification or database writes succeeded.
 */
const screens = {
  'thank-you': {
    eyebrow: 'THANK YOU',
    heading: 'Thanks for being here.',
    description: 'You can continue exploring RoomOra. If you submitted a request or published a listing, check your account to confirm its current status.',
    note: 'A confirmation page alone does not verify that a remote action completed.',
    primary: 'Continue to RoomOra', primaryHref: '/',
    secondary: 'Explore the marketplace', secondaryHref: '/#marketplace',
    mood: 'success', icon: 'heart',
  },
  'payment': {
    eyebrow: 'PAYMENT STATUS',
    heading: 'Check your payment status.',
    description: 'Thanks for choosing RoomOra. Being redirected here does not confirm a payment. Check Subscriptions for the verified order state and your token balance.',
    note: 'If the payment is still pending, verify its status before trying again to avoid duplicate charges.',
    primary: 'Check subscriptions', primaryHref: '/?view=subscriptions',
    secondary: 'Back to RoomOra', secondaryHref: '/',
    mood: 'pending', icon: 'shield',
  },
  'email-verified': {
    eyebrow: 'ACCOUNT VERIFICATION',
    heading: 'Welcome to RoomOra.',
    description: 'If you followed a verification link, return to RoomOra and sign in. If verification did not finish, check your inbox and try the link again.',
    note: 'Opening this page does not independently verify your email address.',
    primary: 'Continue to RoomOra', primaryHref: '/',
    secondary: 'Browse listings', secondaryHref: '/#marketplace',
    mood: 'success', icon: 'mail',
  },
  'error': {
    eyebrow: 'SOMETHING WENT WRONG',
    heading: 'We hit a little snag.',
    description: 'The requested page or action could not be completed as expected. Return to RoomOra to check your latest account status.',
    note: 'No payment, message or listing should be assumed successful based on this page.',
    primary: 'Return to RoomOra', primaryHref: '/',
    secondary: 'Browse listings', secondaryHref: '/#marketplace',
    mood: 'error', icon: 'alert',
  },
  'not-found': {
    eyebrow: '404 · PAGE NOT FOUND',
    heading: 'This page wandered off.',
    description: 'The link may be outdated, mistyped or no longer available. There are still plenty of listings to explore.',
    note: 'If this was a shared listing, ask the publisher whether it is still available.',
    primary: 'Go to RoomOra', primaryHref: '/',
    secondary: 'Explore listings', secondaryHref: '/#marketplace',
    mood: 'neutral', icon: 'search',
  },
};

const contexts = {
  inquiry: {
    heading: 'Thanks for reaching out.',
    description: 'If your inquiry was submitted successfully, you can follow up in your RoomOra Chat workspace.',
    note: 'This page by itself does not verify message delivery.',
  },
  listing: {
    heading: 'Thanks for sharing with RoomOra.',
    description: 'Visit your published items in the dashboard to verify that your listing is visible and all details are correct.',
    note: 'Listing publication and token deductions must be confirmed in your account.',
  },
  signup: {
    heading: 'Thanks for joining RoomOra.',
    description: 'Please check your inbox for a confirmation email, then follow the link and sign in to access your workspace.',
    note: 'Check spam if your confirmation email has not arrived.',
  },
};

export function getStatusRoute(path) {
  const normalized = (typeof path === 'string' ? path : '/').replace(/\/+$/, '') || '/';
  if (normalized === '/thank-you' || normalized === '/success') return 'thank-you';
  if (normalized === '/payment/thank-you') return 'payment';
  if (normalized === '/email-verified') return 'email-verified';
  if (normalized === '/error') return 'error';
  if (normalized === '/404' || normalized === '/not-found') return 'not-found';
  return null;
}

export function getStatusContent(kind, context) {
  const base = screens[kind] || screens['not-found'];
  if (kind === 'thank-you' && context === 'payment') return screens.payment;
  if (kind === 'thank-you' && Object.prototype.hasOwnProperty.call(contexts, context)) {
    return { ...base, ...contexts[context] };
  }
  return base;
}
