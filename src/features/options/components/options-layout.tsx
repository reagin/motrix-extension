import { Toaster } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { Activity, Menu, X } from 'lucide-react';
import { type CSSProperties, type ReactNode, useCallback, useState } from 'react';

import type { StorageSnapshot } from '@/library/storage';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';

import type { OptionsTranslator, SectionId } from '../types';

import { OptionsSidebar } from './options-sidebar';
import { ARIA2_RPC_DOCS_URL, CHROME_MV3_DOCS_URL } from '../constants';

interface OptionsLayoutProps {
  active: SectionId;
  children: ReactNode;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  onActiveChange: (section: SectionId) => void;
}

const badgeLinkClassName = 'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function OptionsLayout({ active, children, onActiveChange, snapshot, t }: OptionsLayoutProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const closeMobileNavigation = useCallback(() => {
    setMobileNavigationOpen(false);
  }, []);

  const handleActiveChange = useCallback((section: SectionId) => {
    onActiveChange(section);
  }, [onActiveChange]);

  return (
    <div className='flex h-dvh min-h-0 flex-col overflow-hidden bg-(--m3-surface) text-foreground' data-density={snapshot.ui.density}>
      <Toaster richColors position='top-center' />
      <a
        href='#options-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground'
      >
        {t('options.skipToContent')}
      </a>
      <header className='shrink-0 border-b bg-(--m3-surface-container-low) px-8 pt-7 pb-4 max-[640px]:px-4 max-[640px]:py-3'>
        <div className='flex min-w-0 items-center justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-3.5'>
            <Button
              type='button'
              variant='quiet'
              size='icon'
              aria-label={t('options.openNavigation')}
              aria-controls='options-mobile-navigation'
              aria-expanded={mobileNavigationOpen}
              onClick={() => setMobileNavigationOpen(true)}
              className='hidden size-11 shrink-0 rounded-xl max-[640px]:inline-flex'
            >
              <Menu />
            </Button>
            <div className='flex size-10 items-center justify-center rounded-full text-primary'>
              <Activity className='size-7' />
            </div>
            <div className='min-w-0'>
              <h1 className='truncate text-[22px] font-bold tracking-[-0.01em]'>{t('options.title')}</h1>
              <p className='mt-0.5 text-[13px] text-muted-foreground max-[640px]:hidden'>{t('options.subtitle')}</p>
            </div>
          </div>
          <div className='flex items-center gap-2 max-[640px]:hidden'>
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

      <Dialog.Root open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className='fixed inset-0 z-40 bg-black/45 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 min-[641px]:hidden' />
          <Dialog.Content
            id='options-mobile-navigation'
            className='fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col border-r bg-(--m3-surface) shadow-(--m3-shadow-elevated) outline-none transition-transform duration-200 ease-out data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 min-[641px]:hidden'
          >
            <div className='flex shrink-0 items-center justify-between border-b bg-(--m3-surface-container-low) px-4 py-3'>
              <Dialog.Title className='text-sm font-semibold'>{t('options.navigation')}</Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  type='button'
                  variant='quiet'
                  size='icon'
                  aria-label={t('options.closeNavigation')}
                  className='size-11 rounded-xl'
                >
                  <X />
                </Button>
              </Dialog.Close>
            </div>
            <OptionsSidebar
              active={active}
              t={t}
              onActiveChange={handleActiveChange}
              onNavigate={closeMobileNavigation}
              className='w-full flex-1 border-r-0'
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className='flex min-h-0 flex-1 overflow-hidden py-(--options-main-y) max-[640px]:p-0'>
        <SidebarProvider className='min-h-0 flex-1 overflow-hidden' style={{ '--sidebar-width': '16rem' } as CSSProperties}>
          <OptionsSidebar active={active} t={t} onActiveChange={handleActiveChange} className='max-[640px]:hidden' />
          <div id='options-content' className='min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-1 pb-8 max-[640px]:px-4 max-[640px]:pt-4'>
            {children}
          </div>
        </SidebarProvider>
      </main>
    </div>
  );
}
