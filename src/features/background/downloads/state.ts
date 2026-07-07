import { DuplicateGuard } from '@/library/download/duplicate-guard';
import { RequestContextStore } from '@/library/download/request-context';
import { RedirectContextStore } from '@/library/download/redirect-context';
import { FilenameMetadataStore } from '@/library/download/filename-metadata';

export const requestContexts = new RequestContextStore();
export const filenameMetadata = new FilenameMetadataStore();
export const redirectContexts = new RedirectContextStore();
export const duplicateGuard = new DuplicateGuard();
