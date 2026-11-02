import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  FileDown,
} from 'lucide-react';
import { ActionTask, AvitoListing, ProfileSummary } from '../types/avito';
import { formatNumber, formatPrice } from '../utils/analyzer';
import { downloadPdfReport, openPrintableTab } from '../utils/pdfGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ProfileSummary;
  listings: AvitoListing[];
  tasks: ActionTask[];
}

type TabType = 'messenger' | 'link' | 'pdf' | 'files';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  summary,
  listings,
  tasks,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('messenger');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 1. Telegram / WhatsApp concise client summary
  const generateMessengerReport = () => {
    const criticals = listings
      .flatMap((l) => l.auditIssues)
      .filter((i) => i.severity === 'critical');

    const topIssuesText = criticals.length > 0
      ? criticals.slice(0, 3).map((c) => `• ⚠️ ${c.title}`).join('\n')
      : '• Критических ошибок не обнаружено';

    return `📊 Аудит профиля на Авито: ${summary.sellerName} (${summary.businessTypeLabel})

📈 Ключевые показатели:
• Активных объявлений: ${summary.totalListings} шт.
• Суммарно просмотров: ${formatNumber(summary.totalViews)} (+${summary.viewsToday} за сегодня)
• Платное продвижение: ${summary.promotedCount} из ${summary.totalListings} (${summary.promoPercentage}%)
• Топ-3 локомотива дают: ${summary.topLocomotiveViewsShare}% всего трафика
${summary.promotedZeroViewsCount > 0 ? `• 🚨 Слив бюджета: ${summary.promotedZeroViewsCount} объявлений на платном продвижении имеют 0 просмотров!\n` : ''}
🔍 Главные точки роста:
${topIssuesText}

💡 Ключевые рекомендации авитолога:
1. Перераспределить бюджет с неэффективных платных услуг на топ-локомотивы.
2. Протестировать параллельное мастер-объявление с сильным продвижением (x5/x10).
3. Докрутить SEO-структуру описаний, УТП и первые фотографии в отстающих позициях.

🔗 Интерактивный отчет и аналитика:
${currentUrl}`;
  };

  // 2. Full Markdown Report
  const generateMarkdownReport = () => {
    return `# 📊 Аналитический аудит профиля Avito: ${summary.sellerName} (${summary.businessTypeLabel})
Дата формирования: ${new Date().toLocaleDateString('ru-RU')}

## 1. Сводные метрики профиля
- Всего активных объявлений: ${summary.totalListings} шт.
- Суммарно просмотров: ${formatNumber(summary.totalViews)}
- Просмотров за сегодня: +${summary.viewsToday}
- Доля платного продвижения: ${summary.promoPercentage}% (${summary.promotedCount} шт.)
- Объявления с продвижением, но 0 просмотров: ${summary.promotedZeroViewsCount} шт.
- Концентрация трафика: топ-3 локомотива генерируют ${summary.topLocomotiveViewsShare}% просмотров

## 2. Выявленные критические замечания
${listings
  .flatMap((l) => l.auditIssues)
  .filter((i) => i.severity === 'critical')
  .map((i) => `- 🔴 **${i.title}**: ${i.description}`)
  .slice(0, 6)
  .join('\n') || '- Критических замечаний нет'}

## 3. Топ-5 лидеров по просмотрам
${listings
  .slice(0, 5)
  .map(
    (l, i) =>
      `${i + 1}. [${l.id}] ${l.title} — ${formatNumber(l.viewsTotal)} просм. (+${l.viewsToday} сег.), ${formatPrice(l.price)}`
  )
  .join('\n')}

## 4. Распределение по направлениям и категориям
${summary.categoryBreakdown
  .map(
    (c) =>
      `- **${c.group}**: ${c.count} объявл., ${formatNumber(c.totalViews)} просм. (${c.viewsShare}%), ср. цена: ${formatPrice(c.avgPrice)}`
  )
  .join('\n')}

## 5. Стратегия оптимизации
- **Товарная матрица**: Сохранять размерную сетку под низкочастотные запросы.
- **Гипотеза мастера**: Проверить запуск одного флагманского мастер-объявления со сводной сеткой и сильным продвижением x5/x10 для замера стоимости лида.
- **Бюджет**: Отключить платные услуги на объявлениях с нулевой отдачей.
`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadCsv = () => {
    const header = [
      'ID',
      'Заголовок',
      'Категория',
      'Тип (товар/услуга)',
      'Цена',
      'Услуги продвижения',
      'Просмотров сегодня',
      'Просмотров всего',
      'Индекс качества SEO (0-100)',
      'Количество фото',
      'Количество замечаний',
      'Ссылка на Авито',
    ];

    const rows = listings.map((l) => [
      `"${l.id}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.productGroup}"`,
      `"${l.itemType === 'service' ? 'Услуга' : 'Товар'}"`,
      l.price,
      `"${l.paidServices}"`,
      l.viewsToday,
      l.viewsTotal,
      l.qualityScore,
      l.photoCount,
      l.auditIssues.length,
      `"${l.url}"`,
    ]);

    const csvContent =
      '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `avito_audit_${summary.sellerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      await downloadPdfReport(summary, listings, tasks);
    } catch (err) {
      console.error('PDF generation error', err);
      setPdfError(
        'Не удалось сформировать PDF напрямую. Воспользуйтесь версией для печати в новой вкладке.'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenPrintableTab = () => {
    try {
      openPrintableTab(summary, listings, tasks);
    } catch (err) {
      console.error('Failed to open printable tab', err);
    }
  };

  const handleSendTelegram = () => {
    const text = generateMessengerReport();
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendWhatsapp = () => {
    const text = generateMessengerReport();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-neutral-900 text-white">
                <Share2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                Переслать отчет клиенту
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Выберите удобный формат отправки: ссылка на интерактивный дашборд, сообщение в мессенджер, PDF или выгрузка
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('messenger')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
              activeTab === 'messenger'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-600" />
            <span>Мессенджеры</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
              activeTab === 'link'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Веб-ссылка</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
              activeTab === 'pdf'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span>Печать / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
              activeTab === 'files'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Файлы (CSV / MD)</span>
          </button>
        </div>

        {/* Tab 1: Messenger Formatted Message */}
        {activeTab === 'messenger' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span className="font-medium">
                Готовый емкий текст для отправки заказчику в Telegram или WhatsApp:
              </span>
              <span className="text-[11px] text-neutral-400">
                Включает ключевые цифры и ссылку
              </span>
            </div>

            <div className="relative">
              <pre className="p-3.5 bg-neutral-900 text-neutral-100 rounded-xl text-xs font-mono leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-all border border-neutral-800">
                {generateMessengerReport()}
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(generateMessengerReport(), 'messenger')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-all shadow-xs"
              >
                {copiedType === 'messenger' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Текст скопирован в буфер!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Скопировать для отправки</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendTelegram}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-xl transition-colors"
                title="Открыть в Telegram"
              >
                <Send className="w-3.5 h-3.5" />
                <span>В Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors"
                title="Открыть в WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>В WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Interactive Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-indigo-950">
                  Интерактивный доступ для клиента
                </h4>
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Клиент сможет открыть этот дашборд с телефона или компьютера без установки программ,
                самостоятельно фильтровать объявления, смотреть графики воронки и запускать AI-анализ.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">
                Ссылка на этот аналитический дашборд:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(currentUrl, 'url')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
                >
                  {copiedType === 'url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать ссылку</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PDF / Print Presentation */}
        {activeTab === 'pdf' && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-bold text-indigo-950">
                  Полный PDF-отчет (все 4 листа из дашборда)
                </h4>
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Формирует многостраничный брендированный документ, включающий все 4 ключевых раздела аналитики:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-indigo-950">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span><strong>Лист 1:</strong> Сводный обзор и гипотеза мастера</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span><strong>Лист 2:</strong> Реестр всех {listings.length} позиций</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span><strong>Лист 3:</strong> Категории и товарные группы</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span><strong>Лист 4:</strong> Задачи и дорожная карта</span>
                </div>
              </div>
            </div>

            {pdfError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {pdfError}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              {/* Option A: Direct PDF Download */}
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Формирование 4 листов PDF документа...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Скачать полный PDF отчет (4 листа)</span>
                  </>
                )}
              </button>

              {/* Option B: Open in Standalone Tab for Native Print */}
              <button
                type="button"
                onClick={handleOpenPrintableTab}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-600" />
                <span>Открыть версию для печати в новой вкладке</span>
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-tight text-center">
              💡 В интерактивном окне встроенного предпросмотра системный диалог печати браузера
              может блокироваться песочницей iframe. Скачивание PDF-файла работает напрямую без ограничений.
            </p>
          </div>
        )}

        {/* Tab 4: File Downloads */}
        {activeTab === 'files' && (
          <div className="space-y-3">
            {/* CSV for Excel */}
            <div
              onClick={handleDownloadCsv}
              className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    Таблица Excel (CSV с разделителем «;»)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Все {listings.length} объявлений, цены, просмотры, ссылки и индексы качества SEO
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
            </div>

            {/* Markdown Report */}
            <div
              onClick={() => handleCopy(generateMarkdownReport(), 'markdown')}
              className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 group-hover:text-indigo-700 transition-colors">
                    Полный отчет в Markdown
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Для вставки в Notion, Google Docs или отправки официального письма
                  </p>
                </div>
              </div>
              {copiedType === 'markdown' ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Скопировано
                </span>
              ) : (
                <Copy className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Клиент: {summary.sellerName} · {summary.totalListings} объявлений
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
