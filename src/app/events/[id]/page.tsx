"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import type { EventItem } from '@/lib/event-ticket-store';

function getCountdownParts(eventDate: string | null | undefined, now: number) {
  if (!eventDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const target = new Date(eventDate).getTime();
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [hideHeader, setHideHeader] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [circle, setCircle] = useState('Family');
  const circleOptions = Array.isArray(event?.circleOptions) && event.circleOptions.length ? event.circleOptions : ['Family', 'Friends of the Family', 'Church Family'];
  const [note, setNote] = useState('');
  const [attendance, setAttendance] = useState<'accept' | 'decline'>('accept');
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load event:', errorText || 'Unknown error');
          setEvent(null);
          setSelectedType('');
          return;
        }

        const text = await response.text();
        if (!text) {
          setEvent(null);
          setSelectedType('');
          return;
        }

        const data = JSON.parse(text);
        setEvent(data.event || null);
        setCircle(Array.isArray(data.event?.circleOptions) && data.event.circleOptions.length ? data.event.circleOptions[0] : 'Family');
        if (data.event?.ticketTypes?.length) {
          setSelectedType(data.event.ticketTypes[0].id);
        } else {
          setSelectedType('');
        }
      } catch (error) {
        console.error('Invalid event response:', error);
        setEvent(null);
        setSelectedType('');
      }
    };

    if (params.id) {
      loadEvent();
    }
  }, [params.id]);

  useEffect(() => {
    if (!event) {
      setHideHeader(false);
      return;
    }

    const directCustomShare = Boolean(event.shareSlug && String(params.id) === event.shareSlug);
    setHideHeader(searchParams.get('share') !== null || searchParams.get('hideHeader') === '1' || directCustomShare);
  }, [event, params.id, searchParams]);

  useEffect(() => {
    if (!event?.date) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [event?.date]);

  const copyShareLink = async () => {
    if (!event) return;

    const shareSlug = event.shareSlug || event.id;
    const shareUrl = `${window.location.origin}/events/${shareSlug}${event.shareSlug ? '?share=1' : ''}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Event registration link copied. You can now share it with invitees.');
    } catch (error) {
      console.error('Failed to copy event share link:', error);
      alert(`Copy this link to share: ${shareUrl}`);
    }
  };

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const isTicketlessEvent = Boolean(event?.isTicketless || event?.ticketTypes.length === 0);
    if (!isTicketlessEvent && !selectedType) return;
    if (attendance === 'decline') {
      alert('Your response has been noted as unable to attend. Switch to JOYFULLY ACCEPTS to reserve a ticket.');
      return;
    }

    setSubmitting(true);
    const response = await fetch('/api/events/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: params.id,
        ticketTypeId: isTicketlessEvent ? 'ticketless' : selectedType,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        circleName: circle,
        guestMessage: note,
        quantity,
      }),
    });

    const data = await response.json();
    setSubmitting(false);

    if (response.ok) {
      const params = new URLSearchParams({ reference: data.ticket.reference });
      if (hideHeader || searchParams.get('share') !== null) {
        params.set('hideHeader', '1');
      }
      if (searchParams.get('share') !== null) {
        params.set('share', '1');
      }
      router.push(`/events/success?${params.toString()}`);
    } else {
      alert(data.error || 'Unable to purchase ticket');
    }
  };

  if (!event) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  const isTicketlessEvent = Boolean(event.isTicketless || event.ticketTypes.length === 0);
  const selectedTicket = event.ticketTypes.find((type) => type.id === selectedType) || null;
  const estimatedTotal = selectedTicket ? selectedTicket.price * quantity : 0;
  const eventDate = new Date(event.date);
  const countdown = getCountdownParts(event.date, now);
  const heroText = event.heroText || 'Come celebrate with us';
  const invitationMessage = event.invitationMessage || 'We would be honored to share this beautiful day with you. Your presence is the gift.';
  const selectedColors = Array.isArray(event.colors) && event.colors.length ? event.colors : [event.color || '#c8a047'];
  const dressCode = event.dressCode || 'Cool and calm';
  const admits = event.admits || 'This invite admits one';
  const venueNote = event.venueNote || 'Venue details provided at check-in confirmation';
  const familyNote = event.familyNote || 'With love, from the family';
  const ctaText = event.ctaText || 'Respond to the invitation ->';
  const titleParts = event.title
    .split(/[-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const headingLine1 = event.heroHeading || titleParts[0] || event.title;
  const headingLine2 = event.heroSubheading || titleParts[1] || '';
  const headingLine3 = event.heroAge || titleParts[2] || '';
  const headingLine1Font = event.heroHeadingFont || 'Georgia';
  const headingLine2Font = event.heroSubheadingFont || 'Georgia';
  const headingLine3Font = event.heroAgeFont || 'Georgia';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f5ed' }}>
      <Header showBackButton={!hideHeader} hideGlobalHeader={hideHeader} />
      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 0 44px' }}>
        <section
          style={{
            background: 'radial-gradient(circle at 8% 12%, #4b2f6d 0%, #2a1945 45%, #1f1737 100%)',
            color: '#f8f5ed',
            padding: '36px 18px 34px',
            borderBottom: '2px solid #c09a45',
          }}
        >
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#cba960', marginBottom: '12px', fontWeight: 700 }}>
                  Come celebrate with us
                </div>
                <h1 style={{ margin: '0 0 8px', fontSize: '56px', lineHeight: 0.98, fontFamily: `${headingLine1Font}, Georgia, serif`, fontWeight: 600 }}>
                  {headingLine1}
                </h1>
                {headingLine2 && <div style={{ marginBottom: '8px', fontSize: '42px', lineHeight: 1, fontFamily: `${headingLine2Font}, Georgia, serif` }}>{headingLine2}</div>}
                {headingLine3 && (
                  <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '108px', lineHeight: 0.88, color: '#d9b45d', fontFamily: `${headingLine3Font}, Georgia, serif`, fontWeight: 700 }}>
                      {headingLine3}
                    </div>
                    <div style={{ fontSize: '36px', fontFamily: `${headingLine3Font}, Georgia, serif`, color: '#e7ddc7' }}>years</div>
                  </div>
                )}
                <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.65, color: '#d8d2e7', maxWidth: '430px' }}>
                  {heroText}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <a href="#rsvp" style={{ padding: '12px 18px', borderRadius: '999px', background: 'linear-gradient(90deg, #af8a2f 0%, #d9bb67 100%)', color: '#201735', textDecoration: 'none', fontWeight: 700, fontSize: '13px' }}>
                    {ctaText}
                  </a>
                  <a href="#details" style={{ padding: '12px 18px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.25)', color: '#f8f5ed', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                    Event details
                  </a>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.25)',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: '#f8f5ed',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Copy invite link
                  </button>
                </div>
              </div>
              <div style={{ justifySelf: 'center', width: '100%', maxWidth: '400px' }}>
                <div style={{ borderRadius: '18px', overflow: 'hidden', background: '#846c63', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <img src={event.image || '/icons/mastercard.png'} alt={event.title} style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-22px', marginBottom: '12px' }}>
                    <div style={{ borderRadius: '999px', padding: '7px 14px', backgroundColor: '#2a1945', border: '1px solid rgba(217,180,93,0.45)', color: '#cba960', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {eventDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.14em', color: '#cba960' }}>Scroll</div>
          </div>
        </section>

        <section style={{ backgroundColor: '#23163a', padding: '16px 14px 22px', borderBottom: '1px solid #c09a45' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ fontSize: '17px', textAlign: 'center', color: '#d8d2e7', fontFamily: 'Georgia, Times New Roman, serif', marginBottom: '10px' }}>Counting down to a day worth remembering</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'Days', value: countdown.days },
              { key: 'Hours', value: countdown.hours },
              { key: 'Minutes', value: countdown.minutes },
              { key: 'Seconds', value: countdown.seconds },
            ].map((item) => (
              <div key={item.key} style={{ minWidth: '95px', borderRadius: '10px', backgroundColor: '#332151', border: '1px solid rgba(203,169,96,0.25)', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#d9bb67', fontFamily: 'Georgia, Times New Roman, serif' }}>{String(item.value).padStart(2, '0')}</div>
                <div style={{ fontSize: '11px', color: '#d8d2e7', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.key}</div>
              </div>
            ))}
            </div>
          </div>
        </section>

        <section id="details" style={{ backgroundColor: '#f7f1e6', padding: '34px 16px 34px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', borderBottom: '2px solid #c09a45' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#8b6f2e', marginBottom: '8px' }}>The Invitation</div>
              <h2 style={{ margin: '0 0 10px', fontSize: '48px', lineHeight: 1.04, color: '#22153a', fontFamily: 'Georgia, Times New Roman, serif' }}>A note, before the day itself</h2>
              <div style={{ width: '56px', height: '2px', backgroundColor: '#d1ad5d', margin: '0 auto 16px' }} />
              <p style={{ maxWidth: '780px', margin: '0 auto 12px', fontSize: '22px', lineHeight: 1.7, color: '#2f243e', fontFamily: 'Georgia, Times New Roman, serif' }}>
                {invitationMessage}
              </p>
              <p style={{ maxWidth: '780px', margin: '0 auto 12px', fontSize: '22px', lineHeight: 1.7, color: '#2f243e', fontFamily: 'Georgia, Times New Roman, serif' }}>
                {event.description}
              </p>
              <p style={{ maxWidth: '780px', margin: '0 auto', fontSize: '22px', lineHeight: 1.7, color: '#2f243e', fontFamily: 'Georgia, Times New Roman, serif' }}>
                {event.eventType === 'corporate' ? 'We look forward to connecting with you and celebrating a shared vision for the future.' : 'Come share a meal, a memory, and an evening of thanksgiving. Your presence is the gift.'}
              </p>
              <p style={{ margin: '16px 0 0', color: '#5f4e72', fontStyle: 'italic', fontSize: '14px' }}>{familyNote}</p>
              <p style={{ margin: '6px 0 0', color: '#2f243e', fontWeight: 700, fontSize: '18px' }}>{event.title}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #ece2cf', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8b6f2e', marginBottom: '8px' }}>When</div>
                <div style={{ color: '#2f243e', fontWeight: 700 }}>{eventDate.toLocaleDateString()}</div>
                <div style={{ color: '#6b6477', fontSize: '13px', marginTop: '4px' }}>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #ece2cf', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8b6f2e', marginBottom: '8px' }}>Dress code</div>
                <div style={{ color: '#2f243e', fontWeight: 700 }}>{dressCode}</div>
                <div style={{ color: '#6b6477', fontSize: '13px', marginTop: '4px' }}>Come elegant, come comfortable</div>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #ece2cf', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8b6f2e', marginBottom: '8px' }}>Admits</div>
                <div style={{ color: '#2f243e', fontWeight: 700 }}>{admits}</div>
                <div style={{ color: '#6b6477', fontSize: '13px', marginTop: '4px' }}>Kindly RSVP below</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #ece2cf', padding: '14px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8b6f2e', marginBottom: '8px' }}>Where</div>
              <div style={{ color: '#2f243e', fontWeight: 700 }}>{event.venue}</div>
              <div style={{ color: '#6b6477', fontSize: '13px', marginTop: '4px' }}>{venueNote}</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#8b6f2e', marginBottom: '8px' }}>Colour of the day</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {selectedColors.map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    aria-label={`Selected event colour ${index + 1}`}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: '2px solid rgba(29, 16, 54, 0.2)',
                      boxShadow: '0 8px 18px rgba(17, 24, 39, 0.12)',
                      display: 'inline-block',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

        </section>

        <section id="rsvp" style={{ backgroundColor: '#f8f5ed', padding: '34px 16px 40px', borderBottom: '1px solid #d6c4a6' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#8b6f2e', marginBottom: '8px' }}>Kindly respond</div>
              <h2 style={{ margin: 0, fontSize: '52px', lineHeight: 1.05, color: '#22153a', fontFamily: 'Georgia, Times New Roman, serif' }}>Will you be there?</h2>
              <div style={{ width: '56px', height: '2px', backgroundColor: '#d1ad5d', margin: '10px auto 0' }} />
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto', backgroundColor: 'white', borderRadius: '18px', border: '1px solid #ece2cf', boxShadow: '0 18px 36px -22px rgba(29,16,54,0.35)', padding: '18px' }}>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b6477', margin: '0 0 14px' }}>Please respond before the event date.</p>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                <label>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Your full name *</div>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adebayo Johnson" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0' }} />
                </label>

                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                  <label>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Phone / WhatsApp *</div>
                    <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 ..." style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0' }} />
                  </label>
                  <label>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Email *</div>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0' }} />
                  </label>
                </div>

                <label>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Which circle are you joining from? *</div>
                  <select value={circle} onChange={(e) => setCircle(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0' }}>
                    {circleOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Will you be celebrating with us? *</div>
                  <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                    <button
                      type="button"
                      onClick={() => setAttendance('accept')}
                      style={{
                        padding: '11px 12px',
                        borderRadius: '10px',
                        border: attendance === 'accept' ? '2px solid #c9a552' : '1px solid #e6dbc7',
                        backgroundColor: attendance === 'accept' ? '#fffaf0' : '#faf7f0',
                        color: '#2f243e',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      JOYFULLY ACCEPTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendance('decline')}
                      style={{
                        padding: '11px 12px',
                        borderRadius: '10px',
                        border: attendance === 'decline' ? '2px solid #b49764' : '1px solid #e6dbc7',
                        backgroundColor: attendance === 'decline' ? '#fffaf0' : '#faf7f0',
                        color: '#2f243e',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {"SENDS LOVE, CAN'T MAKE IT"}
                    </button>
                  </div>
                </div>

                {!isTicketlessEvent ? (
                  <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    <label>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Ticket type *</div>
                      <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0' }}>
                        {event.ticketTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.name} - N{type.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>Quantity *</div>
                      <input type="number" min="1" max="10" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0' }} />
                    </label>
                  </div>
                ) : null}

                <label>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#665f71', marginBottom: '6px', fontWeight: 700 }}>A message (optional)</div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="A birthday wish, a memory, a blessing..." style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e6dbc7', backgroundColor: '#faf7f0', resize: 'vertical' }} />
                </label>

                {!isTicketlessEvent && (
                  <div style={{ borderRadius: '10px', padding: '10px 12px', backgroundColor: '#fffaf0', color: '#6f581f', border: '1px solid #e8d29c', fontSize: '14px', textAlign: 'center' }}>
                    Estimated ticket total: <strong>N{estimatedTotal.toLocaleString()}</strong>
                  </div>
                )}

                <button type="submit" disabled={submitting} style={{ border: 'none', borderRadius: '999px', padding: '14px', background: 'linear-gradient(90deg, #af8a2f 0%, #d9bb67 100%)', color: '#21163a', fontWeight: 800, cursor: 'pointer' }}>
                  {submitting ? 'Sending response...' : 'Send my response ->'}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: '#23163a', color: '#dfd5ef', padding: '28px 16px 40px', textAlign: 'center' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <p style={{ margin: '0 0 8px', fontSize: '24px', fontFamily: 'Georgia, Times New Roman, serif', color: '#d9bb67' }}>{event.title}</p>
            <p style={{ margin: '0 0 8px', fontSize: '13px' }}>{eventDate.toLocaleDateString()} - {event.venue}</p>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.88 }}>For enquiries, contact your event host.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
