import { redirect } from 'next/navigation'
import { getCurrentUserOnServer } from '@/lib/api/server-auth'
import ReceiptsDashboard from '@/components/ReceiptsDashboard'

export default async function Home() {
  const user = await getCurrentUserOnServer();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container py-8">
      <ReceiptsDashboard user={user} />
    </div>
  );
}
