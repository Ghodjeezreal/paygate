from pathlib import Path

content = """Event Ticketing Platform MVP Spec

Product goal
Build a simple event ticketing platform that allows users to discover events, purchase free or paid tickets, receive a digital ticket, and use a QR code for entry validation.

MVP scope
Included:
- Event listing
- Event details
- Ticket selection
- Free and paid ticket flow
- Digital ticket with QR code
- QR-based check-in
- Basic ticket history and attendee status

Excluded for v1:
- Refunds and exchanges
- Resale marketplace
- Promo codes and discount engine
- Advanced analytics and reporting
- Multi-venue or multi-organizer complexity

Core user roles
- Attendee: browse, buy, view tickets, show QR at entry
- Organizer: create events, define ticket types, manage availability
- Staff: scan QR codes and validate entry
- Admin: manage events, users, and reports

Core screens
- Home / events list
- Event details
- Ticket selection
- Purchase confirmation / success
- My tickets
- Check-in scanner
- Organizer dashboard

Product rules
- Each ticket must be tied to one event and one attendee
- QR should be generated after successful purchase
- A ticket can be valid, used, or invalid
- Free tickets should work the same as paid tickets in the flow

Success criteria
- A user can buy a ticket in under 3 steps
- A staff member can verify a ticket with a QR scan
- The platform supports both free and paid events without changing the core flow

Recommended next step
Before implementation, approve the MVP scope and confirm the first event type to target, such as concerts, conferences, or community events.
"""

lines = content.splitlines()
text_stream = "BT\n/F1 11 Tf\n72 760 Td\n"
for i, line in enumerate(lines):
    escaped = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
    if i == 0:
        text_stream += f"({escaped}) Tj\n"
    else:
        text_stream += f"0 -14 Td\n({escaped}) Tj\n"
text_stream += "ET"

objects = []
objects.append("<< /Type /Catalog /Pages 2 0 R >>")
objects.append("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
objects.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
objects.append(f"<< /Length {len(text_stream.encode('latin-1'))} >>\nstream\n{text_stream}\nendstream")
objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

pdf_parts = []
offsets = []
for idx, obj in enumerate(objects, start=1):
    offsets.append(sum(len(part.encode('latin-1')) for part in pdf_parts))
    pdf_parts.append(f"{idx} 0 obj\n{obj}\nendobj\n")

body = ''.join(pdf_parts)
xref_offset = len(body.encode('latin-1'))
# rebuild with correct offsets
pdf_parts = []
for idx, obj in enumerate(objects, start=1):
    pdf_parts.append(f"{idx} 0 obj\n{obj}\nendobj\n")

# compute offsets accurately
acc = 0
offsets = []
for part in pdf_parts:
    offsets.append(acc)
    acc += len(part.encode('latin-1'))

body = ''.join(pdf_parts)

xref_entries = ['xref\n', f'0 {len(objects)+1}\n', '0000000000 65535 f \n']
for off in offsets:
    xref_entries.append(f"{off:010d} 00000 n \n")

pdf = bytearray()
pdf.extend(b'%PDF-1.4\n')
pdf.extend(body.encode('latin-1'))
pdf.extend(''.join(xref_entries).encode('latin-1'))
pdf.extend(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{len(b'%PDF-1.4\n' + body.encode('latin-1'))}\n%%EOF\n".encode('latin-1'))

Path('event-ticketing-mvp-spec.pdf').write_bytes(pdf)
Path('event-ticketing-mvp-spec.txt').write_text(content, encoding='utf-8')
print('created event-ticketing-mvp-spec.pdf')
