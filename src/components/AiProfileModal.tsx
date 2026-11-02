import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { ProfileSummary, AvitoListing } from '../types/avito';
import { formatNumber } from '../utils/analyzer';

interface AiProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ProfileSummary;
  listings: AvitoListing[];
}

export const AiProfileModal: React.FC<AiProfileModalProps> = ({
  isOpen,
  onClose,
  summary,
  listings,
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !report && !loading) {
      handleGenerate();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'profile-audit',
          profileSummary: {
            totalListings: summary.totalListings,
            totalViews: summary.totalViews,
            viewsToday: summary.viewsToday,
            promoPercentage: summary.promoPercentage,
            promotedZeroViewsCount: summary.promotedZeroViewsCount,
            topLocomotiveViewsShare: summary.topLocomotiveViewsShare,
            categories: summary.categoryBreakdown.map(c => ({
              group: c.group,
              count: c.count,
              views: c.totalViews,
              share: c.viewsShare,
            })),
          },
        }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setReport(data.result);
    } catch {
      setReport(generateExecutiveStrategyFallback(summary));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                AI Аудит стратегии: {summary.sellerName}
              </h3>
              <p className="text-xs text-neutral-500">
                Комплексная оценка конверсионной воронки ({summary.businessTypeLabel}) и оптимизации бюджета
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs leading-relaxed text-neutral-800 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-600 font-semibold">
                Нейросеть рассчитывает воронку, анализирует эффективность продвижения и формирует стратегию...
              </p>
            </div>
          ) : report ? (
            <div className="whitespace-pre-wrap font-sans text-neutral-800 bg-neutral-50 p-5 rounded-xl border border-neutral-200">
              {report}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/60 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Пересчитать аудит</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!report}
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать стратегию</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateExecutiveStrategyFallback(summary: ProfileSummary): string {
  const isServices = summary.businessType === 'services';

  if (isServices) {
    return `### 📈 СТРАТЕГИЧЕСКИЙ АУДИТ ПРОФИЛЯ УСЛУГ «${summary.sellerName}»

1. ДИНАМИКА ТРАФИКА И КОНВЕРСИИ В ЗВОНКИ:
• Всего активных предложений: ${summary.totalListings} шт., суммарно просмотров: ${formatNumber(summary.totalViews)}.
• Сегодня получено: +${summary.viewsToday} просмотров.
• Топ-3 направления аккумулируют ${summary.topLocomotiveViewsShare}% трафика.

2. ЭФФЕКТИВНОСТЬ ПЛАТНОГО ПРОДВИЖЕНИЯ (VAS):
• Продвигается: ${summary.promotedCount} из ${summary.totalListings} позиций (${summary.promoPercentage}%).
• Спящих услуг с активным продвижением: ${summary.promotedZeroViewsCount} шт. (тратят баланс без отдачи).
• Рекомендация: перенастроить время запуска услуг на утренние часы (08:30 - 11:30) и вечер (18:00 - 21:00), когда клиенты заказывают выезд мастеров на дом и объекты.

3. ПОРТФОЛИО И ТРИГГЕРЫ ДОВЕРИЯ:
• Главный фактор конверсии в услугах — визуальное подтверждение мастерства.
• Добавьте на обложки плашки: «Выезд от 30 мин», «Официальный договор и гарантия до 2 лет», «Без предоплаты».
• На каждом объявлении должно быть не менее 6–8 фото реальных объектов (до и после).

4. СТРАТЕГИЯ ГЕО- И МОДЕЛЬНОЙ СЕТКИ:
• Отдельные объявления под районы или конкретные бренды техники/материалов собирают целевые низкочастотные запросы.
• Параллельно рекомендуется протестировать одно генеральное объявление-флагман («под ключ») для аккумулирования отзывов.`;
  }

  return `### 📈 СТРАТЕГИЧЕСКИЙ АУДИТ ТОВАРНОГО ПРОФИЛЯ «${summary.sellerName}»

1. СТРУКТУРА ТРАФИКА И ВЫЯВЛЕННЫЕ ДИСБАЛАНСЫ:
• Всего объявлений: ${summary.totalListings} шт., просмотров: ${formatNumber(summary.totalViews)}.
• Топ-3 локомотива дают ${summary.topLocomotiveViewsShare}% всего трафика магазина.
• Выявлено ${summary.promotedZeroViewsCount} позиций с активным продвижением без единого просмотра за сегодня.

2. СЛИВ БЮДЖЕТА НА ПРОДВИЖЕНИЕ (VAS):
• Снимите продвижение с низкомаржинальных или микро-позиций, где спрос редкий.
• Сфокусируйте платный бюджет на топ-локомотивах, обеспечивающих оптовые отгрузки и высокий средний чек.

3. СТРАТЕГИЯ РАЗМЕРНОЙ / МОДЕЛЬНОЙ СЕТКИ (НЧ-ОХВАТ):
• Наличие отдельных карточек под каждый размер/модель доказано собирает больше целевого трафика по точным запросам.
• Для максимальной конверсии:
  1) Нанесите крупно и контрастно размер/модель на 1-е фото.
  2) Продвигайте платно только 2–3 самых ходовых позиции, остальные держите на бесплатной органике.
  3) Добавьте в текст перелинковку на всю линейку каталога.
  4) Протестируйте гипотезу создания одного общего мастер-объявления со сводным прайсом для замера CPL.

4. РЕКОМЕНДУЕМЫЙ ГРАФИК ПРОДВИЖЕНИЯ:
• Вторник и Четверг: Пик закупок. Запуск максимального буста с 09:30.
• Выходные: Минимизация платных услуг для снижения стоимости лида.`;
}
