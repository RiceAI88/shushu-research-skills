import React,{useEffect,useId,useRef,useState} from 'react';
import {Drawer,Popover} from 'antd';

export function FilterPopover({label,children,count,lang}) {
 const [open,setOpen]=useState(false),[hasOpened,setHasOpened]=useState(false);
 const [mobile,setMobile]=useState(()=>matchMedia('(max-width:760px)').matches);
 const trigger=useRef(null),id=useId(),title=lang==='zh'?'筛选条件':'Filters',closeLabel=lang==='zh'?'关闭':'Close';
 useEffect(()=>{
  const query=matchMedia('(max-width:760px)');const changed=()=>{setMobile(query.matches);setOpen(false);};
  query.addEventListener('change',changed);return()=>query.removeEventListener('change',changed);
 },[]);
 const change=value=>{setOpen(value);if(value)setHasOpened(true);};
 const close=()=>{setOpen(false);trigger.current?.focus();};
 const body=hasOpened?(typeof children==='function'?children():children):null;
 const button=<button ref={trigger} type="button" className="popover-trigger" aria-expanded={open} aria-controls={id} aria-haspopup="dialog" onClick={mobile?()=>change(!open):undefined}>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>{label}{count>0&&<span className="filter-condition-count">{count}</span>}
 </button>;
 return <div className="action-popover filter-control">
  {mobile?<>{button}<Drawer open={open} onClose={close} placement="bottom" size="auto" title={title} closable={{'aria-label':closeLabel}} className="filter-overlay" rootClassName="filter-overlay" styles={{section:{borderRadius:'18px 18px 0 0',maxHeight:'80dvh'},body:{padding:20}}}><div id={id} className="filter-panel-content">{body}</div></Drawer></>:<Popover trigger="click" placement="bottomRight" arrow={false} open={open} onOpenChange={change} classNames={{root:'filter-overlay'}} styles={{container:{padding:18}}} content={<div id={id} role="dialog" aria-label={title} className="filter-panel-content" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close();}}}><div className="popover-panel-heading"><strong>{title}</strong><button type="button" aria-label={closeLabel} onClick={close}>×</button></div>{body}</div>}>{button}</Popover>}
 </div>;
}
