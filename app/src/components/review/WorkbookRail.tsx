"use client";

import type { FindingState } from "@/types";
import { tally } from "@/store";

export function WorkbookRail({
  states,
  total,
  onCompile,
  onReturn,
}: {
  states: Record<string, FindingState>;
  total: number;
  onCompile?: () => void;
  onReturn?: () => void;
}) {
  const t = tally(states);
  const decided = total - t.pending;
  const pct = total ? Math.round((decided / total) * 100) : 0;

  return (
    <aside className="workbook">
      <div className="card wb-card">
        <div className="wb-head">
          <h3>
            <span className="material-icons">menu_book</span>
            Workbook
          </h3>
          <div className="sub">{decided} of {total} findings dispositioned</div>
        </div>

        <div className="wb-stats">
          <div className="wb-stat accept">
            <div className="v">{t.accepted}</div>
            <div className="k">Accepted</div>
          </div>
          <div className="wb-stat override">
            <div className="v">{t.override}</div>
            <div className="k">Overridden</div>
          </div>
          <div className="wb-stat reject">
            <div className="v">{t.rejected}</div>
            <div className="k">Rejected</div>
          </div>
          <div className="wb-stat">
            <div className="v">{t.pending}</div>
            <div className="k">Pending</div>
          </div>
        </div>

        <div className="wb-progress">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--md-on-surface-v)",
              marginBottom: 5,
            }}
          >
            <span>Review progress</span>
            <span>{pct}%</span>
          </div>
          <div className="progress">
            <div
              className="bar"
              style={{ width: `${pct}%`, transition: "width .35s" }}
            />
          </div>
        </div>

        <div className="wb-foot">
          <button className="btn btn-filled" onClick={onCompile}>
            <span className="material-icons">description</span>
            Compile workbook
          </button>
          <button className="btn btn-outline" onClick={onReturn}>
            <span className="material-icons">undo</span>
            Return to appraiser
          </button>
        </div>
      </div>
    </aside>
  );
}
