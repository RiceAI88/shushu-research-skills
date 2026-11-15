import React from 'react';
import {Skeleton} from 'antd';
import {useSiteReducedMotion} from './SiteMotion';

export function OverlaySkeleton({kind='guide',lang='zh'}) {
 const reduced=useSiteReducedMotion();
 const label=lang==='zh'?(kind==='guide'?'正在加载入门指南…':'正在加载筛选条件…'):(kind==='guide'?'Loading the starter guide…':'Loading filters…');
 return <div className={`overlay-skeleton overlay-skeleton-${kind}`} role="status" aria-label={label} aria-busy="true">
  <span className="overlay-skeleton-caption">{label}</span>
  {Array.from({length:kind==='guide'?3:2},(_,index)=><Skeleton key={index} active={!reduced} title={{width:'35%'}} paragraph={{rows:kind==='guide'?3:1}}/>)}
 </div>;
}
