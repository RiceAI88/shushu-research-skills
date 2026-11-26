import React from "react";
import { Button, Select, Tag } from "antd";
import { HistoryOutlined, StarFilled, StarOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS } from "../domain";
export default function FilterControls({state,update,t,platformIds}) {
 return <>
            <label htmlFor="agentFilter">
              <span>{t("agentLabel")}</span>
              <Select
                id="agentFilter"
                getPopupContainer={node => node.parentElement}
                value={state.agent}
                onChange={(agent) => update((s) => ({ ...s, agent }))}
                options={[
                  { value: "all", label: t("allAgents") },
                  ...AGENT_PLATFORMS.filter((a) => platformIds.has(a.id)).map(
                    (a) => ({ value: a.id, label: a.label }),
                  ),
                ]}
              />
            </label>
            <label htmlFor="sortSelect">
              <span>{t("sortLabel")}</span>
              <Select
                id="sortSelect"
                getPopupContainer={node => node.parentElement}
                value={state.sort === "stars" ? "rank" : state.sort}
                onChange={(sort) => update((s) => ({ ...s, sort }))}
                options={[
                  ...(state.discipline !== "all" ? [["fit", state.lang === "zh" ? "专业适用优先" : "Discipline fit first"]] : []),
                  ["rank", "Stars"],
                  ["installs", t("sortInstalls")],
                  ["delta7", t("sortDelta7")],
                  ["newest", t("sortNewest")],
                  ["updated", t("sortUpdated")],
                  ["trend", t("sortTrend")],
                  ["delta30", t("sortDelta30")],
                ].map(([value, label]) => ({
                  value,
                  label: `${t("sortLabel")}：${label}`,
                }))}
              />
            </label>
              <Button
                aria-label={t("favoritesOnly")}
                data-testid="favorites-only"
                icon={
                  state.favOnly ? (
                    <StarFilled aria-hidden="true" />
                  ) : (
                    <StarOutlined aria-hidden="true" />
                  )
                }
                type={state.favOnly ? "primary" : "default"}
                aria-pressed={state.favOnly}
                onClick={() => update((s) => ({ ...s, favOnly: !s.favOnly }))}
              >
                <span className="favorite-filter-label">
                  {t("favoritesOnly")}
                </span>{" "}
                <Tag variant="borderless">{state.favorites.length}</Tag>
              </Button>
              <Button
                aria-label={t("recentOnly")}
                data-testid="recent-only"
                icon={<HistoryOutlined aria-hidden="true" />}
                type={state.recentOnly ? "primary" : "default"}
                aria-pressed={Boolean(state.recentOnly)}
                disabled={!(state.recent?.length > 0) && !state.recentOnly}
                onClick={() => update((s) => ({ ...s, recentOnly: !s.recentOnly }))}
              >
                <span className="favorite-filter-label">
                  {t("recentOnly")}
                </span>{" "}
                <Tag variant="borderless">{(state.recent || []).length}</Tag>
              </Button>
              <Button
                aria-label={t("activeOnly")}
                data-testid="active-only"
                icon={<ThunderboltOutlined aria-hidden="true" />}
                type={state.activeOnly ? "primary" : "default"}
                aria-pressed={Boolean(state.activeOnly)}
                onClick={() => update((s) => ({ ...s, activeOnly: !s.activeOnly }))}
              >
                <span className="favorite-filter-label">
                  {t("activeOnly")}
                </span>
              </Button>
              <Button
                data-testid="popover-web-ready"
                type={state.webReady ? "primary" : "default"}
                aria-pressed={Boolean(state.webReady)}
                onClick={() => update((s) => ({ ...s, webReady: !s.webReady }))}
              >
                {/* 与工具栏"免安装"开关共用鲜橙圆点，避免绿色 emoji 与全站点缀色不一致 */}
                <i className="web-ready-dot" aria-hidden="true" />
                {state.lang === "zh" ? "免安装 · 网页直用" : "Zero-install · Web AI"}
              </Button>

</>;
}
