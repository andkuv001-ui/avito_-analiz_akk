import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ActionTask, AvitoListing, ProfileSummary } from '../types/avito';
import { formatNumber, formatPrice } from './analyzer';

/**
 * Helper to escape HTML characters safely
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Standard A4 page styling constants
 */
const PAGE_STYLE = `
  width: 794px;
  background-color: #ffffff;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding: 32px 36px;
  box-sizing: border-box;
`;

/**
 * Builds HTML for Sheet 1: Overview & KPI & Strategy
 */
function buildSheet1Overview(summary: ProfileSummary, listings: AvitoListing[]): string {
  const criticalIssues = listings
    .flatMap((l) => l.auditIssues)
    .filter((i) => i.severity === 'critical')
    .slice(0, 4);

  return `
    <div style="${PAGE_STYLE}">
      <!-- Sheet Header -->
      <div style="border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #4f46e5; margin-bottom: 3px;">
            АвитоПульс · Лист 1 из 4: Сводный обзор и стратегия
          </div>
          <h1 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0; line-height: 1.2;">
            ${escapeHtml(summary.sellerName)}
          </h1>
          <div style="font-size: 12px; color: #6b7280; margin-top: 3px;">
            Сфера бизнеса: <strong>${escapeHtml(summary.businessTypeLabel)}</strong> · Активных объявлений: <strong>${summary.totalListings} шт.</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; padding: 4px 10px; background-color: #f3f4f6; border-radius: 6px; font-size: 11px; font-weight: 600; color: #374151;">
            Дата: ${new Date().toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Всего объявлений</div>
          <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 2px;">${summary.totalListings} шт.</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 1px;">ср. цена: ${formatPrice(summary.avgPrice)}</div>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Всего просмотров</div>
          <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 2px;">${formatNumber(summary.totalViews)}</div>
          <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 1px;">+${summary.viewsToday} за сегодня</div>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Доля продвижения</div>
          <div style="font-size: 18px; font-weight: 800; color: #4f46e5; margin-top: 2px;">${summary.promoPercentage}%</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 1px;">${summary.promotedCount} из ${summary.totalListings} поз.</div>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #dc2626; letter-spacing: 0.5px;">Слив бюджета</div>
          <div style="font-size: 18px; font-weight: 800; color: #dc2626; margin-top: 2px;">${summary.promotedZeroViewsCount} шт.</div>
          <div style="font-size: 10px; color: #991b1b; margin-top: 1px;">платные с 0 просмотров</div>
        </div>
      </div>

      <!-- Critical Findings -->
      <div style="margin-bottom: 18px;">
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #111827; margin: 0 0 8px 0;">
          ⚠️ Критические точки внимания и аудит профиля
        </h2>
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${
            criticalIssues.length > 0
              ? criticalIssues
                  .map(
                    (iss) => `
            <div style="padding: 9px 12px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: flex-start; gap: 8px;">
              <span style="display: inline-block; padding: 2px 5px; background-color: #fee2e2; color: #991b1b; font-size: 9px; font-weight: 700; border-radius: 4px; margin-top: 2px;">КРИТИЧНО</span>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #111827;">${escapeHtml(iss.title)}</div>
                <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">${escapeHtml(iss.description)}</div>
                <div style="font-size: 11px; color: #047857; margin-top: 2px; font-weight: 600;">👉 Рекомендация: ${escapeHtml(iss.recommendation)}</div>
              </div>
            </div>
          `
                  )
                  .join('')
              : '<div style="padding: 10px; font-size: 11px; color: #059669;">Критических замечаний в профиле не обнаружено.</div>'
          }
        </div>
      </div>

      <!-- Strategy Comparison -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 18px;">
        <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
          💡 Сравнение двух стратегий публикации на Авито
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; font-size: 11px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
            <div style="font-weight: 700; color: #0284c7; margin-bottom: 2px;">Стратегия 1: Продвижение локомотивов</div>
            <p style="margin: 0; color: #475569; line-height: 1.4;">
              Фокусировка бюджета на 2-3 товарах с максимальной кликабельностью (CTR). Концентрация: топ-3 позиции генерируют <strong>${summary.topLocomotiveViewsShare}%</strong> всех просмотров.
            </p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
            <div style="font-weight: 700; color: #7c3aed; margin-bottom: 2px;">Стратегия 2: Размерный охват выдачи</div>
            <p style="margin: 0; color: #475569; line-height: 1.4;">
              Множество объявлений под конкретные размеры/модели дают стабильный поток целевого трафика по низкочастотным запросам. Не отключайте рабочие позиции.
            </p>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #1e293b; line-height: 1.4;">
          <strong>🎯 Рекомендации авитолога:</strong><br>
          • <em>Визуальная конверсия:</em> Чистые естественные живые фотографии реального процесса работы, оборудования или результата без визуального шума вызывают максимальное доверие клиентов. Рекомендуется провести A/B тест чистого живого фото против графических плашек.<br>
          • <em>Мастер-объявление:</em> Проверить гипотезу о параллельном создании одного флагманского мастер-объявления со сводным модельным рядом и сильным продвижением (x5/x10) для сравнения стоимости заявки (CPL).
        </div>
      </div>

      <!-- Sheet Footer -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 10px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;">
        <span>АвитоПульс · Лист 1 из 4</span>
        <span>${escapeHtml(summary.sellerName)} · ${new Date().toLocaleDateString('ru-RU')}</span>
      </div>
    </div>
  `;
}

/**
 * Builds HTML for Sheet 2: All Active Listings Registry
 */
function buildSheet2Listings(summary: ProfileSummary, listings: AvitoListing[]): string {
  return `
    <div style="${PAGE_STYLE}">
      <!-- Sheet Header -->
      <div style="border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #4f46e5; margin-bottom: 3px;">
            АвитоПульс · Лист 2 из 4: Реестр всех действующих объявлений
          </div>
          <h2 style="font-size: 18px; font-weight: 800; color: #111827; margin: 0; line-height: 1.2;">
            Полный реестр позиций (${listings.length} объявлений)
          </h2>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
            Клиент: <strong>${escapeHtml(summary.sellerName)}</strong> · Оценка качества SEO, воронка просмотров и подключенные платные услуги
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #6b7280;">
          Лист 2 из 4
        </div>
      </div>

      <!-- Listings Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; margin-bottom: 14px;">
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 1.5px solid #d1d5db; color: #374151;">
            <th style="padding: 6px 8px; font-weight: 700; width: 35px;">№</th>
            <th style="padding: 6px 8px; font-weight: 700;">Позиция / ID</th>
            <th style="padding: 6px 8px; font-weight: 700;">Категория</th>
            <th style="padding: 6px 8px; font-weight: 700; text-align: right;">Цена</th>
            <th style="padding: 6px 8px; font-weight: 700;">Услуги</th>
            <th style="padding: 6px 8px; font-weight: 700; text-align: right;">Просмотры</th>
            <th style="padding: 6px 8px; font-weight: 700; text-align: center;">SEO</th>
            <th style="padding: 6px 8px; font-weight: 700;">Статус</th>
          </tr>
        </thead>
        <tbody>
          ${listings
            .map(
              (l, idx) => `
            <tr style="border-bottom: 1px solid #f3f4f6; ${idx % 2 === 1 ? 'background-color: #fafafa;' : ''}">
              <td style="padding: 5px 8px; color: #6b7280; font-weight: 600;">${idx + 1}</td>
              <td style="padding: 5px 8px; max-width: 220px;">
                <div style="font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(l.title)}</div>
                <div style="font-size: 9px; color: #9ca3af;">ID: ${escapeHtml(l.id)} · Фото: ${l.photoCount} шт.</div>
              </td>
              <td style="padding: 5px 8px; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">
                ${escapeHtml(l.productGroup)}
              </td>
              <td style="padding: 5px 8px; text-align: right; font-weight: 700; white-space: nowrap;">
                ${formatPrice(l.price)}
              </td>
              <td style="padding: 5px 8px; font-size: 9px; color: ${Boolean(l.paidServices && l.paidServices !== '—') ? '#4f46e5; font-weight: 700;' : '#9ca3af;'}">
                ${escapeHtml(l.paidServices || 'Органика')}
              </td>
              <td style="padding: 5px 8px; text-align: right; white-space: nowrap;">
                <span style="font-weight: 700; color: #111827;">${formatNumber(l.viewsTotal)}</span>
                <span style="font-size: 9px; color: #059669; font-weight: 600; margin-left: 2px;">(+${l.viewsToday})</span>
              </td>
              <td style="padding: 5px 8px; text-align: center;">
                <span style="display: inline-block; padding: 1px 4px; border-radius: 3px; font-weight: 700; font-size: 9px; background-color: ${
                  l.qualityScore >= 75
                    ? '#dcfce7; color: #15803d;'
                    : l.qualityScore >= 50
                    ? '#fef9c3; color: #854d0e;'
                    : '#fee2e2; color: #991b1b;'
                }">
                  ${l.qualityScore}
                </span>
              </td>
              <td style="padding: 5px 8px; font-size: 9px; white-space: nowrap;">
                <span style="display: inline-block; padding: 1px 5px; border-radius: 4px; font-weight: 700; background-color: ${
                  l.performanceTier === 'locomotive'
                    ? '#dcfce7; color: #15803d;'
                    : l.performanceTier === 'promo_leak'
                    ? '#fee2e2; color: #991b1b;'
                    : l.performanceTier === 'organic_gem'
                    ? '#e0e7ff; color: #4338ca;'
                    : '#f3f4f6; color: #4b5563;'
                }">
                  ${
                    l.performanceTier === 'locomotive'
                      ? 'Хит'
                      : l.performanceTier === 'promo_leak'
                      ? 'Слив'
                      : l.performanceTier === 'organic_gem'
                      ? 'Алмаз'
                      : l.performanceTier === 'growing'
                      ? 'Рост'
                      : 'Обычное'
                  }
                </span>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Sheet Footer -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 10px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;">
        <span>АвитоПульс · Лист 2 из 4</span>
        <span>Всего позиций: ${listings.length} шт. · Сформировано автоматически</span>
      </div>
    </div>
  `;
}

/**
 * Builds HTML for Sheet 3: Categories & Niches Analysis
 */
function buildSheet3Categories(summary: ProfileSummary): string {
  return `
    <div style="${PAGE_STYLE}">
      <!-- Sheet Header -->
      <div style="border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #4f46e5; margin-bottom: 3px;">
            АвитоПульс · Лист 3 из 4: Аналитика по категориям и нишам
          </div>
          <h2 style="font-size: 18px; font-weight: 800; color: #111827; margin: 0; line-height: 1.2;">
            Распределение трафика по направлениям
          </h2>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
            Клиент: <strong>${escapeHtml(summary.sellerName)}</strong> · Направлений в работе: <strong>${summary.categoryBreakdown.length}</strong>
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #6b7280;">
          Лист 3 из 4
        </div>
      </div>

      <!-- Categories Summary Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 1.5px solid #d1d5db; color: #374151;">
            <th style="padding: 8px 10px; font-weight: 700;">Товарная группа / Направление</th>
            <th style="padding: 8px 10px; font-weight: 700; text-align: right;">Позиций</th>
            <th style="padding: 8px 10px; font-weight: 700; text-align: right;">Доля трафика</th>
            <th style="padding: 8px 10px; font-weight: 700; text-align: right;">Просмотры</th>
            <th style="padding: 8px 10px; font-weight: 700; text-align: right;">С продвижением</th>
            <th style="padding: 8px 10px; font-weight: 700; text-align: right;">Ср. чек</th>
          </tr>
        </thead>
        <tbody>
          ${summary.categoryBreakdown
            .map(
              (c, idx) => `
            <tr style="border-bottom: 1px solid #f3f4f6; ${idx % 2 === 1 ? 'background-color: #fafafa;' : ''}">
              <td style="padding: 8px 10px; font-weight: 700; color: #111827;">
                ${escapeHtml(c.group)}
              </td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #4b5563;">
                ${c.count} шт.
              </td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #4f46e5;">
                ${c.viewsShare}%
              </td>
              <td style="padding: 8px 10px; text-align: right;">
                <span style="font-weight: 700; color: #111827;">${formatNumber(c.totalViews)}</span>
                <span style="font-size: 10px; color: #059669; font-weight: 600; margin-left: 2px;">(+${c.viewsToday})</span>
              </td>
              <td style="padding: 8px 10px; text-align: right; color: #4b5563;">
                ${c.promotedCount} шт.
              </td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #111827;">
                ${formatPrice(c.avgPrice)}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Category Insights -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0;">
          💡 Аналитические выводы по товарным группам
        </h3>
        <div style="font-size: 11px; color: #334155; line-height: 1.6;">
          • <strong>Локомотивная группа:</strong> Наибольший объем просмотров сосредоточен в группе «${summary.categoryBreakdown[0]?.group || 'Основное'}» (${summary.categoryBreakdown[0]?.viewsShare || 0}% трафика). Здесь целесообразно тестировать флагманские услуги продвижения (х5 / х10).<br>
          • <strong>Конверсия и фото:</strong> Качественные живые кадры деталей, процесса оказания услуг или товара в реальных условиях привлекают более платежеспособную аудиторию и конвертируют выше инфографики.<br>
          • <strong>Экономика категорий:</strong> Размещение в товарных разделах часто обусловлено более дешевым тарифом и CPC-моделью (оплата за клики), что часто выгоднее тарифов раздела «Услуги».
        </div>
      </div>

      <!-- Sheet Footer -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 10px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;">
        <span>АвитоПульс · Лист 3 из 4</span>
        <span>Категорий проанализировано: ${summary.categoryBreakdown.length}</span>
      </div>
    </div>
  `;
}

/**
 * Builds HTML for Sheet 4: Action Tasks Roadmap
 */
function buildSheet4Tasks(summary: ProfileSummary, tasks: ActionTask[]): string {
  const highPriority = tasks.filter((t) => t.priority === 'high');
  const mediumPriority = tasks.filter((t) => t.priority === 'medium');
  const lowPriority = tasks.filter((t) => t.priority === 'low');

  return `
    <div style="${PAGE_STYLE}">
      <!-- Sheet Header -->
      <div style="border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #4f46e5; margin-bottom: 3px;">
            АвитоПульс · Лист 4 из 4: Задачи авитолога и дорожная карта
          </div>
          <h2 style="font-size: 18px; font-weight: 800; color: #111827; margin: 0; line-height: 1.2;">
            План первоочередных действий по профилю
          </h2>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
            Клиент: <strong>${escapeHtml(summary.sellerName)}</strong> · Задач к выполнению: <strong>${tasks.length} пунктов</strong>
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #6b7280;">
          Лист 4 из 4
        </div>
      </div>

      <!-- Tasks List -->
      <div style="space-y: 10px; margin-bottom: 20px;">
        <!-- High Priority -->
        <div style="margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            🔥 Срочно: Остановка потерь и первоочередные шаги (${highPriority.length})
          </div>
          <div style="border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden; background: #fff5f5;">
            ${highPriority
              .map(
                (t) => `
              <div style="padding: 9px 12px; border-bottom: 1px solid #fed7d7; font-size: 11px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <strong style="color: #991b1b;">${escapeHtml(t.title)}</strong>
                  <span style="font-size: 10px; padding: 2px 6px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-weight: 600;">
                    ${escapeHtml(t.category)}
                  </span>
                </div>
                <div style="color: #4b5563; margin-top: 3px; font-size: 10px; line-height: 1.4;">
                  ${escapeHtml(t.description)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Medium Priority -->
        <div style="margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            ⚡ Высокий приоритет: Масштабирование и оптимизация (${mediumPriority.length})
          </div>
          <div style="border: 1px solid #fef3c7; border-radius: 8px; overflow: hidden; background: #fffbeb;">
            ${mediumPriority
              .map(
                (t) => `
              <div style="padding: 9px 12px; border-bottom: 1px solid #fde68a; font-size: 11px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <strong style="color: #92400e;">${escapeHtml(t.title)}</strong>
                  <span style="font-size: 10px; padding: 2px 6px; background: #fef3c7; color: #92400e; border-radius: 4px; font-weight: 600;">
                    ${escapeHtml(t.category)}
                  </span>
                </div>
                <div style="color: #4b5563; margin-top: 3px; font-size: 10px; line-height: 1.4;">
                  ${escapeHtml(t.description)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        ${
          lowPriority.length > 0
            ? `
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            💡 Базовые улучшения и плановые тесты (${lowPriority.length})
          </div>
          <div style="border: 1px solid #e0e7ff; border-radius: 8px; overflow: hidden; background: #f5f7ff;">
            ${lowPriority
              .map(
                (t) => `
              <div style="padding: 9px 12px; border-bottom: 1px solid #c7d2fe; font-size: 11px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <strong style="color: #3730a3;">${escapeHtml(t.title)}</strong>
                  <span style="font-size: 10px; padding: 2px 6px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-weight: 600;">
                    ${escapeHtml(t.category)}
                  </span>
                </div>
                <div style="color: #4b5563; margin-top: 3px; font-size: 10px; line-height: 1.4;">
                  ${escapeHtml(t.description)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
        `
            : ''
        }
      </div>

      <!-- Sheet Footer -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 10px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;">
        <span>АвитоПульс · Лист 4 из 4</span>
        <span>План действий согласован к внедрению</span>
      </div>
    </div>
  `;
}

/**
 * Downloads a complete 4-sheet PDF report directly to the client's device.
 */
export async function downloadPdfReport(
  summary: ProfileSummary,
  listings: AvitoListing[],
  tasks: ActionTask[]
): Promise<void> {
  const wrapper = document.createElement('div');
  wrapper.id = 'pdf-four-sheets-container';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.zIndex = '-1000';
  wrapper.style.backgroundColor = '#ffffff';

  document.body.appendChild(wrapper);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const sheetsHtml = [
      buildSheet1Overview(summary, listings),
      buildSheet2Listings(summary, listings),
      buildSheet3Categories(summary),
      buildSheet4Tasks(summary, tasks),
    ];

    for (let i = 0; i < sheetsHtml.length; i++) {
      wrapper.innerHTML = sheetsHtml[i];

      const canvas = await html2canvas(wrapper, {
        scale: 2, // 2x retina sharpness
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // In case listings table or tasks sheet spans beyond 1 A4 page
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }
    }

    const safeName = summary.sellerName
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`Аудит_Авито_${safeName}_4_листа_${dateStr}.pdf`);
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Creates a standalone printable HTML page containing all 4 sheets with clean print breaks.
 */
export function openPrintableTab(
  summary: ProfileSummary,
  listings: AvitoListing[],
  tasks: ActionTask[]
): void {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Аудит профиля Авито: ${escapeHtml(summary.sellerName)} (4 листа)</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #111827;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .print-btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    .sheet-wrapper {
      max-width: 794px;
      margin: 24px auto;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      page-break-after: always;
      break-after: page;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .print-bar {
        display: none !important;
      }
      .sheet-wrapper {
        margin: 0;
        box-shadow: none;
        max-width: 100%;
        page-break-after: always;
        break-after: page;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <strong>АвитоПульс · Отчет аудита (Все 4 листа)</strong>
      <span style="opacity: 0.7; margin-left: 12px;">Клиент: ${escapeHtml(summary.sellerName)}</span>
    </div>
    <button class="print-btn" onclick="window.print()">Распечатать / Сохранить в PDF</button>
  </div>

  <div class="sheet-wrapper">
    ${buildSheet1Overview(summary, listings)}
  </div>

  <div class="sheet-wrapper">
    ${buildSheet2Listings(summary, listings)}
  </div>

  <div class="sheet-wrapper">
    ${buildSheet3Categories(summary)}
  </div>

  <div class="sheet-wrapper">
    ${buildSheet4Tasks(summary, tasks)}
  </div>

  <script>
    // Prompt print after load
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}
