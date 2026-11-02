import React from 'react';
import { Upload, Download, Sparkles, Layers, ChevronDown, Share2 } from 'lucide-react';
import { PRESETS } from '../data/presetProfiles';

interface HeaderProps {
  activeTab: 'overview' | 'listings' | 'categories' | 'tasks';
  setActiveTab: (tab: 'overview' | 'listings' | 'categories' | 'tasks') => void;
  sellerName: string;
  businessTypeLabel: string;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenAiSummary: () => void;
  criticalIssuesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sellerName,
  businessTypeLabel,
  activePresetId,
  onSelectPreset,
  onOpenUpload,
  onOpenExport,
  onOpenAiSummary,
  criticalIssuesCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark Brand & Dynamic Niche */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-extrabold text-base tracking-tight">
              АП
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-neutral-900 whitespace-nowrap leading-tight">
                АвитоПульс
              </span>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 whitespace-nowrap">
                <span className="font-medium text-neutral-700">{sellerName}</span>
                <span>·</span>
                <span className="text-neutral-500">{businessTypeLabel}</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              Сводный обзор
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'listings'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              Все позиции
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              Категории & Ниши
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <span>Задачи авитолога</span>
              {criticalIssuesCount > 0 && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                  {criticalIssuesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Action & Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Demo Preset Switcher */}
            <div className="hidden xl:flex items-center gap-1 mr-1">
              <span className="text-[11px] text-neutral-400">Демо:</span>
              <select
                value={activePresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="py-1 px-2 text-xs bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 rounded-lg text-neutral-800 font-medium cursor-pointer focus:outline-none"
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
                {activePresetId === 'custom' && (
                  <option value="custom">Пользовательский CSV</option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenAiSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
              title="Запустить AI аудит профиля"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">AI Аудит</span>
            </button>

            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 rounded-lg transition-colors whitespace-nowrap"
              title="Переслать отчет клиенту (Telegram, PDF, ссылка, Excel)"
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Отчет клиенту</span>
            </button>

            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Загрузить CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
