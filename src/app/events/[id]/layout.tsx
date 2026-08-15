import type { Metadata } from 'next';
import { getEventById, getEventByShareSlug } from '@/lib/event-ticket-store';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = (await getEventById(id)) || (await getEventByShareSlug(id));

  if (!event) {
    return {
      title: 'Event Invitation',
      description: 'View and RSVP to this event invitation.',
    };
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/events/${event.shareSlug || event.id}`;
  const imageUrl = event.image || '/icons/mastercard.png';
  const description = event.invitationMessage || event.description;

  return {
    title: event.title,
    description,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title: event.title,
      description,
      url: shareUrl,
      siteName: 'VGC Pay',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [imageUrl],
    },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
