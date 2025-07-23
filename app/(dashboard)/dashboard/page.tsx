import { redirect } from 'next/navigation';
import { Settings } from './settings';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { CreditBalance } from '@/components/credits/credit-components';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <CreditBalance teamId={teamData.id} />
        </div>
        <div className="md:col-span-2">
          <Settings teamData={teamData} />
        </div>
      </div>
    </div>
  );
}
