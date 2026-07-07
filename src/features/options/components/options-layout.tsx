import { Toaster } from 'sonner';
import { Activity } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import { Badge } from '@/components/ui/badge';
import { SidebarProvider } from '@/components/ui/sidebar';

import type { OptionsTranslator, SectionId } from '../types';

import { OptionsSidebar } from './options-sidebar';
import { ARIA2_RPC_DOCS_URL, CHROME_MV3_DOCS_URL } from '../constants';

interface OptionsLayoutProps {
  active: SectionId;
  t: OptionsTranslator;
  children: React.ReactNode;
  snapshot: StorageSnapshot;
  onActiveChange: (section: SectionId) => void;
}

const badgeLinkClassName = 'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function OptionsLayout({ active, children, onActiveChange, snapshot, t }: OptionsLayoutProps) {
  return (
    <div className='flex min-h-dvh flex-col bg-(--m3-surface) text-foreground' data-density={snapshot.ui.density}>
      <Toaster richColors position='top-center' />
      <a
        href='#options-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground'
      >
        {t('options.skipToContent')}
      </a>
      <header className='border-b bg-(--m3-surface-container-low) px-8 pt-7 pb-4 max-[640px]:px-4 max-[640px]:pt-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3.5'>
            <div className='flex size-10 items-center justify-center rounded-full text-primary'>
              <Activity className='size-7' />
            </div>
            <div>
              <h1 className='text-[22px] font-bold tracking-[-0.01em]'>{t('options.title')}</h1>
              <p className='mt-0.5 text-[13px] text-muted-foreground'>{t('options.subtitle')}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <a
              href={CHROME_MV3_DOCS_URL}
              target='_blank'
              rel='noreferrer'
              className={badgeLinkClassName}
            >
              <Badge variant='secondary'>Chrome MV3</Badge>
            </a>
            <a
              href={ARIA2_RPC_DOCS_URL}
              target='_blank'
              rel='noreferrer'
              className={badgeLinkClassName}
            >
              <Badge variant='outline'>aria2 RPC</Badge>
            </a>
          </div>
        </div>
      </header>

      <main className='flex flex-1 py-(--options-main-y) max-[640px]:p-0'>
        <SidebarProvider className='min-h-0 flex-1 max-[640px]:flex-col' style={{ '--sidebar-width': '16rem' } as React.CSSProperties}>
          <OptionsSidebar active={active} t={t} onActiveChange={onActiveChange} />
          <div id='options-content' className='min-w-0 flex-1 px-6 pt-1 pb-8 max-[640px]:px-4 max-[640px]:pt-4'>
            {children}
          </div>
        </SidebarProvider>
      </main>
    </div>
  );
}
