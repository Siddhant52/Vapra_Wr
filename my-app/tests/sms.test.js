import test from 'node:test';
import assert from 'node:assert/strict';

const { buildSmsOfferMessage } = await import('../lib/sms.js');

test('buildSmsOfferMessage includes title, body, and unsubscribe footer', () => {
  const message = buildSmsOfferMessage({
    customerName: 'Ravi',
    title: 'Weekend Offer',
    offerText: 'Get 20% off this week.',
  });

  assert.match(message, /Weekend Offer/);
  assert.match(message, /Get 20% off this week\./);
  assert.match(message, /Reply STOP to unsubscribe/);
  assert.match(message, /Hi Ravi/);
});

test('buildSmsOfferMessage includes image reference when provided', () => {
  const message = buildSmsOfferMessage({
    customerName: 'Ravi',
    title: 'Weekend Offer',
    offerText: 'Get 20% off this week.',
    imageUrl: 'https://example.com/image.jpg',
  });

  assert.match(message, /https:\/\/example\.com\/image\.jpg/);
});
