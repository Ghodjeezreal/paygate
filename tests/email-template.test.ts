import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEventRegistrationApprovedEmail } from '../src/lib/email';

describe('event approval email template', () => {
  it('keeps a single QR image with a cid fallback so only one code is shown', () => {
    const html = getEventRegistrationApprovedEmail({
      buyerName: 'Ada',
      eventTitle: 'Launch Night',
      ticketTypeName: 'VIP',
      reference: 'REF-123',
      qrCode: 'data:image/png;base64,abc123',
    });

    assert.match(html, /cid:event-qr/i);
    assert.match(html, /onerror="this\.src='data:image\/png;base64,abc123'"/i);
    assert.equal((html.match(/<img /gi) || []).length, 1);
  });
});
