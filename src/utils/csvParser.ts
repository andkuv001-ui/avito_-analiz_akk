import { AvitoListing, AuditIssue, PerformanceTier, BusinessType } from '../types/avito';

/**
 * Universal Avito CSV parser for ALL types of goods, services, and equipment.
 */
export function parseAvitoCsv(csvText: string): AvitoListing[] {
  if (!csvText || !csvText.trim()) return [];

  // Remove potential BOM
  const cleanText = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;

  // Auto-detect delimiter from first row (';' or ',')
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const rows = parseCsvIntoRows(cleanText, delimiter);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());

  // Find column indices dynamically
  const colIndex = {
    url: findIndex(headers, ['ссылка на объявление', 'ссылка', 'url', 'link']),
    title: findIndex(headers, ['заголовок', 'название', 'title']),
    description: findIndex(headers, ['описание', 'description']),
    price: findIndex(headers, ['цена', 'стоимость', 'price']),
    publishDate: findIndex(headers, ['дата и время публикации', 'дата публикации', 'дата']),
    daysPublished: findIndex(headers, ['дней опубликовано', 'дней']),
    timePublished: findIndex(headers, ['часов и минут опубликовано', 'время']),
    address: findIndex(headers, ['адрес', 'город', 'локация']),
    paidServices: findIndex(headers, ['использованы платные услуги', 'платные услуги', 'услуги продвижения', 'продвижение']),
    viewsToday: findIndex(headers, ['просмотров сегодня', 'сегодня']),
    viewsTotal: findIndex(headers, ['просмотров всего', 'всего просмотров', 'просмотры']),
    photos: findIndex(headers, ['ссылки на фото', 'фото', 'фотографии', 'photos', 'images']),
    id: findIndex(headers, ['id на avito', 'id', 'номер объявления']),
    cat1: findIndex(headers, ['категория 1', 'категория']),
    cat2: findIndex(headers, ['категория 2']),
    cat3: findIndex(headers, ['категория 3']),
    cat4: findIndex(headers, ['категория 4']),
    cat5: findIndex(headers, ['категория 5']),
    cat6: findIndex(headers, ['категория 6']),
    itemTypeCol: findIndex(headers, ['вид товара', 'тип услуги', 'вид услуги', 'тип товара']),
    condition: findIndex(headers, ['состояние']),
    brand: findIndex(headers, ['бренд', 'производитель']),
  };

  const listings: AvitoListing[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 3 || row.every(c => !c.trim())) continue;

    const getVal = (idx: number, fallback = '') => (idx >= 0 && idx < row.length ? row[idx].trim() : fallback);

    const title = getVal(colIndex.title);
    if (!title) continue;

    const id = getVal(colIndex.id) || `ad-${r}`;
    const url = getVal(colIndex.url);
    const descHtml = getVal(colIndex.description);
    const descText = stripHtml(descHtml);
    const rawPrice = getVal(colIndex.price).replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(rawPrice) || 0;

    const publishDate = getVal(colIndex.publishDate);
    const daysRaw = parseInt(getVal(colIndex.daysPublished), 10);
    const daysPublished = Number.isNaN(daysRaw) ? null : daysRaw;
    const timePublished = getVal(colIndex.timePublished);
    const address = getVal(colIndex.address) || 'Москва';
    const paidServices = getVal(colIndex.paidServices) || '-';
    const isPromoted = paidServices.toLowerCase().includes('продвинут') ||
                       paidServices.toLowerCase().includes('да') ||
                       paidServices.toLowerCase().includes('активно') ||
                       paidServices.toLowerCase().includes('х');

    const viewsToday = parseInt(getVal(colIndex.viewsToday).replace(/\D/g, ''), 10) || 0;
    const viewsTotal = parseInt(getVal(colIndex.viewsTotal).replace(/\D/g, ''), 10) || 0;

    // Photos
    const rawPhotos = getVal(colIndex.photos);
    const photoUrls = rawPhotos
      .split(/[\n\r\s]+/)
      .map(p => p.trim())
      .filter(p => p.startsWith('http'));

    const cat1 = getVal(colIndex.cat1);
    const cat2 = getVal(colIndex.cat2);
    const cat3 = getVal(colIndex.cat3);
    const cat4 = getVal(colIndex.cat4);
    const cat5 = getVal(colIndex.cat5);
    const categoryFull = [cat1, cat2, cat3, cat4, cat5].filter(Boolean).join(' > ');

    const condition = getVal(colIndex.condition) || 'Новое';
    const brand = getVal(colIndex.brand);

    // Collect extra specs
    const specs: Record<string, string> = {};
    for (let c = 0; c < row.length; c++) {
      if (c >= headers.length) break;
      const headerName = headers[c];
      const val = row[c].trim();
      if (val && !['описание', 'ссылки на фото', 'ссылка на объявление'].includes(headerName)) {
        specs[headerName] = val;
      }
    }

    // Universal item type & product group detection
    const isService = detectIsService(categoryFull, title, descText);
    const itemType: 'product' | 'service' = isService ? 'service' : 'product';
    const productGroup = detectUniversalGroup(categoryFull, title, cat4 || cat3 || cat2);

    // Initial audit & score
    const auditIssues = runUniversalAudit({
      id,
      title,
      descriptionHtml: descHtml,
      descriptionText: descText,
      price,
      isPromoted,
      viewsToday,
      viewsTotal,
      photoCount: photoUrls.length,
      categoryFull,
      productGroup,
      itemType,
    });

    const qualityScore = calculateUniversalQualityScore({
      title,
      descriptionText: descText,
      photoCount: photoUrls.length,
      itemType,
      auditIssues,
    });

    const performanceTier = determinePerformanceTier({
      viewsTotal,
      viewsToday,
      isPromoted,
    });

    listings.push({
      id,
      url,
      title,
      descriptionHtml: descHtml,
      descriptionText: descText,
      price,
      publishDate,
      daysPublished,
      timePublished,
      address,
      paidServices,
      isPromoted,
      viewsToday,
      viewsTotal,
      photoUrls,
      photoCount: photoUrls.length,
      category1: cat1,
      category2: cat2,
      category3: cat3,
      category4: cat4,
      categoryFull,
      productGroup,
      itemType,
      condition,
      brand,
      specs,
      qualityScore,
      performanceTier,
      auditIssues,
    });
  }

  // Cross-listing audits for any domain (cannibalization / size / model matrix)
  enrichCrossListingAudits(listings);

  return listings;
}

function findIndex(headers: string[], candidates: string[]): number {
  for (const cand of candidates) {
    const idx = headers.findIndex(h => h.includes(cand));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseCsvIntoRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectIsService(categoryFull: string, title: string, desc: string): boolean {
  const text = (categoryFull + ' ' + title + ' ' + desc).toLowerCase();
  const serviceMarkers = [
    'услуги', 'предложение услуг', 'ремонт', 'монтаж', 'установка', 'грузоперевозк',
    'клининг', 'уборк', 'сантехник', 'электрик', 'строительств', 'аренда', 'мастер',
    'диагностика', 'репетитор', 'обучение', 'перевозк', 'сборка', 'вывоз мусора',
    'отделка', 'бурение', 'сварка', 'химчистка'
  ];
  return serviceMarkers.some(m => text.includes(m));
}

function detectUniversalGroup(categoryFull: string, title: string, fallbackCat: string): string {
  const ignored = ['другое', 'главная', 'россия', 'москва', 'санкт-петербург', 'в наличии', 'новое', 'б/у', ''];
  const cleanFallback = (fallbackCat || '').trim();

  // If Avito category provides meaningful group, prioritize it!
  if (cleanFallback && !ignored.includes(cleanFallback.toLowerCase())) {
    return cleanFallback;
  }

  const t = title.toLowerCase();

  // Specific keywords if catalog is generic
  if (t.includes('коробк') || t.includes('гофрокор')) return 'Коробки картонные';
  if (t.includes('зип') || t.includes('zip') || t.includes('бегунком')) return 'Пакеты Zip-Lock';
  if (t.includes('бопп') || t.includes('bopp')) return 'Пакеты БОПП';
  if (t.includes('курьерск') || t.includes('сейф-пакет')) return 'Курьерские пакеты';
  if (t.includes('скотч') || t.includes('клейкая лента')) return 'Скотч упаковочный';
  if (t.includes('стрейч') || t.includes('стретч')) return 'Стрейч-пленка';
  if (t.includes('пузырьков') || t.includes('пузырчат') || t.includes('впп')) return 'Пузырьковая пленка';
  if (t.includes('термоэтикетк') || t.includes('этикетк')) return 'Термоэтикетки';
  if (t.includes('рохл') || t.includes('штабелер') || t.includes('тележка')) return 'Складская техника';

  // Furniture / Woodcraft
  if (t.includes('стол') || t.includes('стул') || t.includes('массив') || t.includes('мебель') || t.includes('шкаф') || t.includes('кроват') || t.includes('тумб') || t.includes('стеллаж')) return 'Мебель из массива';

  // Services
  if (t.includes('ремонт квартир') || t.includes('отделка квартир')) return 'Ремонт квартир & Отделка';
  if (t.includes('стиральн') || t.includes('бытов')) return 'Ремонт бытовой техники';
  if (t.includes('грузоперевозк') || t.includes('газель') || t.includes('переезд')) return 'Грузоперевозки';
  if (t.includes('сантехник')) return 'Сантехнические работы';
  if (t.includes('электрик')) return 'Электромонтажные работы';
  if (t.includes('клининг') || t.includes('уборк')) return 'Клининг & Уборка';
  if (t.includes('автовышк') || t.includes('спецтехник') || t.includes('экскаватор')) return 'Аренда спецтехники';
  if (t.includes('iphone') || t.includes('смартфон') || t.includes('телефон')) return 'Смартфоны & Гаджеты';
  if (t.includes('запчаст') || t.includes('бампер') || t.includes('фара') || t.includes('двигатель')) return 'Автозапчасти';

  // Derive from first 2 meaningful words of title
  const words = title.split(/\s+/).slice(0, 2).join(' ');
  return words || 'Общие позиции';
}

function runUniversalAudit(params: {
  id: string;
  title: string;
  descriptionHtml: string;
  descriptionText: string;
  price: number;
  isPromoted: boolean;
  viewsToday: number;
  viewsTotal: number;
  photoCount: number;
  categoryFull: string;
  productGroup: string;
  itemType: 'product' | 'service';
}): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const catLower = params.categoryFull.toLowerCase();
  const descLower = params.descriptionText.toLowerCase();

  // 1. Category Strategy Analysis (Non-categorical & respectful of CPC/tariff economics)
  if (params.itemType === 'product') {
    if (catLower.includes('услуг') || catLower.includes('предложение услуг')) {
      issues.push({
        id: `${params.id}-cat-services-branch`,
        severity: 'info',
        category: 'category',
        title: 'Размещение товара в разделе «Услуги»',
        description: `Позиция «${params.title}» размещена в категории «${params.categoryFull}». В услугах недоступна покупка через Авито Доставку, однако карточка привлекает клиентов на индивидуальные заказы.`,
        recommendation: 'Оцените экономику: если товар штучный или серийный, протестируйте параллельное размещение в товарном каталоге для подключения Авито Доставки.',
      });
    }
  } else {
    // Services or custom craft published in goods catalog
    if (!catLower.includes('услуг') && !catLower.includes('предложение услуг')) {
      issues.push({
        id: `${params.id}-cat-goods-branch`,
        severity: 'info',
        category: 'category',
        title: 'Стратегия: размещение в товарной ветке (вместо раздела услуг)',
        description: `Позиция «${params.title}» опубликована в товарном каталоге («${params.categoryFull}»). Это распространенная и зачастую очень выгодная практика: в товарных разделах стоимость размещения в разы ниже, и доступна оплата за просмотры/клики (CPC), что при изготовлении на заказ может снижать CPL (стоимость заявки).`,
        recommendation: 'Не спешите переносить карточку: если товарная ветка стабильно дает недорогие заявки по CPC, сохраняйте стратегию. Для теста можно запустить 1 параллельное объявление в раздел «Услуги» и сравнить конверсию в заказы.',
      });
    }
  }

  // 2. Budget Leak on Promotion
  if (params.isPromoted && params.viewsToday === 0 && params.viewsTotal > 20) {
    issues.push({
      id: `${params.id}-promo-leak`,
      severity: 'warning',
      category: 'promo',
      title: 'Слив бюджета: продвижение активно, но 0 просмотров сегодня',
      description: 'Платная услуга продвижения расходует баланс, но сегодня карточка не получила просмотров. Это признак слабого кликабельности (CTR) главного фото или неконкурентного заголовка в ленте.',
      recommendation: 'Протестируйте контрастное естественное живое фото высокого качества (чистые живые кадры без визуального шума часто конвертируют лучше перегруженной инфографики). Либо проверьте время применения продвижения.',
    });
  }

  // 3. Photo Count Audit
  if (params.photoCount < 3) {
    issues.push({
      id: `${params.id}-photo-low`,
      severity: 'warning',
      category: 'photos',
      title: `Мало фотографий (${params.photoCount} шт.)`,
      description: params.itemType === 'service'
        ? 'Для услуг фото — это главное доказательство квалификации (портфолио, примеры работ, процесс, лицо мастера).'
        : 'Алгоритмы Авито отдают приоритет объявлениям с 5–10 фото. Карточки с 1–2 фото получают меньше доверия.',
      recommendation: params.itemType === 'service'
        ? 'Добавьте реальные фото выполненных объектов, деталей, процесса работы и мастера. Живые естественные кадры вызывают максимальное доверие.'
        : 'Добавьте качественные живые фото: объект в реальных условиях, ключевые узлы крупным планом, детали (чистые живые фото без визуального шума работают лучше всего).',
    });
  } else if (params.photoCount < 6) {
    issues.push({
      id: `${params.id}-photo-mid`,
      severity: 'info',
      category: 'photos',
      title: `Рекомендуется дополнить фоторяд (${params.photoCount} шт.)`,
      description: 'Карточки с 7–10 фотографиями удерживают внимание в 1.8 раза дольше, повышая конверсию в звонок.',
      recommendation: 'Добавьте живые детальные кадры: ключевые узлы, процесс работы или производства, варианты исполнения (без навязчивой инфографики).',
    });
  }

  // 4. Title SEO & Length Audit
  if (params.title.length < 25) {
    issues.push({
      id: `${params.id}-title-short`,
      severity: 'warning',
      category: 'seo',
      title: 'Короткий заголовок: упущен поисковый трафик',
      description: `Заголовок всего ${params.title.length} симв. («${params.title}»). Клиенты ищут по уточняющим запросам.`,
      recommendation: params.itemType === 'service'
        ? 'Расширьте заголовок: укажите точный вид работ, срочность («... с выездом за 1 час», «... под ключ с гарантией»).'
        : 'Добавьте маркеры назначения: «... Оптом / В розницу», «... для Ozon и WB», «... в наличии на складе».',
    });
  }

  // 5. Domain Specific Content Audit
  if (params.itemType === 'service') {
    const hasWarranty = descLower.includes('гаранти') || descLower.includes('договор');
    const hasExperience = descLower.includes('опыт') || descLower.includes('лет') || descLower.includes('стаж');
    const hasGeography = descLower.includes('выезд') || descLower.includes('район') || descLower.includes('город') || descLower.includes('москв');

    if (!hasWarranty) {
      issues.push({
        id: `${params.id}-trust-warranty`,
        severity: 'info',
        category: 'trust',
        title: 'Нет явного триггера доверия: гарантия и договор',
        description: 'В услугах упоминание официального договора и гарантии повышает конверсию в звонок на 20-30%.',
        recommendation: 'Добавьте: «Работаем по договору, предоставляем гарантию на все выполненные работы до 12 месяцев».',
      });
    }

    if (!hasGeography) {
      issues.push({
        id: `${params.id}-trust-geo`,
        severity: 'info',
        category: 'seo',
        title: 'Не указана география и скорость выезда',
        description: 'Клиенты хотят знать, как быстро мастер приедет на объект.',
        recommendation: 'Укажите: «Бесплатный выезд на замер / оценку во все районы города в течение 60 минут».',
      });
    }
  } else {
    // Goods checks
    const hasDelivery = descLower.includes('доставк') || descLower.includes('курьер') || descLower.includes('сдэк') || descLower.includes('авито доставк') || descLower.includes('тк');
    const hasPickup = descLower.includes('самовывоз') || descLower.includes('склад') || descLower.includes('адрес') || descLower.includes('пвз');

    if (!hasDelivery && !hasPickup) {
      issues.push({
        id: `${params.id}-goods-logistics`,
        severity: 'info',
        category: 'seo',
        title: 'Не указаны условия доставки и самовывоза',
        description: 'Покупатели сразу ищут, где забрать товар или как быстро его привезут.',
        recommendation: 'Четко укажите доступные варианты: доставка до адреса/объекта, самовывоз и отправка по РФ.',
      });
    }
  }

  // 6. Organic Gem
  if (!params.isPromoted && params.viewsTotal > 800) {
    issues.push({
      id: `${params.id}-organic-gem`,
      severity: 'info',
      category: 'promo',
      title: '💎 Высокий органический интерес',
      description: `Объявление набрало ${params.viewsTotal} просмотров без платных услуг. Высокая востребованность!`,
      recommendation: 'Подключите платное продвижение (х5/х10) в пиковые часы для взрывного роста лидов.',
    });
  }

  return issues;
}

function calculateUniversalQualityScore(params: {
  title: string;
  descriptionText: string;
  photoCount: number;
  itemType: 'product' | 'service';
  auditIssues: AuditIssue[];
}): number {
  let score = 50;

  // Photos (max +25)
  if (params.photoCount >= 8) score += 25;
  else if (params.photoCount >= 5) score += 18;
  else if (params.photoCount >= 3) score += 10;
  else score += 2;

  // Title (max +15)
  if (params.title.length >= 35 && params.title.length <= 60) score += 15;
  else if (params.title.length >= 25) score += 10;
  else score += 3;

  // Description depth (max +15)
  if (params.descriptionText.length > 800) score += 15;
  else if (params.descriptionText.length > 400) score += 10;
  else score += 4;

  // Deductions
  const criticalCount = params.auditIssues.filter(i => i.severity === 'critical').length;
  const warningCount = params.auditIssues.filter(i => i.severity === 'warning').length;

  score -= criticalCount * 30;
  score -= warningCount * 8;

  return Math.max(10, Math.min(100, score));
}

function determinePerformanceTier(params: {
  viewsTotal: number;
  viewsToday: number;
  isPromoted: boolean;
}): PerformanceTier {
  if (params.viewsTotal >= 2000) return 'locomotive';
  if (params.isPromoted && params.viewsToday === 0 && params.viewsTotal > 30) return 'promo_leak';
  if (!params.isPromoted && params.viewsTotal >= 800) return 'organic_gem';
  if (params.viewsTotal >= 500) return 'growing';
  if (params.viewsTotal >= 100) return 'moderate';
  return 'sleeping';
}

function enrichCrossListingAudits(listings: AvitoListing[]) {
  // 1. Dynamic category anomaly detection across entire catalog
  if (listings.length >= 5) {
    const rootCatCounts = new Map<string, number>();
    for (const l of listings) {
      const parts = l.categoryFull.split(';').map(s => s.trim()).filter(Boolean);
      // First high-level catalog branch after "Главная"
      const rootCat = parts[1] || parts[0] || 'Основное';
      rootCatCounts.set(rootCat, (rootCatCounts.get(rootCat) || 0) + 1);
    }

    let dominantCat = '';
    let maxCount = 0;
    for (const [cat, cnt] of rootCatCounts.entries()) {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominantCat = cat;
      }
    }

    const dominantShare = maxCount / listings.length;
    if (dominantShare >= 0.7 && dominantCat) {
      for (const l of listings) {
        const parts = l.categoryFull.split(';').map(s => s.trim()).filter(Boolean);
        const rootCat = parts[1] || parts[0] || '';
        if (rootCat && rootCat !== dominantCat && (rootCatCounts.get(rootCat) || 0) <= 2) {
          if (!l.auditIssues.some(i => i.category === 'category')) {
            l.auditIssues.unshift({
              id: `${l.id}-cat-anomaly`,
              severity: 'info',
              category: 'category',
              title: `Особенность категории: ветка «${rootCat}»`,
              description: `Позиция «${l.title}» размещена в разделе «${l.categoryFull}» (основная часть ассортимента — в «${dominantCat}»). Размещение в товарных разделах часто обусловлено более дешевым тарифом и CPC-моделью (оплата за клики/просмотры), что при работе на заказ бывает намного выгоднее.`,
              recommendation: `Оцените стоимость лида (CPL): если товарный раздел дает стабильные заявки по CPC, сохраняйте стратегию. При необходимости можно протестировать 1 объявление в «${dominantCat}» или разделе услуг.`,
            });
          }
        }
      }
    }
  }

  // 2. Universal multi-listing / size / model clustering
  const prefixMap = new Map<string, AvitoListing[]>();

  for (const l of listings) {
    const cleanWords = l.title
      .replace(/[0-9xх.,/\\-]+/gi, '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');

    if (cleanWords.length >= 5) {
      const existing = prefixMap.get(cleanWords) || [];
      existing.push(l);
      prefixMap.set(cleanWords, existing);
    }
  }

  for (const [prefix, groupListings] of prefixMap.entries()) {
    if (groupListings.length >= 3) {
      const viewsToday = groupListings.reduce((sum, l) => sum + l.viewsToday, 0);

      for (const item of groupListings) {
        if (!item.auditIssues.some(i => i.category === 'cannibalization')) {
          item.auditIssues.push({
            id: `${item.id}-cluster-niche`,
            severity: 'info',
            category: 'cannibalization',
            title: `Размерная / модельная сетка («${prefix}», ${groupListings.length} карточек)`,
            description: `В профиле создана линейка отдельных объявлений под конкретные модификации/размеры (${groupListings.length} шт., суммарно ${viewsToday} просм./день). Отдельные карточки дают суммарно больше низкочастотного трафика, если их обложки контрастно дифференцированы.`,
            recommendation: '1) Протестируйте чистые естественные живые фото каждой позиции (естественные кадры без тяжелой графики часто дают наибольшую конверсию). 2) Сравните в A/B тесте чистое фото против карточки с аккуратной минималистичной плашкой параметров. 3) Продвигайте платно 2–3 ходовые позиции, остальные держите на органике. 4) Проверьте параллельный запуск мастер-объявления.',
          });
        }
      }
    }
  }
}
