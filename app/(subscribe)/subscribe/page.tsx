import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import SubscribePlansClient from './SubscribePlansClient';

export default async function SubscribePage() {
  const session = await getSession();

  let activePlanId: string | null = null;

  if (session.orgId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('org_id', session.orgId)
      .eq('status', 'active')
      .maybeSingle();

    activePlanId = data?.plan_id ?? null;
  }

  return <SubscribePlansClient activePlanId={activePlanId} />;
}
