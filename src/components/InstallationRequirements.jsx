import React from "react";
import editorialContexts from "../../config/editorial.json?contexts";
import { EditorialReviewNotice } from "./EditorialReviewNotice";
import { safeExternalUrl } from "../domain";
import { installationFor, reviewedInstallSnapshot } from "../practical";

export function InstallationRequirements({ item, lang, t, detailsInfo = {} }) {
  const installation = installationFor(item);
  const lazyCtx = editorialContexts?.[item.repo];
  const contextText =
    installation[`context_${lang}`] ||
    (Array.isArray(lazyCtx) ? lazyCtx[lang === "zh" ? 0 : 1] : "");
  return (
    <div className="installation-evidence">
      {contextText && (
        <p className="installation-context">
          {contextText}
        </p>
      )}
      {installation.mode === "docs" && !installation.reviewed_at && (
        <p>{t("installUnreviewedHint")}</p>
      )}
      {(detailsInfo[`environment_${lang}`] ||
        detailsInfo[`dependencies_${lang}`]) && (
        <dl className="install-requirements">
          <div>
            <dt>{t("installEnvironment")}</dt>
            <dd data-testid="install-environment">
              {detailsInfo[`environment_${lang}`] || "—"}
            </dd>
          </div>
          <div>
            <dt>{t("installDependencies")}</dt>
            <dd data-testid="install-dependencies">
              {detailsInfo[`dependencies_${lang}`] || "—"}
            </dd>
          </div>
        </dl>
      )}
      <EditorialReviewNotice repo={item.repo} t={t} lang={lang} details />
      {installation.reviewed_at && (
        <div className="installation-review">
          <small>
            {t("docsChecked")} {installation.reviewed_at}
          </small>
          {reviewedInstallSnapshot(item, detailsInfo) && (
            <a
              href={reviewedInstallSnapshot(item, detailsInfo)}
              target="_blank"
              rel="noreferrer"
            >
              {t("installSnapshot")}
            </a>
          )}
          {(detailsInfo.additional_sources || [])
            .map((source) =>
              safeExternalUrl(
                typeof source === "string" ? source : source.source_url,
              ),
            )
            .filter(Boolean)
            .map((url, index) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {t("installMoreDocs")} {index + 1}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
