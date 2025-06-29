import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOverallMonthlyStats } from '@/lib/api/receipts';
import { getCurrentUser } from '@/lib/api/server-auth';
import MonthlyReport from '@/components/MonthlyReport';
import Loading from '@/components/ui/Loading';

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <a href="/login" className="text-blue-600 hover:underline">
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">월별 리포트</h1>
        <p className="text-slate-600">지출 패턴을 분석하고 월별 통계를 확인하세요</p>
      </div>

      <Suspense fallback={<Loading />}>
        <MonthlyReportData userId={user.id} />
      </Suspense>
    </div>
  );
}

async function MonthlyReportData({ userId }: { userId: string }) {
  const monthlyStats = await getOverallMonthlyStats(userId);

  return <MonthlyReport monthlyStats={monthlyStats} />;
}