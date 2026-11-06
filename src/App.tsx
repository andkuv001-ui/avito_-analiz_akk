import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewMetrics } from './components/OverviewMetrics';
import { AuditAlerts } from './components/AuditAlerts';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { ListingsTable } from './components/ListingsTable';
import { ListingDetailModal } from './components/ListingDetailModal';
import { ActionTasksView } from './components/ActionTasksView';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { AiProfileModal } from './components/AiProfileModal';
import { parseAvitoCsv } from './utils/csvParser';
import { analyzeProfile, generateActionTasks, formatNumber, formatPrice } from './utils/analyzer';
import { fetchDefaultCsv } from './data/fallbackCsv';
import { PRESETS } from './data/presetProfiles';
import { AvitoListing, ActionTask } from './types/avito';
import { Sparkles, ArrowRight, Layers } from 'lucide-react';

export default function App() {
  const [rawCsv, setRawCsv] = useState<string>('');
  const [listings, setListings] = useState<AvitoListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<AvitoListing | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'categories' | 'tasks'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('packaging');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);

  // Initialize data
  useEffect(() => {
    async function init() {
      const csvText = await fetchDefaultCsv();
      setRawCsv(csvText);
      const parsed = parseAvitoCsv(csvText);
      setListings(parsed);

      const summary = analyzeProfile(parsed);
      const generatedTasks = generateActionTasks(parsed, summary);

      // Restore completed tasks from localStorage
      const savedTasksJson = localStorage.getItem('avito_pulse_tasks');
      if (savedTasksJson) {
        try {
          const saved: Record<string, boolean> = JSON.parse(savedTasksJson);
          generatedTasks.forEach(t => {
            if (saved[t.id]) t.completed = true;
          });
        } catch (e) {
          console.warn('Failed to parse saved tasks', e);
        }
      }

      setTasks(generatedTasks);
    }
    init();
  }, []);

  const summary = React.useMemo(() => analyzeProfile(listings), [listings]);

  const handleCsvLoaded = (newCsvText: string, presetId = 'custom') => {
    setRawCsv(newCsvText);
    const parsed = parseAvitoCsv(newCsvText);
    setListings(parsed);
    const newSummary = analyzeProfile(parsed);
    setTasks(generateActionTasks(parsed, newSummary));
    setSelectedCategory(null);
    setTierFilter(null);
    setActivePresetId(presetId);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      handleCsvLoaded(preset.csvData, preset.id);
    }
  };

  const handleReloadDefault = async () => {
    const csvText = await fetchDefaultCsv();
    handleCsvLoaded(csvText, 'packaging');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      const savedMap: Record<string, boolean> = {};
      updated.forEach((t) => {
        if (t.completed) savedMap[t.id] = true;
      });
      localStorage.setItem('avito_pulse_tasks', JSON.stringify(savedMap));
      return updated;
    });
  };

  const handleFilterByTaskListingIds = (_ids: string[]) => {
    setActiveTab('listings');
    setSelectedCategory(null);
    setTierFilter(null);
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      setActiveTab('listings');
    }
  };

  const handleTierFilterClick = (tier: string) => {
    setTierFilter(tier);
    setActiveTab('listings');
  };

  const isService = summary.businessType === 'services';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* 3-Zone Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sellerName={summary.sellerName}
        businessTypeLabel={summary.businessTypeLabel}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAiSummary={() => setIsAiSummaryOpen(true)}
        criticalIssuesCount={summary.criticalIssuesCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Strip */}
            <OverviewMetrics
              summary={summary}
              onFilterClick={handleTierFilterClick}
            />

            {/* Critical Audits & High-Priority Alerts */}
            <AuditAlerts
              summary={summary}
              listings={listings}
              onSelectListing={setSelectedListing}
              onFilterByCategory={handleCategorySelect}
              onFilterByTier={handleTierFilterClick}
            />

            {/* Split Row: Category Distribution & Top 5 Locomotives */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Categories (7 cols) */}
              <div className="lg:col-span-7">
                <CategoryBreakdown
                  categories={summary.categoryBreakdown}
                  onSelectCategory={handleCategorySelect}
                  selectedCategory={selectedCategory}
                />
              </div>

              {/* Top 5 Locomotives (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                      🚀 Топ-5 лидеров по просмотрам
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Флагманские позиции, приносящие основной поток заявок
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTierFilter('locomotive');
                      setActiveTab('listings');
                    }}
                    className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 inline-flex items-center gap-1"
                  >
                    <span>Все хиты</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {summary.topListings.map((item, idx) => {
                    const firstPhoto = item.photoUrls[0];
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedListing(item)}
                        className="p-2.5 rounded-lg border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50/70 transition-all cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-md bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                          {firstPhoto ? (
                            <img
                              src={firstPhoto}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                              #{idx + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            <span className="font-semibold text-neutral-800 tabular-nums">
                              {formatPrice(item.price)}
                            </span>
                            <span>·</span>
                            <span>{item.productGroup}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-neutral-900 tabular-nums">
                            {formatNumber(item.viewsTotal)}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold tabular-nums">
                            {item.viewsToday > 0 ? `+${item.viewsToday} сег.` : '0 сег.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Action Plan Banner */}
            <div className="p-5 bg-neutral-900 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                    Рекомендации авитолога
                  </span>
                </div>
                <h3 className="text-base font-bold">
                  Сформирован план из {tasks.length} шагов по оптимизации воронки {isService ? 'услуг' : 'товаров'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  {isService
                    ? 'Анализ доверия (договоры, гарантия, живые фото объектов), перераспределение платных услуг на пиковые рабочие часы и устранение неэффективных карточек.'
                    : 'Оценка категорий и тарифов (CPC против услуг), A/B тестирование чистых живых фотографий против инфографики и концентрация платного продвижения на ходовых позициях.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                >
                  Открыть чеклист задач
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings Table Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <ListingsTable
              listings={listings}
              onSelectListing={setSelectedListing}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              tierFilter={tierFilter}
              setTierFilter={setTierFilter}
            />
          </div>
        )}

        {/* Categories & Niches Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <CategoryBreakdown
              categories={summary.categoryBreakdown}
              onSelectCategory={handleCategorySelect}
              selectedCategory={selectedCategory}
            />

            {/* Assortment Strategy Insight Card */}
            <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-800" />
                <span>Сравнение двух стратегий публикации на Авито ({summary.businessTypeLabel})</span>
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                На Авито в сфере {summary.businessTypeLabel.toLowerCase()} применяются две ключевые модели публикации:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1.5">
                  <h4 className="font-bold text-neutral-900">
                    🏆 Стратегия 1: Флагман с полным прайс-листом
                  </h4>
                  <p className="text-neutral-700 leading-relaxed">
                    {isService
                      ? `Одно сильное объявление с общим позиционированием (по направлению «${summary.categoryBreakdown[0]?.group || 'Ключевая услуга'}») и полным перечнем работ/прайсом внутри. Концентрирует отзывы, рейтинг и поведенческие факторы в одной карточке, забирая высокочастотный спрос.`
                      : `Одно мощное объявление под ключевую категорию («${summary.categoryBreakdown[0]?.group || 'Основное'}») с полным прайс-листом внутри. Концентрирует отзывы, избранное и поведенческие факторы в одной карточке, забирая высокочастотный спрос.`}
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1.5">
                  <h4 className="font-bold text-neutral-900">
                    🎯 Стратегия 2: Точечный охват поисковой выдачи
                  </h4>
                  <p className="text-neutral-700 leading-relaxed">
                    {isService
                      ? `Отдельные карточки под конкретные узкие направления, марки/модели или районы ${summary.cannibalizationClusters[0] ? `(как в группе «${summary.cannibalizationClusters[0].titlePattern.replace(/\s*\(\d+\s*позиций\)/, '')}»)` : ''}. Практика доказывает: эта стратегия собирает суммарно больше целевого трафика по точным поисковым запросам.`
                      : `Отдельные объявления под конкретные модификации, параметры или размеры ${summary.cannibalizationClusters[0] ? `(как в группе «${summary.cannibalizationClusters[0].titlePattern.replace(/\s*\(\d+\s*позиций\)/, '')}»)` : ''}. Практика доказывает: эта стратегия собирает суммарно больше целевого трафика по точным низкочастотным запросам.`}
                  </p>
                  <div className="pt-2 mt-1 border-t border-neutral-200/70 text-neutral-800 space-y-1">
                    <div>
                      <span className="font-semibold text-neutral-900">📷 Визуал и конверсия:</span> чистые, естественные живые фотографии реального процесса работы, оборудования, помещения или готового результата без визуального шума часто вызывают максимальное доверие клиентов и конвертируют лучше перегруженной инфографики.
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900">💡 Рекомендация авитолога:</span> проверить гипотезу о параллельном создании одного флагманского мастер-объявления (со сводным прайсом) и направить на него тестовый рекламный бюджет, чтобы на реальных цифрах за 14 дней сравнить стоимость лида (CPL) и объём входящих звонков по сравнению с распределенной сеткой объявлений.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <ActionTasksView
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onFilterByListingIds={handleFilterByTaskListingIds}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} АвитоПульс · Универсальный аналитический комплекс для товаров и услуг на Авито</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReloadDefault}
              className="hover:text-neutral-900 transition-colors"
            >
              Исходные данные
            </button>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="hover:text-neutral-900 transition-colors"
            >
              Экспорт отчета
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ListingDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCsvLoaded={(csv) => handleCsvLoaded(csv, 'custom')}
        onReloadDefault={handleReloadDefault}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        summary={summary}
        listings={listings}
        tasks={tasks}
      />

      <AiProfileModal
        isOpen={isAiSummaryOpen}
        onClose={() => setIsAiSummaryOpen(false)}
        summary={summary}
        listings={listings}
      />
    </div>
  );
}
