"use client";

// Renders the response body with merge tokens resolved against a sample finding,
// highlighting each substituted value so the reviewer sees what recipients get.
const SAMPLE: Record<string, string> = {
  topic: "the selected capitalization rate",
  page: "65",
  detail: "the comparables predate the effective date",
  action: "re-run the income approach with current comparables",
  condition: "a satisfactory Phase I environmental report",
  property: "Riverside Data Center",
};

const TOKEN = /(\{\{\s*\w+\s*\}\})/g;

export function LivePreview({ body }: { body: string }) {
  const parts = body.split(TOKEN);
  return (
    <div className="mf-preview">
      <div className="mf-preview-lb">Live preview — sample finding (cap rate, p. 65)</div>
      <p className="mf-preview-body">
        {body.trim() === "" ? (
          <span className="text-tertiary">Start typing the response body…</span>
        ) : (
          parts.map((p, i) => {
            const m = p.match(/^\{\{\s*(\w+)\s*\}\}$/);
            if (m) {
              const val = SAMPLE[m[1]];
              return (
                <mark key={i} className="mf-token">
                  {val ?? p}
                </mark>
              );
            }
            return <span key={i}>{p}</span>;
          })
        )}
      </p>
    </div>
  );
}
