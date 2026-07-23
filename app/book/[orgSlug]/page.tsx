import { supabase } from '@/lib/supabase';
import PublicBookingFlow from './PublicBookingFlow';

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function BookingPage({ params }: PageProps) {
  const { orgSlug } = await params;

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .maybeSingle();

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500">This booking page does not exist.</p>
        </div>
      </div>
    );
  }

  const { data: allServices } = await supabase
    .from('services')
    .select('*')
    .eq('org_id', org.id);

  return (
    <PublicBookingFlow
      org={{ name: org.name, slug: org.slug }}
      services={allServices ?? []}
    />
  );
}
