'use client';

import { useState } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface SearchFilters {
  text: string;
  storeName: string;
  category: string;
  minAmount: number | null;
  maxAmount: number | null;
  startDate: string;
  endDate: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClear: () => void;
  categories: string[];
}

export default function SearchFilters({ 
  filters, 
  onFiltersChange, 
  onClear, 
  categories 
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof SearchFilters, value: string | number | null) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      {/* 기본 검색 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="영수증 내용 검색..."
            value={filters.text}
            onChange={(e) => handleInputChange('text', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 ${isExpanded ? 'bg-blue-50 text-blue-600' : ''}`}
        >
          <Filter className="h-4 w-4" />
          고급 필터
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClear}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            초기화
          </Button>
        )}
      </div>

      {/* 고급 필터 */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
          {/* 가게명 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              가게명
            </label>
            <input
              type="text"
              placeholder="가게명 입력..."
              value={filters.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 금액 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              금액 범위
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="최소"
                value={filters.minAmount || ''}
                onChange={(e) => handleInputChange('minAmount', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="flex items-center text-gray-500">~</span>
              <input
                type="number"
                placeholder="최대"
                value={filters.maxAmount || ''}
                onChange={(e) => handleInputChange('maxAmount', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작 날짜
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료 날짜
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">활성 필터:</span>
            {filters.text && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                텍스트: {filters.text}
                <button
                  onClick={() => handleInputChange('text', '')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.storeName && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                가게: {filters.storeName}
                <button
                  onClick={() => handleInputChange('storeName', '')}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                카테고리: {filters.category}
                <button
                  onClick={() => handleInputChange('category', '')}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                금액: {filters.minAmount || 0}원 ~ {filters.maxAmount || '∞'}원
                <button
                  onClick={() => {
                    handleInputChange('minAmount', null);
                    handleInputChange('maxAmount', null);
                  }}
                  className="ml-1 hover:text-yellow-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                기간: {filters.startDate || '∞'} ~ {filters.endDate || '∞'}
                <button
                  onClick={() => {
                    handleInputChange('startDate', '');
                    handleInputChange('endDate', '');
                  }}
                  className="ml-1 hover:text-indigo-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}