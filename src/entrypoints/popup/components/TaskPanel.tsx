import type { RuntimeState } from '@/library/messages';

import { TaskRow } from '@/components/motrix/task-row';

import type { PopupTranslator, TaskLane } from '../types';

interface TaskPanelProps {
  t: PopupTranslator;
  activeLane: TaskLane;
  runtime: RuntimeState;
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string, status: RuntimeState['tasks']['active'][number]['status']) => void;
}

export function TaskPanel({
  activeLane,
  runtime,
  onPause,
  onResume,
  onRemove,
  t,
}: TaskPanelProps) {
  return (
    <section data-reveal className='mx-3 mt-1 rounded-xl border bg-(--m3-surface-container) p-2.5 shadow-(--m3-shadow-card)'>
      <TaskList
        tone={activeLane}
        tasks={runtime.tasks[activeLane]}
        empty={t('popup.noTasks')}
        onPause={onPause}
        onResume={onResume}
        onRemove={onRemove}
      />
    </section>
  );
}

function TaskList({
  tone,
  tasks,
  empty,
  onPause,
  onResume,
  onRemove,
}: {
  tone: TaskLane;
  tasks: RuntimeState['tasks']['active'];
  empty: string;
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string, status: RuntimeState['tasks']['active'][number]['status']) => void;
}) {
  return (
    <div className='min-h-[92px]'>
      {tasks.length
        ? (
            <div className='max-h-[268px] min-h-[92px] space-y-2 overflow-y-auto pr-1'>
              {tasks.map((task) => (
                <TaskRow
                  key={task.gid}
                  task={task}
                  tone={tone}
                  onPause={onPause}
                  onResume={onResume}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )
        : (
            <div className='pointer-events-none flex h-[92px] items-center justify-center rounded-md border border-dashed bg-(--m3-surface) p-5 text-center text-sm text-muted-foreground'>
              {empty}
            </div>
          )}
    </div>
  );
}
