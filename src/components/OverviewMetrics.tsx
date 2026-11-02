import React from 'react';
import { Eye, TrendingUp, Zap, AlertCircle, ShoppingBag, Award } from 'lucide-react';
import { ProfileSummary } from '../types/avito';
import { formatNumber } from '../utils/analyzer';

interface OverviewMetricsProps {
  summary: ProfileSummary;
  onFilterClick?: (filterType: string) => void;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ summary, onFilterClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Metric 1: Total Listings */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-medium">Активных объявлений</span>
          <ShoppingBag className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {summary.totalListings}
          </span>
          <span className="text-xs text-neutral-500">позиций</span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
          <span>{summary.promotedCount} с продвижением</span>
          <span>·</span>
          <span>{summary.organicCount} органика</span>
        </div>
      </div>

      {/* Metric 2: Total Views */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-medium">Всего просмотров</span>
          <Eye className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {formatNumber(summary.totalViews)}
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500">
          Среднее: <span className="font-semibold text-neutral-700 tabular-nums">{formatNumber(summary.avgViewsPerListing)}</span> / объявление
        </div>
      </div>

      {/* Metric 3: Views Today */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-medium">Просмотров сегодня</span>
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
            +{formatNumber(summary.viewsToday)}
          </span>
          <span className="text-xs text-neutral-500">визитов</span>
        </div>
        <div className="mt-2 text-xs text-neutral-500">
          Активность за текущие сутки
        </div>
      </div>

      {/* Metric 4: Promotion Share */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-medium">Доля продвижения</span>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {summary.promoPercentage}%
          </span>
          <span className="text-xs text-neutral-500">каталога</span>
        </div>
        <div className="mt-2 text-xs text-neutral-500">
          {summary.promotedCount} из {summary.totalListings} используют VAS
        </div>
      </div>

      {/* Metric 5: Promo Leak (Zero views today) */}
      <div
        onClick={() => onFilterClick?.('promo_leak')}
        className="p-4 bg-white rounded-xl border border-neutral-200 cursor-pointer hover:border-amber-300 transition-colors"
      >
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-medium text-amber-900">Слив продвижения</span>
          <AlertCircle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
            {summary.promotedZeroViewsCount}
          </span>
          <span className="text-xs text-amber-700">объявлений</span>
        </div>
        <div className="mt-2 text-xs text-amber-800">
          Продвинуто, но 0 просмотров сегодня
        </div>
      </div>

      {/* Metric 6: Top 3 Locomotives Share */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-medium">Флагманы трафика</span>
          <Award className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {summary.topLocomotiveViewsShare}%
          </span>
          <span className="text-xs text-neutral-500">всех показов</span>
        </div>
        <div className="mt-2 text-xs text-neutral-500">
          Сгенерировано топ-3 товарами
        </div>
      </div>
    </div>
  );
};
