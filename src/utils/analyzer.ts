import { AvitoListing, ProfileSummary, CategoryStat, CannibalizationCluster, ActionTask, BusinessType } from '../types/avito';

export function analyzeProfile(listings: AvitoListing[]): ProfileSummary {
  const totalListings = listings.length;
  if (totalListings === 0) {
    return {
      sellerName: 'Профиль продавца',
      businessType: 'goods',
      businessTypeLabel: 'Товары',
      totalListings: 0,
      totalViews: 0,
      viewsToday: 0,
      promotedCount: 0,
      organicCount: 0,
      promoPercentage: 0,
      zeroViewsTodayCount: 0,
      promotedZeroViewsCount: 0,
      avgViewsPerListing: 0,
      avgPrice: 0,
      topLocomotiveViewsShare: 0,
      criticalIssuesCount: 0,
      warningsCount: 0,
      topListings: [],
      categoryBreakdown: [],
      cannibalizationClusters: [],
    };
  }

  // Detect domain / business type
  const servicesCount = listings.filter(l => l.itemType === 'service').length;
  const isServicesDominant = servicesCount > totalListings / 2;
  const isEquipmentDominant = listings.filter(l => (l.categoryFull + l.title).toLowerCase().includes('оборудован')).length > totalListings / 3;

  const businessType: BusinessType = isServicesDominant
    ? 'services'
    : isEquipmentDominant
    ? 'equipment'
    : 'goods';

  const businessTypeLabel = isServicesDominant
    ? 'Услуги и сервис'
    : isEquipmentDominant
    ? 'Оборудование & B2B'
    : 'Товары & Ритейл';

  // Detect seller name from description or title
  const sellerName = detectSellerName(listings);

  const totalViews = listings.reduce((sum, l) => sum + l.viewsTotal, 0);
  const viewsToday = listings.reduce((sum, l) => sum + l.viewsToday, 0);
  const promotedCount = listings.filter(l => l.isPromoted).length;
  const organicCount = totalListings - promotedCount;
  const promoPercentage = Math.round((promotedCount / totalListings) * 100);

  const zeroViewsTodayCount = listings.filter(l => l.viewsToday === 0).length;
  const promotedZeroViewsCount = listings.filter(l => l.isPromoted && l.viewsToday === 0).length;
  const avgViewsPerListing = Math.round(totalViews / totalListings);

  const validPrices = listings.map(l => l.price).filter(p => p > 0);
  const avgPrice = validPrices.length ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

  // Sorted by total views
  const sortedByViews = [...listings].sort((a, b) => b.viewsTotal - a.viewsTotal);
  const topListings = sortedByViews.slice(0, 5);

  const top3Views = sortedByViews.slice(0, 3).reduce((sum, l) => sum + l.viewsTotal, 0);
  const topLocomotiveViewsShare = totalViews > 0 ? Math.round((top3Views / totalViews) * 100) : 0;

  // Issues counts
  let criticalIssuesCount = 0;
  let warningsCount = 0;
  for (const l of listings) {
    criticalIssuesCount += l.auditIssues.filter(i => i.severity === 'critical').length;
    warningsCount += l.auditIssues.filter(i => i.severity === 'warning').length;
  }

  // Dynamic category breakdown (works for ANY goods or services)
  const categoryMap = new Map<string, {
    count: number;
    totalViews: number;
    viewsToday: number;
    promotedCount: number;
    prices: number[];
  }>();

  for (const l of listings) {
    const groupName = l.productGroup || 'Прочее';
    const existing = categoryMap.get(groupName) || {
      count: 0,
      totalViews: 0,
      viewsToday: 0,
      promotedCount: 0,
      prices: [],
    };
    existing.count += 1;
    existing.totalViews += l.viewsTotal;
    existing.viewsToday += l.viewsToday;
    if (l.isPromoted) existing.promotedCount += 1;
    if (l.price > 0) existing.prices.push(l.price);
    categoryMap.set(groupName, existing);
  }

  const categoryBreakdown: CategoryStat[] = Array.from(categoryMap.entries()).map(([group, data]) => {
    const avgP = data.prices.length ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length) : 0;
    return {
      group,
      count: data.count,
      totalViews: data.totalViews,
      viewsToday: data.viewsToday,
      promotedCount: data.promotedCount,
      avgPrice: avgP,
      viewsShare: totalViews > 0 ? Math.round((data.totalViews / totalViews) * 100) : 0,
    };
  }).sort((a, b) => b.totalViews - a.totalViews);

  // Dynamic Multi-listing / Matrix clusters
  const cannibalizationClusters = detectDynamicClusters(listings);

  return {
    sellerName,
    businessType,
    businessTypeLabel,
    totalListings,
    totalViews,
    viewsToday,
    promotedCount,
    organicCount,
    promoPercentage,
    zeroViewsTodayCount,
    promotedZeroViewsCount,
    avgViewsPerListing,
    avgPrice,
    topLocomotiveViewsShare,
    criticalIssuesCount,
    warningsCount,
    topListings,
    categoryBreakdown,
    cannibalizationClusters,
  };
}

function detectSellerName(listings: AvitoListing[]): string {
  // Check descriptions for quotation marks like «...» or "..."
  for (const l of listings.slice(0, 5)) {
    const match = l.descriptionText.match(/«([^»]{3,30})»/);
    if (match && match[1]) {
      return match[1].trim();
    }
    const matchQuote = l.descriptionText.match(/"([^"]{3,30})"/);
    if (matchQuote && matchQuote[1]) {
      return matchQuote[1].trim();
    }
  }

  // If common seller sign not found, use first category or title root
  if (listings[0]) {
    return listings[0].productGroup || 'Профиль на Авито';
  }

  return 'Профиль продавца';
}

function detectDynamicClusters(listings: AvitoListing[]): CannibalizationCluster[] {
  const clusters: CannibalizationCluster[] = [];
  const prefixMap = new Map<string, AvitoListing[]>();

  for (const l of listings) {
    const cleanPrefix = l.title
      .replace(/[0-9xх.,/\\-]+/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ')
      .toLowerCase();

    if (cleanPrefix.length >= 5) {
      const existing = prefixMap.get(cleanPrefix) || [];
      existing.push(l);
      prefixMap.set(cleanPrefix, existing);
    }
  }

  for (const [prefix, items] of prefixMap.entries()) {
    if (items.length >= 3) {
      clusters.push({
        titlePattern: `${capitalize(prefix)} (${items.length} позиций)`,
        count: items.length,
        totalViews: items.reduce((s, l) => s + l.viewsTotal, 0),
        viewsToday: items.reduce((s, l) => s + l.viewsToday, 0),
        listingIds: items.map(l => l.id),
        recommendation: 'Раздельные карточки эффективно собирают низкочастотные запросы. Рекомендуется уникализировать обложки и протестировать гипотезу создания одного сводного мастер-объявления.',
      });
    }
  }

  return clusters.slice(0, 3);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateActionTasks(listings: AvitoListing[], summary: ProfileSummary): ActionTask[] {
  const tasks: ActionTask[] = [];

  // Task 1: Category strategy evaluation (non-categorical, respectful of CPC/tariff economics)
  const categoryAds = listings.filter(l => l.auditIssues.some(i => i.category === 'category'));
  if (categoryAds.length > 0) {
    tasks.push({
      id: 'task-category-fix',
      priority: 'medium',
      category: 'Категории & Тарифы',
      title: `Оценить стратегию категорий: товары vs «Услуги» (${categoryAds.length} объявл.)`,
      description: `Часть объявлений (например, ID: ${categoryAds[0].id}) размещена в товарном разделе каталога. Это распространенная и часто выгодная практика: размещение в товарных разделах бывает в разы дешевле раздела «Услуги», и действует оплата за просмотры/клики (CPC), что снижает цену лида. Рекомендуется замерить реальный CPL в текущей категории перед переводом.`,
      targetListingIds: categoryAds.map(l => l.id),
      completed: false,
    });
  }

  // Task 2: Budget leak fix
  const promoLeakAds = listings.filter(l => l.isPromoted && l.viewsToday === 0 && l.viewsTotal > 20);
  if (promoLeakAds.length > 0) {
    tasks.push({
      id: 'task-promo-leak',
      priority: 'high',
      category: 'Продвижение',
      title: `Остановить или перенастроить ${promoLeakAds.length} объявлений со сливом продвижения`,
      description: 'Объявления имеют активные платные услуги («Продвинуто»), но сегодня получили 0 просмотров. Протестируйте контрастное естественное живое фото (чистые живые кадры без навязчивой инфографики часто дают более высокую кликабельность) либо перенаправьте бюджет на топ-локомотивы.',
      targetListingIds: promoLeakAds.map(l => l.id),
      completed: false,
    });
  }

  // Task 3: Multi-listing / size / service matrix optimization
  if (summary.cannibalizationClusters.length > 0) {
    const cluster = summary.cannibalizationClusters[0];
    tasks.push({
      id: 'task-matrix-optimization',
      priority: 'high',
      category: 'Ассортимент & Визуал',
      title: `Оптимизировать размерную / модельную сетку (${cluster.titlePattern})`,
      description: `Отдельные карточки дают максимальный охват точных поисковых запросов. Чтобы повысить их отдачу: 1) протестируйте чистое живое фото высокого качества (естественные живые кадры процесса и результата без тяжелой инфографики вызывают максимальное доверие) в A/B тесте против карточек с плашкой параметров; 2) продвигайте платно 2–3 ходовые позиции; 3) протестируйте гипотезу параллельного запуска одного общего мастер-объявления со сводным прайсом.`,
      targetListingIds: cluster.listingIds,
      completed: false,
    });
  }

  // Task 4: Boost organic gems
  const organicGems = listings.filter(l => !l.isPromoted && l.viewsTotal >= 800);
  if (organicGems.length > 0) {
    tasks.push({
      id: 'task-boost-gems',
      priority: 'medium',
      category: 'Масштабирование',
      title: `Подключить продвижение на сильные органические карточки (${organicGems.length} шт.)`,
      description: `Объявление «${organicGems[0].title}» (${organicGems[0].viewsTotal} просм.) собирает высокий трафик на чистой органике. Платные услуги дадут кратный рост лидов.`,
      targetListingIds: organicGems.map(l => l.id),
      completed: false,
    });
  }

  // Task 5: Photo count improvements
  const lowPhotoAds = listings.filter(l => l.photoCount <= 3);
  if (lowPhotoAds.length > 0) {
    tasks.push({
      id: 'task-add-photos',
      priority: 'medium',
      category: 'Контент',
      title: `Догрузить фото в карточки с малым количеством кадров (${lowPhotoAds.length} шт.)`,
      description: summary.businessType === 'services'
        ? 'Для услуг живые фото процесса работы, оборудования, мастеров и выполненных объектов повышают доверие в 2 раза. Добавьте естественные кадры без визуального шума.'
        : 'Карточки с 2–3 фото теряют до 30% конверсии в контакты. Добавьте качественные живые фото: детализация, товар в реальных условиях использования, процесс работы. Чистые естественные кадры вызывают наибольшее доверие клиентов.',
      targetListingIds: lowPhotoAds.map(l => l.id),
      completed: false,
    });
  }

  // Task 6: Title expansion
  const shortTitleAds = listings.filter(l => l.title.length < 25);
  if (shortTitleAds.length > 0) {
    tasks.push({
      id: 'task-expand-titles',
      priority: 'low',
      category: 'SEO',
      title: `Расширить короткие заголовки (${shortTitleAds.length} шт.)`,
      description: 'Добавьте ключевые слова (география, срочность, опт/розница, гарантия), чтобы карточки находились по большему числу запросов.',
      targetListingIds: shortTitleAds.map(l => l.id),
      completed: false,
    });
  }

  return tasks;
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Цена по запросу';
  return `${price.toLocaleString('ru-RU')} ₽`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU');
}
