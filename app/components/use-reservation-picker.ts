'use client';

import { useEffect, type RefObject } from 'react';

// Non-modal pickers stay within the viewport and return focus to their trigger.
export function useReservationPicker(open:boolean, close:()=>void, trigger:RefObject<HTMLButtonElement|null>, popup:RefObject<HTMLDivElement|null>, monthKey='') {
  useEffect(()=>{
    if(!open)return;
    const focusButton=(button:HTMLElement|undefined|null)=>{
      const panel=popup.current;
      if(!button||!panel)return;
      button.focus({preventScroll:true});
      const item=button.getBoundingClientRect(), bounds=panel.getBoundingClientRect();
      if(item.bottom>bounds.bottom)panel.scrollTop+=item.bottom-bounds.bottom+8;
      else if(item.top<bounds.top)panel.scrollTop-=bounds.top-item.top+8;
    };
    const place=()=>{
      const anchor=trigger.current, panel=popup.current;
      if(!anchor||!panel)return;
      const margin=12, gap=8;
      const rect=anchor.getBoundingClientRect();
      panel.style.position='fixed';
      panel.style.width=`${Math.min(360,window.innerWidth-margin*2)}px`;
      panel.style.maxHeight=`${window.innerHeight-margin*2}px`;
      panel.style.overflowY='auto';
      const height=panel.getBoundingClientRect().height;
      const below=window.innerHeight-rect.bottom-gap-margin, above=rect.top-gap-margin;
      const down=height<=below||below>=above;
      const available=Math.max(44,down?below:above);
      const shown=Math.min(height,available);
      panel.style.maxHeight=`${available}px`;
      panel.style.left=`${Math.max(margin,Math.min(rect.left,window.innerWidth-panel.getBoundingClientRect().width-margin))}px`;
      panel.style.top=`${Math.max(margin,Math.min(down?rect.bottom+gap:rect.top-gap-shown,window.innerHeight-shown-margin))}px`;
    };
    const frame=requestAnimationFrame(()=>{
      place();
      const panel=popup.current;
      focusButton(panel?.querySelector<HTMLElement>('.calendarGrid button.selected:not(:disabled),[role="option"][aria-selected="true"]')
        ||panel?.querySelector<HTMLElement>('.calendarGrid button:not(:disabled),[role="option"]'));
    });
    const dismiss=(event:PointerEvent|FocusEvent)=>{
      const node=event.target as Node;
      if(!popup.current?.contains(node)&&!trigger.current?.contains(node))close();
    };
    const keys=(event:KeyboardEvent)=>{
      const panel=popup.current;
      if(event.key==='Escape'){event.preventDefault();close();trigger.current?.focus({preventScroll:true});return;}
      if(!panel?.contains(event.target as Node))return;
      const calendar=!!panel.querySelector('.calendarGrid');
      const buttons=Array.from(panel.querySelectorAll<HTMLButtonElement>(calendar?'.calendarGrid button':'[role="option"]'));
      const current=buttons.indexOf(document.activeElement as HTMLButtonElement);
      if(current<0)return;
      const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?(calendar?7:1):event.key==='ArrowUp'?(calendar?-7:-1):0;
      if(!step&&event.key!=='Home'&&event.key!=='End')return;
      event.preventDefault();
      let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:current+step;
      while(next>=0&&next<buttons.length&&buttons[next].disabled)next+=step<0||event.key==='End'?-1:1;
      focusButton(buttons[next]);
    };
    window.addEventListener('resize',place);
    window.addEventListener('scroll',place,true);
    document.addEventListener('pointerdown',dismiss);
    document.addEventListener('focusin',dismiss);
    document.addEventListener('keydown',keys);
    return()=>{
      cancelAnimationFrame(frame);
      window.removeEventListener('resize',place);
      window.removeEventListener('scroll',place,true);
      document.removeEventListener('pointerdown',dismiss);
      document.removeEventListener('focusin',dismiss);
      document.removeEventListener('keydown',keys);
    };
  },[open,close,trigger,popup,monthKey]);
}
