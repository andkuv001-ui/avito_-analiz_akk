import React from 'react';
import { AlertOctagon, AlertTriangle, ArrowRight, Sparkles, Flame, Layers } from 'lucide-react';
import { AvitoListing, ProfileSummary } from '../types/avito';

interface AuditAlertsProps {
  summary: ProfileSummary;
  listings: AvitoListing[];
  onSelectListing: (listing: AvitoListing) => void;
  onFilterByCategory: (category: string) => void;
  onFilterByTier: (tier: string) => void;
}

export const AuditAlerts: React.FC<AuditAlertsProps> = ({
  summary,
  listings,
  onSelectListing,
  onFilterByTier,
}) => {
  const wrongCategoryListing = listings.find(l => l.categoryFull.toLowerCase().includes('одежда'));
  const organicGemListing = listings.find(l => !l.isPromoted && l.viewsTotal > 1000);
  const topTodayListing = [...listings].sort((a, b) => b.viewsToday - a.viewsToday)[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <span>Ключевые инсайты и экспресс-аудит профиля</span>
        </h2>
        <span className="text-xs text-neutral-500">
          Выявлено проблем: {summary.criticalIssuesCount + summary.warningsCount}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Alert 1: Critical Category Mismatch */}
        {wrongCategoryListing && (
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs mb-1">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Критическая ошибка категории</span>
              </div>
              <p className="text-xs text-rose-900/80 leading-relaxed">
                Объявление «{wrongCategoryListing.title.slice(0, 32)}...» попало в <span className="font-semibold underline">Личные вещи / Одежда</span> вместо «Для бизнеса».
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectListing(wrongCategoryListing)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors pt-2 border-t border-rose-200/60"
            >
              <span>Исправить объявление</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Alert 2: Courier Bags Size-Matrix Optimization */}
        {summary.cannibalizationClusters.length > 0 && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-1">
                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Размерная сетка пакетов</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                {summary.cannibalizationClusters[0].count} объявлений под конкретные размеры собирают точный НЧ-трафик. Чтобы повысить CTR, нанесите размер на фото и сфокусируйте бюджет.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFilterByTier('cannibalization')}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors pt-2 border-t border-amber-200/60"
            >
              <span>Открыть сетку размеров ({summary.cannibalizationClusters[0].count} шт.)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Alert 3: Promo Leaks */}
        {summary.promotedZeroViewsCount > 0 && (
          <div className="p-3.5 bg-neutral-100/80 border border-neutral-300 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Слив бюджета продвижения</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                {summary.promotedZeroViewsCount} объявлений с активным статусом «Продвинуто» не получили ни одного просмотра за сегодня.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFilterByTier('promo_leak')}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-neutral-700 transition-colors pt-2 border-t border-neutral-200"
            >
              <span>Отфильтровать неэффективные</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Alert 4: Organic Gem or Top Today */}
        {organicGemListing ? (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Неограненный алмаз (Органика)</span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                «{organicGemListing.title.slice(0, 32)}...» собрало <span className="font-semibold">{organicGemListing.viewsTotal.toLocaleString('ru-RU')}</span> просм. без платных услуг.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectListing(organicGemListing)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors pt-2 border-t border-emerald-200/60"
            >
              <span>Подключить продвижение</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : topTodayListing ? (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-800 font-semibold text-xs mb-1">
                <Flame className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Лидер сегодняшнего дня</span>
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                «{topTodayListing.title.slice(0, 32)}...» генерирует <span className="font-semibold">+{topTodayListing.viewsToday} просм.</span> сегодня.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectListing(topTodayListing)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors pt-2 border-t border-indigo-200/60"
            >
              <span>Открыть карточку</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
