import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  Zap,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { AvitoListing, PerformanceTier } from '../types/avito';
import { formatNumber, formatPrice } from '../utils/analyzer';

interface ListingsTableProps {
  listings: AvitoListing[];
  onSelectListing: (listing: AvitoListing) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  tierFilter: string | null;
  setTierFilter: (tier: string | null) => void;
}

type SortField = 'viewsTotal' | 'viewsToday' | 'price' | 'photoCount' | 'qualityScore' | 'title';
type SortOrder = 'asc' | 'desc';

export const ListingsTable: React.FC<ListingsTableProps> = ({
  listings,
  onSelectListing,
  selectedCategory,
  onSelectCategory,
  tierFilter,
  setTierFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [promoFilter, setPromoFilter] = useState<'all' | 'promoted' | 'organic'>('all');
  const [issueFilter, setIssueFilter] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('viewsTotal');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter & Search
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchId = item.id.includes(q);
        const matchCategory = item.categoryFull.toLowerCase().includes(q);
        const matchGroup = item.productGroup.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchCategory && !matchGroup) {
          return false;
        }
      }

      // Category
      if (selectedCategory && item.productGroup !== selectedCategory) {
        return false;
      }

      // Promo
      if (promoFilter === 'promoted' && !item.isPromoted) return false;
      if (promoFilter === 'organic' && item.isPromoted) return false;

      // Tier filter
      if (tierFilter) {
        if (tierFilter === 'promo_leak') {
          if (!(item.isPromoted && item.viewsToday === 0 && item.viewsTotal > 20)) return false;
        } else if (tierFilter === 'cannibalization') {
          const inCluster = item.auditIssues.some(i => i.category === 'cannibalization');
          if (!inCluster) return false;
        } else if (tierFilter === 'locomotive') {
          if (item.viewsTotal < 2000) return false;
        } else if (tierFilter === 'organic_gem') {
          if (!(!item.isPromoted && item.viewsTotal > 800)) return false;
        } else if (tierFilter === 'sleeping') {
          if (item.viewsTotal >= 100) return false;
        }
      }

      // Issues only
      if (issueFilter && item.auditIssues.length === 0) {
        return false;
      }

      return true;
    });
  }, [listings, searchQuery, selectedCategory, promoFilter, tierFilter, issueFilter]);

  // Sort
  const sortedListings = useMemo(() => {
    const list = [...filteredListings];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'title') {
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredListings, sortField, sortOrder]);

  const maxTotalViews = useMemo(() => {
    return Math.max(...listings.map(l => l.viewsTotal), 1);
  }, [listings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.productGroup) set.add(l.productGroup);
    });
    return Array.from(set).sort();
  }, [listings]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, номеру ID или категории..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats Counter */}
          <div className="text-xs text-neutral-500 whitespace-nowrap self-end sm:self-auto flex items-center gap-2">
            <span>Показано: <strong className="text-neutral-900 tabular-nums">{sortedListings.length}</strong> из {listings.length} объявлений</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedCategory || ''}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="py-1 px-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              <option value="">Все категории ({listings.length})</option>
              {dynamicCategories.map((g) => {
                const count = listings.filter(l => l.productGroup === g).length;
                return (
                  <option key={g} value={g}>
                    {g} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Promo Segmented Control */}
          <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setPromoFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                promoFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setPromoFilter('promoted')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                promoFilter === 'promoted'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Продвинуто</span>
            </button>
            <button
              type="button"
              onClick={() => setPromoFilter('organic')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                promoFilter === 'organic'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Органика
            </button>
          </div>

          {/* Tier Quick Filter Buttons */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTierFilter(tierFilter === 'locomotive' ? null : 'locomotive')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                tierFilter === 'locomotive'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              🚀 Хиты (&gt;2k)
            </button>
            <button
              type="button"
              onClick={() => setTierFilter(tierFilter === 'promo_leak' ? null : 'promo_leak')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                tierFilter === 'promo_leak'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              ⚠️ Слив продвижения
            </button>
            {listings.some(l => l.auditIssues.some(i => i.category === 'cannibalization')) && (
              <button
                type="button"
                onClick={() => setTierFilter(tierFilter === 'cannibalization' ? null : 'cannibalization')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  tierFilter === 'cannibalization'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                Модельный ряд / сетка
              </button>
            )}
          </div>

          {/* Issue Only Toggle */}
          <button
            type="button"
            onClick={() => setIssueFilter(!issueFilter)}
            className={`ml-auto px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
              issueFilter
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <AlertTriangle className={`w-3 h-3 ${issueFilter ? 'text-rose-600' : 'text-neutral-400'}`} />
            <span>Только с замечаниями</span>
          </button>

          {(tierFilter || selectedCategory || searchQuery || promoFilter !== 'all' || issueFilter) && (
            <button
              type="button"
              onClick={() => {
                setTierFilter(null);
                onSelectCategory('');
                setSearchQuery('');
                setPromoFilter('all');
                setIssueFilter(false);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline px-1"
            >
              Сбросить все
            </button>
          )}
        </div>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold select-none">
              <th className="py-3 px-3 w-14 text-center">Фото</th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  <span>Объявление</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Категория</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Цена</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Услуги</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('viewsToday')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Сегодня</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('viewsTotal')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Всего просмотров</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-neutral-900"
                onClick={() => handleSort('qualityScore')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>SEO Индекс</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/70">
            {sortedListings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-semibold text-neutral-800">Объявлений не найдено</p>
                    <p className="text-xs text-neutral-500">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedListings.map((item) => {
                const hasCritical = item.auditIssues.some(i => i.severity === 'critical');
                const hasWarning = item.auditIssues.some(i => i.severity === 'warning');
                const firstPhoto = item.photoUrls[0];
                const viewRatio = (item.viewsTotal / maxTotalViews) * 100;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/80 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <td className="py-2.5 px-3 text-center">
                      <div
                        onClick={() => onSelectListing(item)}
                        className="relative w-11 h-11 rounded-lg bg-neutral-100 overflow-hidden cursor-pointer border border-neutral-200/80 mx-auto group-hover:border-neutral-400 transition-colors"
                      >
                        {firstPhoto ? (
                          <img
                            src={firstPhoto}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // CSS fallback container on error
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-neutral-900/80 text-[9px] text-white px-1 py-0.2 rounded-tl font-mono tabular-nums">
                          {item.photoCount}
                        </span>
                      </div>
                    </td>

                    {/* Title & ID */}
                    <td className="py-2.5 px-3 max-w-xs md:max-w-md">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectListing(item)}
                            className="font-semibold text-neutral-900 hover:text-indigo-600 text-left transition-colors line-clamp-1"
                          >
                            {item.title}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-neutral-700 shrink-0"
                            title="Открыть на Avito"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Unboxed metadata line with typographic separators */}
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <span className="font-mono text-neutral-400 tabular-nums">ID {item.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.publishDate}</span>
                          {item.auditIssues.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className={`inline-flex items-center gap-0.5 font-medium ${
                                hasCritical ? 'text-rose-600' : hasWarning ? 'text-amber-600' : 'text-neutral-500'
                              }`}>
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>{item.auditIssues.length} зам.</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-neutral-800 font-medium">{item.productGroup}</span>
                        <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">
                          {item.category3 || item.category2}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums font-semibold text-neutral-900">
                      {formatPrice(item.price)}
                    </td>

                    {/* Paid Service */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {item.isPromoted ? (
                        <div className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Продвинуто</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-normal">Органика</span>
                      )}
                    </td>

                    {/* Views Today */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                      {item.viewsToday > 0 ? (
                        <span className="font-bold text-emerald-600">+{item.viewsToday}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>

                    {/* Views Total + Progress Meter */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-bold text-neutral-900 tabular-nums">
                          {formatNumber(item.viewsTotal)}
                        </div>
                        <div className="w-20 ml-auto h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.viewsTotal > 2000
                                ? 'bg-indigo-600'
                                : item.viewsTotal > 400
                                ? 'bg-neutral-800'
                                : 'bg-neutral-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, viewRatio))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Quality Score */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className={`tabular-nums font-bold ${
                          item.qualityScore >= 80
                            ? 'text-emerald-700'
                            : item.qualityScore >= 60
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}>
                          {item.qualityScore}
                        </span>
                        <span className="text-[9px] text-neutral-400">из 100</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectListing(item)}
                          className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                        >
                          Аудит
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectListing(item)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Оптимизировать через AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
