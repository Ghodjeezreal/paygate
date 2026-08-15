import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEventRegistrationApprovedEmail } from '../src/lib/email';

describe('event approval email template', () => {
  it('includes both the cid QR and a data-URI fallback so email clients still show a QR code', () => {
    const html = getEventRegistrationApprovedEmail({
      buyerName: 'Ada',
      eventTitle: 'Launch Night',
      ticketTypeName: 'VIP',
      reference: 'REF-123',
      qrCode: 'data:image/png;base64,abc123',
    });

    assert.match(html, /cid:event-qr/i);
    assert.match(html, /src="data:image\/png;base64,abc123"/i);
  });
});
