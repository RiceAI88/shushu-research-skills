import React from 'react';
import {Skeleton} from 'antd';
import {useSiteReducedMotion} from './SiteMotion';

export function OverlaySkeleton({kind='guide',lang='zh'}) {
 const reduced=useSiteReducedMotion();
 const zh=lang==='zh';
 const label=kind==='drawer'
  ?(zh?'正在加载项目详情与上手指南…':'Loading project details & quick-start guide…')
  :kind==='guide'
   ?(zh?'正在加载入门指南…':'Loading the starter guide…')
   :(zh?'正在加载筛选条件…':'Loading filters…');
 const blocks=kind==='drawer'?[2,4,2]:kind==='guide'?[3,3,3]:[1,1];
 return <div className={`overlay-skeleton overlay-skeleton-${kind}`} role="status" aria-label={label} aria-busy="true">
  <span className="overlay-skeleton-caption">{label}</span>
  {blocks.map((rows,index)=><Skeleton key={index} active={!reduced} title={{width:index===0?'42%':'32%'}} paragraph={{rows}}/>)}
 </div>;
}
