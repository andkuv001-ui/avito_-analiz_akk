import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Camera,
  Layers,
} from 'lucide-react';
import { AvitoListing } from '../types/avito';
import { formatNumber, formatPrice } from '../utils/analyzer';

interface ListingDetailModalProps {
  listing: AvitoListing | null;
  onClose: () => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose }) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'audit' | 'description' | 'ai'>('audit');
  const [copiedText, setCopiedText] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  if (!listing) return null;

  const photos = listing.photoUrls || [];
  const currentPhoto = photos[activePhotoIdx] || '';

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(listing.descriptionText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleGenerateAiAudit = async () => {
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'optimize-listing',
          listing: {
            title: listing.title,
            price: listing.price,
            productGroup: listing.productGroup,
            categoryFull: listing.categoryFull,
            viewsTotal: listing.viewsTotal,
            viewsToday: listing.viewsToday,
            paidServices: listing.paidServices,
            photoCount: listing.photoCount,
            descriptionText: listing.descriptionText,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      setAiResult(data.result);
    } catch (e: any) {
      // Heuristic fallback response with instant expert rules
      setAiResult(generateLocalAiFallback(listing));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-4 bg-neutral-50/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-neutral-400 tabular-nums">
                ID: {listing.id}
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-600 font-medium">
                {listing.productGroup}
              </span>
              {listing.isPromoted && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Продвижение активно</span>
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 truncate mt-0.5">
              {listing.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <span>На Авито</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Gallery & Key Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Gallery Column (5 cols) */}
            <div className="md:col-span-5 space-y-2">
              <div className="relative aspect-4/3 bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={listing.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain bg-neutral-950/5"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    Нет фото
                  </div>
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-neutral-900/80 text-white text-[11px] font-mono tabular-nums">
                  {activePhotoIdx + 1} / {photos.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {photos.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                        activePhotoIdx === idx
                          ? 'border-neutral-900 ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-400 opacity-70'
                      }`}
                    >
                      <img src={p} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Metrics & Quick Audit (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 font-medium">Цена в объявл.</span>
                  <div className="text-lg font-bold text-neutral-900 tabular-nums">
                    {formatPrice(listing.price)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 font-medium">Просмотров сегодня</span>
                  <div className="text-lg font-bold text-neutral-900 tabular-nums">
                    {listing.viewsToday > 0 ? (
                      <span className="text-emerald-600">+{listing.viewsToday}</span>
                    ) : (
                      <span className="text-neutral-400">0</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[11px] text-neutral-500 font-medium">Всего просмотров</span>
                  <div className="text-lg font-bold text-neutral-900 tabular-nums">
                    {formatNumber(listing.viewsTotal)}
                  </div>
                </div>
              </div>

              {/* Quality & Category Specs */}
              <div className="p-3.5 bg-white rounded-xl border border-neutral-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Индекс качества SEO & Контента:</span>
                  <span className="font-bold text-neutral-900 tabular-nums">
                    {listing.qualityScore} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      listing.qualityScore >= 80
                        ? 'bg-emerald-600'
                        : listing.qualityScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${listing.qualityScore}%` }}
                  />
                </div>

                <div className="pt-2 text-neutral-600 space-y-1">
                  <div>
                    <span className="text-neutral-400">Категория:</span>{' '}
                    <span className="font-medium text-neutral-800">{listing.categoryFull}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Адрес:</span>{' '}
                    <span className="text-neutral-800">{listing.address || 'Москва'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Фотографий:</span>{' '}
                    <span className="font-semibold text-neutral-800">{listing.photoCount} шт.</span>{' '}
                    <span className="text-neutral-400">({listing.photoCount >= 7 ? 'Хорошо' : 'Рекомендуется добавить до 8-10'})</span>
                  </div>
                </div>
              </div>

              {/* CTA AI Tab Switcher */}
              <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Хотите увеличить конверсию объявления?</span>
                  </h4>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5">
                    Нейросеть сгенерирует оптимизированный заголовок, AIDA-текст и план фото.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ai');
                    if (!aiResult) handleGenerateAiAudit();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Запустить AI
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-neutral-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`pb-2.5 px-3 transition-colors relative ${
                activeTab === 'audit'
                  ? 'text-neutral-900 font-bold border-b-2 border-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <span>Диагностика & Замечания</span>
              {listing.auditIssues.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 text-neutral-700 font-bold">
                  {listing.auditIssues.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`pb-2.5 px-3 transition-colors ${
                activeTab === 'description'
                  ? 'text-neutral-900 font-bold border-b-2 border-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Исходный текст описания
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ai');
                if (!aiResult && !aiLoading) handleGenerateAiAudit();
              }}
              className={`pb-2.5 px-3 transition-colors flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-neutral-500 hover:text-indigo-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Авитолог & Оптимизация</span>
            </button>
          </div>

          {/* Tab 1: Audit & Issues */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {listing.auditIssues.length === 0 ? (
                <div className="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">Замечаний не обнаружено</p>
                  <p className="text-xs text-emerald-800">
                    Объявление качественно заполнено, имеет достаточный объем фотографий и ключевых слов.
                  </p>
                </div>
              ) : (
                listing.auditIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      issue.severity === 'critical'
                        ? 'bg-rose-50/70 border-rose-200'
                        : issue.severity === 'warning'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {issue.severity === 'critical' ? (
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-neutral-900">
                        {issue.title}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed pl-6">
                      {issue.description}
                    </p>
                    <div className="ml-6 p-2.5 bg-white/90 rounded-lg border border-neutral-200/60 text-xs">
                      <span className="font-semibold text-neutral-900">Рекомендация авитолога:</span>{' '}
                      <span className="text-neutral-700">{issue.recommendation}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Raw Description */}
          {activeTab === 'description' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Символов: {listing.descriptionText.length}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDescription}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать текст</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rendered HTML view */}
              <div
                className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs leading-relaxed text-neutral-800 space-y-2 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: listing.descriptionHtml || listing.descriptionText }}
              />
            </div>
          )}

          {/* Tab 3: AI Avitolog Optimizer */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-neutral-600">
                  Генерация персональной стратегии и текстов для карточки «{listing.title}»
                </div>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAiAudit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiLoading ? 'Анализирую...' : 'Сгенерировать заново'}</span>
                </button>
              </div>

              {aiLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-neutral-600 font-medium">
                    Эксперт-авитолог анализирует поисковые запросы, конкурентов и воронку объявления...
                  </p>
                </div>
              ) : aiResult ? (
                <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 text-xs leading-relaxed text-neutral-800">
                  <div className="whitespace-pre-wrap font-sans text-neutral-800 space-y-2">
                    {aiResult}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/60 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Опубликовано: {listing.publishDate}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

function generateLocalAiFallback(listing: AvitoListing): string {
  const isService = listing.itemType === 'service';

  if (isService) {
    return `### 🎯 Экспресс-стратегия авитолога для услуги «${listing.title}»

1. 📝 ТОП-3 ВАРИАНТА ЗАГОЛОВКОВ ПОД ПОИСКОВЫЙ АЛГОРИТМ:
   • ${listing.title} с гарантией по договору
   • ${listing.productGroup} выезд в любой район за 40 мин
   • ${listing.title} без посредников и скрытых наценок

2. 🛠️ СТРУКТУРА ОПИСАНИЯ ДЛЯ МАКСИМАЛЬНОГО ЧИСЛА ЗВОНКОВ:
   - Крючок (1-й абзац): «Срочно требуется ${listing.productGroup.toLowerCase()}? Приеду в день обращения с профессиональным оборудованием!»
   - Перечень работ и понятные цены «от ... ₽».
   - Триггеры надежности: договор, гарантия до 24 месяцев, аккуратность, фиксированная смета без сюрпризов.
   - Призыв к действию: «Позвоните или напишите в чат Авито прямо сейчас — сориентирую по стоимости за 2 минуты!»

3. 📸 ФОТОПЛАН ПОРТФОЛИО:
   - Слайд 1: Контрастное фото мастера / процесса работы + плашка «Выезд за 30 мин / Гарантия».
   - Слайд 2: Реальные примеры выполненных заказов (формат До / После).
   - Слайд 3: Набор профессионального инструмента и сертификаты.
   - Слайд 4: Инфографика с этапами работы и прозрачной оплатой.

4. 💡 РЕКОМЕНДАЦИЯ ПО ПРОДВИЖЕНИЮ:
   - Пик обращений по услугам: будни с 08:30 до 12:00 и с 18:00 до 21:00.
   - В выходные дни высокая конверсия на срочные / аварийные вызовы.`;
  }

  return `### 🎯 Экспресс-стратегия авитолога для товара «${listing.title}»

1. 📝 ТОП-3 ВАРИАНТА ЗАГОЛОВКОВ ПОД ПОИСКОВЫЙ АЛГОРИТМ:
   • ${listing.productGroup} оптом от склада в наличии
   • ${listing.title} с быстрой доставкой и гарантией
   • ${listing.productGroup} опт и розница в наличии

2. 📦 СТРУКТУРА ОПИСАНИЯ ДЛЯ МАКСИМАЛЬНОГО CTR:
   - Крючок (1-й абзац): «Ищете надежного поставщика без переплат? Отгружаем в день заказа со склада!»
   - Четкие параметры, размерный ряд, варианты фасовки/комплектации и цены.
   - Выгоды: УПД/чек, безнал и нал, отправка ТК, СДЭК, Яндекс Доставка, самовывоз.
   - Призыв к действию: «Напишите прямо сейчас в чат Авито — рассчитаем стоимость и забронируем наличие!»

3. 📸 ФОТОПЛАН:
   - Слайд 1: Товар крупно на нейтральном фоне + ключевое УТП/размер плашкой.
   - Слайд 2: Инфографика с характеристиками и преимуществами.
   - Слайд 3: Фото реального товара в руках или на складе (подтверждение оригинальности/качества).
   - Слайд 4: Условия доставки и самовывоза.

4. 💡 РЕКОМЕНДАЦИЯ ПО ПРОДВИЖЕНИЮ:
   - Пик спроса: вторник - четверг с 09:30 до 16:00.
   - Подключайте продвижение «х5» утром в рабочие часы для оптовых и розничных закупщиков.`;
}
