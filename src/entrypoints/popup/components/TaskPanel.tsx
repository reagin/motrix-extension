import type { RuntimeState } from '@/library/messages';

import { TaskRow } from '@/components/motrix/task-row';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { PopupTranslator, TaskLane } from '../types';

interface TaskPanelProps {
  t: PopupTranslator;
  runtime: RuntimeState;
  onPause: (gid: string) => void;
  onRemove: (gid: string) => void;
  onResume: (gid: string) => void;
}

const lanes: TaskLane[] = ['active', 'waiting', 'stopped'];

export function TaskPanel({ runtime, onPause, onResume, onRemove, t }: TaskPanelProps) {
  return (
    <section data-reveal className='mx-3 mt-2 rounded-xl border bg-(--m3-surface-container) p-2.5 shadow-(--m3-shadow-card)'>
      <Tabs defaultValue='active'>
        <TabsList className='grid h-8 w-full grid-cols-3 bg-(--m3-surface-container-high)'>
          {lanes.map((lane) => (
            <TabsTrigger key={lane} value={lane}>
              {t(`common.${lane}`)}
              {' '}
              <span className='ml-1 text-xs text-muted-foreground'>{runtime.tasks[lane].length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {lanes.map((lane) => (
          <TaskList
            key={lane}
            value={lane}
            tasks={runtime.tasks[lane]}
            empty={t('popup.noTasks')}
            onPause={onPause}
            onResume={onResume}
            onRemove={onRemove}
          />
        ))}
      </Tabs>
    </section>
  );
}

function TaskList({
  value,
  tasks,
  empty,
  onPause,
  onResume,
  onRemove,
}: {
  value: string;
  tasks: RuntimeState['tasks']['active'];
  empty: string;
  onPause: (gid: string) => void;
  onResume: (gid: string) => void;
  onRemove: (gid: string) => void;
}) {
  return (
    <TabsContent value={value} className='mt-2'>
      {tasks.length
        ? (
            <div className='max-h-[268px] space-y-2 overflow-y-auto pr-1'>
              {tasks.map((task) => (
                <TaskRow
                  key={task.gid}
                  task={task}
                  onPause={onPause}
                  onResume={onResume}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )
        : (
            <div className='pointer-events-none flex min-h-[92px] items-center justify-center rounded-md border border-dashed bg-(--m3-surface) px-5 py-5 text-center text-sm text-muted-foreground'>
              {empty}
            </div>
          )}
    </TabsContent>
  );
}
