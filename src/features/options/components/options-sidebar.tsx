import { cn } from '@/library/utils';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import type { OptionsTranslator, SectionId } from '../types';

import { optionsSections } from '../constants';

interface OptionsSidebarProps {
  active: SectionId;
  className?: string;
  t: OptionsTranslator;
  onNavigate?: () => void;
  onActiveChange: (section: SectionId) => void;
}

export function OptionsSidebar({ active, className, onActiveChange, onNavigate, t }: OptionsSidebarProps) {
  return (
    <Sidebar className={cn('h-full shrink-0 overflow-hidden border-border', className)}>
      <SidebarContent className='overflow-hidden'>
        <SidebarGroup className='px-4 py-2'>
          <SidebarMenu className='items-center gap-(--options-nav-gap)'>
            {optionsSections.map((section) => {
              const Icon = section.icon;
              const isActive = active === section.id;
              return (
                <SidebarMenuItem key={section.id} className='w-full'>
                  <SidebarMenuButton
                    type='button'
                    isActive={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      onActiveChange(section.id);
                      onNavigate?.();
                    }}
                    className='group mx-auto min-h-12 w-full justify-start gap-3 rounded-2xl border border-transparent px-3.5 py-(--options-nav-item-y) text-[15px] font-semibold data-[active=true]:border-primary/35 data-[active=true]:shadow-(--m3-shadow-elevated)'
                  >
                    <span className='flex size-9 shrink-0 items-center justify-center rounded-xl'>
                      <Icon className='size-5' />
                    </span>
                    <span className='min-w-0 truncate'>{t(section.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
