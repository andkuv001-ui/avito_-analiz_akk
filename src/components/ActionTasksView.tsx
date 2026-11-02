import React from 'react';
import { ActionTask, AvitoListing } from '../types/avito';
import { CheckCircle2, Circle, ArrowRight, Check, Sparkles, Filter } from 'lucide-react';

interface ActionTasksViewProps {
  tasks: ActionTask[];
  onToggleTask: (taskId: string) => void;
  onFilterByListingIds?: (ids: string[]) => void;
  onOpenListingById?: (id: string) => void;
}

export const ActionTasksView: React.FC<ActionTasksViewProps> = ({
  tasks,
  onToggleTask,
  onFilterByListingIds,
}) => {
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Progress Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-neutral-800" />
              <span>План действий по оптимизации профиля</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Пошаговые задачи авитолога, сформированные на основе аудита действующих объявлений
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-neutral-700 tabular-nums">
              Выполнено {completedCount} из {tasks.length}
            </span>
            <div className="w-28 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-neutral-900 tabular-nums">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isHigh = task.priority === 'high';
          const isMedium = task.priority === 'medium';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-neutral-50/60 border-neutral-200 opacity-60'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-neutral-400 hover:text-neutral-900 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300 hover:text-neutral-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {isHigh ? 'Высокий приоритет' : isMedium ? 'Средний приоритет' : 'Низкий приоритет'}
                    </span>
                    <span className="text-xs text-neutral-400">·</span>
                    <span className="text-xs font-medium text-neutral-500">{task.category}</span>
                  </div>

                  <h4
                    className={`text-sm font-bold text-neutral-900 ${
                      task.completed ? 'line-through text-neutral-500' : ''
                    }`}
                  >
                    {task.title}
                  </h4>

                  <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                    {task.description}
                  </p>

                  {task.targetListingIds && task.targetListingIds.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-neutral-400">
                        Затронуто объявлений: <strong className="text-neutral-700 tabular-nums">{task.targetListingIds.length}</strong>
                      </span>

                      {onFilterByListingIds && (
                        <button
                          type="button"
                          onClick={() => onFilterByListingIds(task.targetListingIds!)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-indigo-600 transition-colors"
                        >
                          <Filter className="w-3 h-3" />
                          <span>Показать эти объявления в таблице</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
