import {FilterPopover} from './FilterPopover';
import React, { useId, useRef, useState } from 'react';
export function ActionPopover({label, children, className='', count=0, filter=false, lang='zh'}) {
 const id=useId(), trigger=useRef(null), panel=useRef(null);
 const [open,setOpen]=useState(false);
 if(filter)return <FilterPopover {...{label,children,count,lang}}/>;
 const place = () => {
  if (!trigger.current || !panel.current) return;
  const box = trigger.current.getBoundingClientRect();
  const panelHeight = panel.current.offsetHeight || 220;
  const margin = 12;
  const topBelow = box.bottom + 8;
  const flipUp = topBelow + panelHeight > innerHeight - margin;
  const top = flipUp
   ? Math.max(margin, Math.min(innerHeight - panelHeight - margin, box.top - panelHeight - 8))
   : topBelow;
  const alignLeft = box.right < 356 && box.left + 340 <= innerWidth - margin;
  const left = alignLeft
   ? Math.max(margin, box.left)
   : Math.max(margin, Math.min(innerWidth - 352, box.right - 340));
  panel.current.style.top = `${Math.round(top)}px`;
  panel.current.style.setProperty('--popover-left', `${Math.round(left)}px`);
  panel.current.dataset.origin = `${flipUp ? 'bottom' : 'top'}-${alignLeft ? 'left' : 'right'}`;
 };
 return <div className={`action-popover ${className}`}>
  <button ref={trigger} type="button" className="popover-trigger" popoverTarget={id} aria-expanded={open} aria-controls={id} onPointerDown={place} onFocus={place} onClick={place}>{label}{count>0 && <span className="filter-condition-count">{count}</span>}</button>
  <div ref={panel} id={id} popover="auto" role="dialog" aria-hidden={!open || undefined} aria-label={label} className="action-popover-panel" onToggle={e=>{const next=e.newState==='open';setOpen(next);if(next)place();}}>
   <div className="popover-panel-heading"><strong>{label}</strong><button type="button" aria-label={lang==='zh'?'关闭':'Close'} onClick={()=>{panel.current.hidePopover();trigger.current.focus();}}>×</button></div>
   {typeof children === "function" ? (open ? children() : null) : children}
  </div>
 </div>;
}
