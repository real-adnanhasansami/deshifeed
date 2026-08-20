"use client";

import { useEffect, useState } from "react";
import { isGoogleDriveLink } from "@/lib/utils";

export default function LinkPreview({ url }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!url) return;

    if (isGoogleDriveLink(url)) {
      setData({
        url,
        title: "Google Drive file",
        description: "Opens in Google Drive.",
        image: "",
        siteName: "drive.google.com",
        isDrive: true,
      });
      return;
    }

    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          if (json.error) setFailed(true);
          else setData(json);
        }
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url || failed) return null;
  if (!data) {
    return <div className="mt-2 h-14 rounded-lg border border-brand-borderLight dark:border-brand-borderDark animate-pulse" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex gap-3 rounded-lg border border-brand-borderLight dark:border-brand-borderDark overflow-hidden hover:border-brand-accent transition-colors"
    >
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.image} alt="" className="w-20 h-20 object-cover flex-shrink-0" />
      )}
      {data.isDrive && (
        <div className="w-14 h-14 m-2 flex-shrink-0 flex items-center justify-center rounded bg-brand-accent/10 text-brand-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.71 3.5L1.15 15l3.43 5.97L11.14 9.47zM9.02 21.97h11.7L24 15h-11.7zM12.86 9.47l6.69 11.6 3.44-5.97L16.29 3.5z" />
          </svg>
        </div>
      )}
      <div className="py-2 pr-3 min-w-0">
        <p className="text-sm font-medium truncate">{data.title}</p>
        {data.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{data.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{data.siteName}</p>
      </div>
    </a>
  );
}
