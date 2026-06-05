import { supabase } from '@/lib/supabaseClient';
import { Metadata } from 'next';

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

// 1. Dynamically fetch tournament data for Server-Side Meta Tags
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name, sport, location, description, banner_url')
    .eq('id', params.id)
    .single();

  if (!tournament) return { title: 'Tournament Not Found' };

  return {
    title: `${tournament.name} | ${tournament.sport} Tournament`,
    description: tournament.description || `Join the ${tournament.name} ${tournament.sport} tournament in ${tournament.location}.`,
    openGraph: {
      title: tournament.name,
      description: `Live brackets, teams, and scores for ${tournament.name}.`,
      images: tournament.banner_url ? [{ url: tournament.banner_url }] : [],
    },
  };
}

export default async function TournamentLayout({ params, children }: Props) {
  // 2. Fetch Deep Data for AI Schema (JSON-LD)
  const { data: t } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', params.id)
    .single();

  // The 'SportsEvent' schema makes this highly indexable by Google Events and AI engines
  const eventSchema = t ? {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: t.name,
    sport: t.sport,
    startDate: t.start_date,
    endDate: t.end_date,
    location: {
      '@type': 'Place',
      name: t.location,
      address: t.location
    },
    offers: {
      '@type': 'Offer',
      price: t.entry_fee || '0',
      priceCurrency: t.currency || 'USD'
    },
    description: t.description || `Official page for ${t.name}.`
  } : null;

  return (
    <>
      {eventSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />
      )}
      {children}
    </>
  );
}