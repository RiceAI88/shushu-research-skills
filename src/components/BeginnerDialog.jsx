import React,{lazy,useLayoutEffect,useRef,useState} from 'react';
import {Modal} from 'antd';
import {DeferredFeature} from './DeferredFeature';
import {OverlaySkeleton} from './OverlaySkeleton';
const BeginnerGuide=lazy(()=>import('./BeginnerGuide'));

// The Modal opens before optional guide code finishes loading.
export function BeginnerDialog({section,lang,items,t,onClose,onOpenRepo}) {
 const session=useRef(0),[content,setContent]=useState(null),zh=lang==='zh';
 useLayoutEffect(()=>{if(section)setContent({section,key:++session.current});},[section]);
 return <Modal open={Boolean(section)} onCancel={onClose} afterClose={()=>setContent(null)} centered width={940} footer={null} className="beginner-guide" rootClassName="beginner-modal" title={zh?'科研 Skills 入门':'Research Skills starter guide'} closable={{'aria-label':zh?'关闭入门指南':'Close starter guide'}}>
  {content && <DeferredFeature t={t} loadingFallback={<OverlaySkeleton lang={lang}/>}><BeginnerGuide key={content.key} initialSection={content.section} {...{lang,items,onClose,onOpenRepo}}/></DeferredFeature>}
 </Modal>;
}
