import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import type { OptionsTranslator, SectionId } from '../types';

import { optionsSections } from '../constants';

interface OptionsSidebarProps {
  active: SectionId;
  t: OptionsTranslator;
  onActiveChange: (section: SectionId) => void;
}

export function OptionsSidebar({ active, onActiveChange, t }: OptionsSidebarProps) {
  return (
    <Sidebar className='border-border max-[640px]:w-full max-[640px]:border-r-0 max-[640px]:border-b'>
      <SidebarContent className='py-2 max-[640px]:py-0'>
        <SidebarGroup className='px-3 py-2 max-[640px]:px-3'>
          <SidebarMenu className='items-center gap-(--options-nav-gap) max-[640px]:flex-row max-[640px]:items-stretch max-[640px]:overflow-x-auto'>
            {optionsSections.map((section) => {
              const Icon = section.icon;
              const isActive = active === section.id;
              return (
                <SidebarMenuItem key={section.id} className='w-full max-[640px]:w-auto'>
                  <SidebarMenuButton
                    type='button'
                    isActive={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onActiveChange(section.id)}
                    className='group mx-auto min-h-12 w-full justify-start gap-3 rounded-2xl border border-transparent px-3.5 py-(--options-nav-item-y) text-[15px] font-semibold data-[active=true]:border-primary/35 data-[active=true]:shadow-(--m3-shadow-elevated) max-[640px]:min-w-36 max-[640px]:px-3 max-[640px]:py-2 max-[640px]:text-sm'
                  >
                    <span className='flex size-9 shrink-0 items-center justify-center rounded-xl max-[640px]:size-8'>
                      <Icon className='size-5 max-[640px]:size-4' />
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
