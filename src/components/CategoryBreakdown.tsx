import React from 'react';
import { CategoryStat } from '../types/avito';
import { formatNumber, formatPrice } from '../utils/analyzer';
import { Package, ArrowRight, Zap } from 'lucide-react';

interface CategoryBreakdownProps {
  categories: CategoryStat[];
  onSelectCategory: (category: string) => void;
  selectedCategory: string | null;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  onSelectCategory,
  selectedCategory,
}) => {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-neutral-600" />
            <span>Эффективность по направлениям и категориям</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Распределение трафика, доли продвижения и средних чеков по категориям каталога
          </p>
        </div>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-md transition-colors self-start sm:self-auto"
          >
            Сбросить фильтр категории
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold">
              <th className="py-3 px-4">Категория / Направление</th>
              <th className="py-3 px-3 text-right">Позиций</th>
              <th className="py-3 px-3 text-right">Доля трафика</th>
              <th className="py-3 px-3 text-right">Всего просмотров</th>
              <th className="py-3 px-3 text-right">Просмотров сегодня</th>
              <th className="py-3 px-3 text-right">На продвижении</th>
              <th className="py-3 px-3 text-right">Ср. цена в объявлении</th>
              <th className="py-3 px-4 text-center">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/70">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.group;
              return (
                <tr
                  key={cat.group}
                  onClick={() => onSelectCategory(cat.group)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-100/80 font-medium' : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">{cat.group}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-neutral-900 text-white px-1.5 py-0.2 rounded font-medium">
                          Выбрано
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums text-neutral-700">
                    {cat.count} шт.
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="tabular-nums font-semibold text-neutral-900">{cat.viewsShare}%</span>
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-neutral-800 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(4, cat.viewsShare))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-neutral-900">
                    {formatNumber(cat.totalViews)}
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums">
                    {cat.viewsToday > 0 ? (
                      <span className="text-emerald-600 font-semibold">+{cat.viewsToday}</span>
                    ) : (
                      <span className="text-neutral-400">0</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums text-neutral-700">
                    <div className="inline-flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${cat.promotedCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}`} />
                      <span>{cat.promotedCount} из {cat.count}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums text-neutral-800">
                    {formatPrice(cat.avgPrice)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-neutral-700 hover:text-neutral-950 font-medium"
                    >
                      <span>Фильтр</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
