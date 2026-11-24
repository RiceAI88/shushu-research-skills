import React from "react";
import { Button, Space } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import { installationFor } from "../practical";
import { CopyInstallButton, InstallationMode } from "./PracticalInfo";

export function InstallationActions({
  item,
  lang,
  t,
  details = false,
  compact = false,
  hideExtras = false,
}) {
  const installation = installationFor(item);
  return (
    <div
      className={`installation-actions${details ? " installation-details" : " installation-compact"}${compact ? " installation-inline" : ""}`}
      onClick={(event) => {
        if (event.target.closest("button,a")) event.stopPropagation();
      }}
    >
      {!(details && installation.command) && (
        <div className="installation-status">
          <InstallationMode item={item} t={t} short={compact} />
        </div>
      )}
      {!compact && !details && installation[`context_${lang}`] && (
        <div className="installation-context">
          {installation[`context_${lang}`]}
        </div>
      )}
      {details && installation.command && (
        <div className="install-command-block">
          <div className="install-command-heading">
            <span className="install-command-title">
              <span>{t("installCommandHeading")}</span>
              <InstallationMode item={item} t={t} short={compact} />
            </span>
            <CopyInstallButton item={item} t={t} primary />
          </div>
          <pre className="install-command" tabIndex={0}>
            {installation.command}
          </pre>
        </div>
      )}
      {details && hideExtras && installation[`context_${lang}`] && (
        <p className="installation-context-inline">
          {installation[`context_${lang}`]}
        </p>
      )}
      <Space size={[4, 6]} wrap>
        {!details && <CopyInstallButton item={item} t={t} iconOnly={compact} />}
        <Button
          size="small"
          type={compact ? "text" : "link"}
          icon={<ExportOutlined aria-hidden="true" />}
          aria-label={t(
            ["docs", "reference"].includes(installation.mode)
              ? "projectDocs"
              : "installDocs",
          )}
          href={installation.source_url}
          target="_blank"
          rel="noreferrer"
        >
          {!compact &&
            t(
              ["docs", "reference"].includes(installation.mode)
                ? "projectDocs"
                : "installDocs",
            )}
        </Button>
      </Space>
    </div>
  );
}
