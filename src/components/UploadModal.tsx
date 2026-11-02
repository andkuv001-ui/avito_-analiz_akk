import React, { useState, useRef } from 'react';
import { X, Upload, FileText, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCsvLoaded: (csvContent: string) => void;
  onReloadDefault: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onCsvLoaded,
  onReloadDefault,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Пожалуйста, выберите файл с расширением .csv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content && content.trim()) {
        onCsvLoaded(content);
        onClose();
      } else {
        setError('Файл пуст или поврежден');
      }
    };
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-neutral-200 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              Загрузить таблицу объявлений Avito
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Поддерживается любая выгрузка из кабинета Авито (товары, услуги, запчасти, оборудование) в формате CSV
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

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            accept=".csv,.txt"
            className="hidden"
          />
          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-900">
            Перетащите CSV-файл сюда или нажмите для выбора
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Кодировка UTF-8 или Windows-1251, разделитель точка с запятой (;) или запятая (,)
          </p>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onReloadDefault();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Вернуть исходный пример (Упаковочные материалы)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
