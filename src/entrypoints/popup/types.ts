import type { RuntimeState } from '@/library/messages';

export type PopupStatus = 'connecting' | 'connected' | 'offline';

export type PopupTranslator = (key: string, values?: Record<string, string | number>) => string;

export type TaskLane = keyof RuntimeState['tasks'];
