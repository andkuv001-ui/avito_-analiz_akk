export type BusinessType = 'goods' | 'services' | 'equipment' | 'mixed';

export interface AvitoListing {
  id: string;
  url: string;
  title: string;
  descriptionHtml: string;
  descriptionText: string;
  price: number;
  publishDate: string;
  daysPublished: number | null;
  timePublished: string;
  address: string;
  paidServices: string;
  isPromoted: boolean;
  viewsToday: number;
  viewsTotal: number;
  photoUrls: string[];
  photoCount: number;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  categoryFull: string;
  productGroup: string; // Dynamically extracted (e.g. "Ремонт квартир", "Коробки", "Грузоперевозки")
  itemType: 'product' | 'service';
  condition: string;
  brand: string;
  specs: Record<string, string>;
  qualityScore: number;
  performanceTier: PerformanceTier;
  auditIssues: AuditIssue[];
}

export type PerformanceTier =
  | 'locomotive'     // Флагман / Хит (> 2 000 просмотров)
  | 'growing'        // Стабильный рост (500 - 2 000 просмотров)
  | 'moderate'       // Средняя динамика (100 - 500 просмотров)
  | 'sleeping'       // Спящее / Низкая динамика (< 100 просмотров)
  | 'promo_leak'     // Слив продвижения (Продвинуто, но 0 просмотров сегодня)
  | 'organic_gem';   // Неограненный алмаз (Много просмотров без платных услуг)

export interface AuditIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
  category: 'seo' | 'category' | 'photos' | 'promo' | 'price' | 'cannibalization' | 'trust';
}

export interface ProfileSummary {
  sellerName: string;
  businessType: BusinessType;
  businessTypeLabel: string;
  totalListings: number;
  totalViews: number;
  viewsToday: number;
  promotedCount: number;
  organicCount: number;
  promoPercentage: number;
  zeroViewsTodayCount: number;
  promotedZeroViewsCount: number;
  avgViewsPerListing: number;
  avgPrice: number;
  topLocomotiveViewsShare: number;
  criticalIssuesCount: number;
  warningsCount: number;
  topListings: AvitoListing[];
  categoryBreakdown: CategoryStat[];
  cannibalizationClusters: CannibalizationCluster[];
}

export interface CategoryStat {
  group: string;
  count: number;
  totalViews: number;
  viewsToday: number;
  promotedCount: number;
  avgPrice: number;
  viewsShare: number;
}

export interface CannibalizationCluster {
  titlePattern: string;
  count: number;
  totalViews: number;
  viewsToday: number;
  listingIds: string[];
  recommendation: string;
}

export interface ActionTask {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  targetListingIds?: string[];
  category: string;
  completed: boolean;
}

export interface ProfilePreset {
  id: string;
  title: string;
  subtitle: string;
  type: BusinessType;
  csvData: string;
}
