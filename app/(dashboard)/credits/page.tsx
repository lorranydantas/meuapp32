import { CreditDashboard } from '@/components/credits/credit-components';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function CreditsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser(user.id);
  if (!team) {
    throw new Error('Team not found');
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Credit Management</h1>
      <CreditDashboard teamId={team.id} />
    </div>
  );
}
