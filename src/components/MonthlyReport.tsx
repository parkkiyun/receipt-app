'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyStats } from '@/types';
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';

interface MonthlyReportProps {
  monthlyStats: MonthlyStats[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export default function MonthlyReport({ monthlyStats }: MonthlyReportProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'all'>('6m');

  const filteredData = monthlyStats.slice(0, selectedPeriod === '6m' ? 6 : selectedPeriod === '12m' ? 12 : monthlyStats.length);
  
  const totalAmount = filteredData.reduce((sum, stat) => sum + stat.total_amount, 0);
  const totalCount = filteredData.reduce((sum, stat) => sum + stat.receipt_count, 0);
  const avgMonthly = filteredData.length > 0 ? totalAmount / filteredData.length : 0;

  // 카테고리별 데이터 처리
  const categoryData = filteredData.reduce((acc, stat) => {
    stat.categories.forEach(cat => {
      if (acc[cat.category]) {
        acc[cat.category] += cat.amount;
      } else {
        acc[cat.category] = cat.amount;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).map(([category, amount]) => ({
    name: category || '기타',
    value: amount,
  }));

  // 월별 트렌드
  const trend = filteredData.length >= 2 
    ? filteredData[0].total_amount - filteredData[1].total_amount 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  const handleExportPDF = () => {
    // PDF 내보내기 기능 구현
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">총 지출</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">총 영수증</p>
              <p className="text-2xl font-bold text-slate-800">{totalCount}개</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">월평균</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(avgMonthly)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">월별 변화</p>
              <p className={`text-2xl font-bold ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {trend >= 0 ? '+' : ''}{formatCurrency(trend)}
              </p>
            </div>
            {trend >= 0 ? (
              <TrendingUp className="h-8 w-8 text-red-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* 기간 선택 및 내보내기 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('6m')}
            className={`px-4 py-2 rounded-lg ${
              selectedPeriod === '6m' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 border hover:bg-slate-50'
            }`}
          >
            최근 6개월
          </button>
          <button
            onClick={() => setSelectedPeriod('12m')}
            className={`px-4 py-2 rounded-lg ${
              selectedPeriod === '12m' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 border hover:bg-slate-50'
            }`}
          >
            최근 12개월
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg ${
              selectedPeriod === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 border hover:bg-slate-50'
            }`}
          >
            전체
          </button>
        </div>

        <Button
          onClick={handleExportPDF}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          PDF 내보내기
        </Button>
      </div>

      {/* 월별 지출 트렌드 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">월별 지출 트렌드</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData.slice().reverse()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만원`} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '지출액']}
              labelFormatter={(label) => `${label}월`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total_amount" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="지출액"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 카테고리별 지출 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파이 차트 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">카테고리별 지출 비율</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 바 차트 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">카테고리별 지출 금액</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pieData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만원`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 월별 상세 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">월별 상세 내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  월
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  영수증 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  총 지출
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  평균 지출
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  주요 카테고리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredData.map((stat) => (
                <tr key={stat.month} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {stat.month}월
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {stat.receipt_count}개
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatCurrency(stat.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatCurrency(stat.receipt_count > 0 ? stat.total_amount / stat.receipt_count : 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {stat.categories.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {stat.categories[0].category || '기타'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}