import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEventRegistrationApprovedEmail } from '../src/lib/email';

describe('event approval email template', () => {
  it('uses a cid-based QR image instead of a raw data URI so it renders in email clients', () => {
    const html = getEventRegistrationApprovedEmail({
      buyerName: 'Ada',
      eventTitle: 'Launch Night',
      ticketTypeName: 'VIP',
      reference: 'REF-123',
      qrCode: 'data:image/png;base64,abc123',
    });

    assert.match(html, /cid:event-qr/i);
    assert.doesNotMatch(html, /src="data:image\/png;base64/i);
  });
});
