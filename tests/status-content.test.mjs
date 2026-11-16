import test from 'node:test';
import assert from 'node:assert/strict';
import { getStatusRoute, getStatusContent } from '../src/lib/status-content.js';

test('recognized status routes are mapped', () => {
  const expected = {
    '/thank-you': 'thank-you', '/success': 'thank-you',
    '/email-verified': 'email-verified', '/payment/thank-you': 'payment',
    '/error': 'error', '/404': 'not-found', '/not-found': 'not-found',
  };
  for (const [path, kind] of Object.entries(expected)) assert.equal(getStatusRoute(path), kind);
  assert.equal(getStatusRoute('/thank-you/'), 'thank-you');
});

test('normal application routes remain unaffected', () => {
  for (const path of ['/', '/index.html', '/auth/callback', '/unexpected']) {
    assert.equal(getStatusRoute(path), null);
  }
});

test('only recognized thank-you contexts change the message', () => {
  assert.equal(getStatusContent('thank-you', 'inquiry').heading, 'Thanks for reaching out.');
  assert.equal(getStatusContent('thank-you', 'signup').heading, 'Thanks for joining RoomOra.');
  assert.equal(getStatusContent('thank-you', 'listing').heading, 'Thanks for sharing with RoomOra.');
  assert.equal(getStatusContent('thank-you', 'payment').eyebrow, 'PAYMENT STATUS');
  assert.equal(getStatusContent('thank-you', '<script>').heading, 'Thanks for being here.');
});

test('remote outcomes are not claimed from redirect URLs', () => {
  assert.match(getStatusContent('payment').description, /does not confirm a payment/i);
  assert.match(getStatusContent('email-verified').note, /does not independently verify/i);
  assert.match(getStatusContent('not-a-status').eyebrow, /PAGE NOT FOUND/i);
});
