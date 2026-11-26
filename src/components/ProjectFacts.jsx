import React from "react";
import { Tooltip } from "antd";
import { orderedSceneLabelsFor } from "../domain";
import { fitLabels, learnerLevel, growthState } from "../projectFacts";

// 按完整词与剩余计数格式化紧凑胶囊文案，彻底避免半个词被省略号截断
function compactLabels(list, maxItems, maxPairChars, separator = " · ") {
  if (!list.length) return "";
  const count =
    list.length >= 2 &&
    maxItems >= 2 &&
    list[0].length + list[1].length <= maxPairChars
      ? 2
      : 1;
  const shown = list.slice(0, count);
  const rest = list.length - shown.length;
  return `${shown.join(separator)}${rest > 0 ? ` +${rest}` : ""}`;
}

export function ProjectFacts({ item, state, t }) {
  const zh = state.lang === "zh";
  const fit = fitLabels(item, state);
  const tasks = orderedSceneLabelsFor(item, t, state.task);
  const level = learnerLevel(item);

  const range =
    fit?.kind === "common"
      ? zh
        ? "跨专业通用"
        : "General"
      : fit?.labels?.length
        ? compactLabels(fit.labels, 2, zh ? 8 : 16, " / ")
        : null;
  const fitTooltip =
    fit?.kind === "specific" && fit.labels?.length
      ? `${zh ? "专业适用：" : "Disciplines: "}${fit.labels.join(" / ")}`
      : null;

  const maxTaskItems = range && range.length > (zh ? 9 : 14) ? 1 : 2;
  const taskSummary = tasks.length
    ? compactLabels(tasks, maxTaskItems, zh ? 8 : 18, " · ")
    : zh
      ? "未分类"
      : "Unclassified";
  const taskTooltip = tasks.length
    ? `${zh ? "适用场景：" : "Tasks: "}${tasks.join(" · ")}`
    : taskSummary;

  return (
    <div className="project-facts">
      <div className="project-fit-line">
        {range &&
          (fitTooltip ? (
            <Tooltip title={fitTooltip}>
              <span className={`discipline-card-fit fit-${fit.kind}`}>
                {range}
              </span>
            </Tooltip>
          ) : (
            <span className={`discipline-card-fit fit-${fit.kind}`}>
              {range}
            </span>
          ))}
        <Tooltip title={taskTooltip}>
          <span data-testid="card-tasks" className="card-tasks">
            {taskSummary}
          </span>
        </Tooltip>
        {level && !range && (
          <Tooltip
            trigger={["hover", "focus", "click"]}
            title={`${level.quote} · ${level.source_url}`}
          >
            <span
              className="learner-level"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
            >
              {level.levels
                .map(
                  (id) =>
                    ({
                      undergraduate: zh ? "本科" : "Undergrad",
                      postgraduate: zh ? "硕博" : "Postgrad",
                      doctoral: zh ? "博士" : "PhD",
                      masters: zh ? "硕士" : "Master",
                    })[id],
                )
                .filter(Boolean)
                .join(" / ")}
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
export function GrowthValue({item,history,generatedAt,lang,fmt,withPeriod=false}) {
 const zh=lang==='zh',status=growthState(item,history,generatedAt);
 const title=status==='zero'?(zh?'已有至少7天历史记录，近7日净增量为0。':'At least 7 days of history; net change is zero.'):status==='short'?(zh?'历史快照尚未覆盖完整7日，当前非零数值仅作短期参考，不代表7日净增。':'No complete 7-day history; a nonzero value is short-term only, not a 7-day change.'):status==='unavailable'?(zh?'本次没有可用的7日增量数据。':'No 7-day growth value is available.'):(zh?'近7日Stars净变化':'Net Stars change over 7 days');
 const value=status==='value'?`${item.star_delta_7d>0?'+':''}${fmt(item.star_delta_7d)}`:status==='zero'?(zh?'无增长':'No change'):status==='short'?(item.star_delta_7d ? `${zh?'短期':'Short-term'} ${item.star_delta_7d>0?'+':''}${fmt(item.star_delta_7d)}` : (zh?'暂无7日对比':'No 7-day baseline')):(zh?'暂无增量数据':'Unavailable');
 return <span className={`growth-value growth-${status}`} title={title} aria-label={status==='value' || status==='zero' ? (zh?'近 7 日净增':'7-day net growth') : status==='short' ? (zh?'短期增量参考':'Short-term growth reference') : (zh?'增量数据不可用':'Growth unavailable')}>{withPeriod && status!=='short' && status!=='unavailable' && <span>{zh?'近 7 日 ':'7 days '}</span>}<strong>{value}</strong></span>;
}
