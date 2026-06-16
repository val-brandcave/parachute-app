# Parachute v2 — Key User Flows

> The critical journeys, as Mermaid flowcharts. Reflects the Jun 16 2026 IA decisions
> (see the decisions log in `parachute-v2-ia-map.md`). Companion to the route map and
> the card-board (`parachute-v2-ia-board.html`).

---

## 1. Core loop — Order → Technical Review → Workbook

```mermaid
flowchart TD
  A(["Order a review (global stepper modal)"]) --> B{"Source?"}
  B -->|"From YouConnect"| C["Pick delivery from inbox<br/>(remote search · import · dup warning)"]
  B -->|"Standalone"| D["Upload PDF + property form"]
  C --> E["Choose review types:<br/>Technical and/or Administrative"]
  D --> E
  E --> F["Assign reviewer + options<br/>(org defaults; overrides audited)"]
  F --> G[["Run pipeline"]]
  G --> H[/"Land in the new review<br/>Technical tab · running state S1–S5"/]
  H --> I{"Pipeline complete"}
  I --> J["Findings focus mode:<br/>one finding at a time, source docked"]
  J --> K{"Decide each finding"}
  K -->|"Accept (navy)"| L["Into workbook"]
  K -->|"Reject (navy) + reason"| N["Add to send-back batch"]
  K -->|"Disagree/Override · Comment · Add condition · Flag (⋯)"| L
  L --> O["Builder — customize panel<br/>(sections, theme, font, risk labels)"]
  N --> O
  O --> P["Workbook — compiled doc<br/>DRAFT watermark"]
  P --> Q[["Sign — name / timestamp / hash"]]
  Q --> R{"Outcome"}
  R -->|"Complete"| S(["Filed — signed final"])
  R -->|"Return to appraiser"| T(["Batched return letter<br/>status: returned · SLA still running"])
  N -.->|"batched into"| T
```

---

## 2. Intake triage — auto-rejected appraisals

```mermaid
flowchart TD
  A(["Appraisal delivered / ordered"]) --> B{"Auto-reject criteria<br/>fail any?"}
  B -->|"No"| C(["Enters queue → pipeline runs"])
  B -->|"Yes"| D[/"Auto-rejected · SLA paused"/]
  D --> E["Dashboard 'Intake triage' tile"]
  E --> F["/reviews/[id]/triage<br/>failed-criterion card + evidence"]
  F --> G{"Reviewer call"}
  G -->|"Confirm & return (outline + confirm)"| H(["Returned to appraiser"])
  G -->|"Override & admit (navy)"| I["Audited reason required"]
  I --> J(["Admitted → pipeline starts · SLA resumes"])
```

---

## 3. Administrative Review — attestation (shared focus-mode shell)

```mermaid
flowchart TD
  A(["Administrative tab of /reviews/[id]"]) --> B["AI pre-fills checklist:<br/>Yes/No/NA + evidence + page cite"]
  B --> C["Shared focus-mode shell:<br/>list rail · focus item · docked source"]
  C --> D{"Attest each item"}
  D -->|"Agree (routine)"| E["Confirm routine answers (bulk)"]
  D -->|"Change the AI answer"| F["Audited reason required"]
  E --> G{"All attested?"}
  F --> G
  G -->|"No"| C
  G -->|"Yes"| H["Preview attestation doc · DRAFT"]
  H --> I[["Sign & finalize"]]
  I --> J(["Export signed attestation"])
```

---

## 4. YouConnect entry — embedded hand-off

```mermaid
flowchart LR
  A(["YouConnect: Send to Parachute"]) --> B[/"SSO pass-through"/]
  B --> C[/"/launch interstitial<br/>'Transferring you to Parachute…'"/]
  C --> D["Dashboard"]
  A -.->|"order launched from YC"| E["Order flow, YC delivery pre-selected"]
  D --> F(["Order / open review with YC source"])
  E --> F
```

---

## Notes

- **Quick-look drawer** (queue): clicking a review row peeks status / findings summary / next action / download; "Open review" enters flow 1 at the Findings step. Not a separate journey — an accelerator on the queue.
- **Notifications**: "review ready" / "returned" / "assigned" deep-link into the relevant flow above; email is the production channel (eng-owned), the in-app bell panel mirrors it.
- **Download** (PDF / DOCX / ZIP, DRAFT vs FINAL) is available from the context bar and queue rows at any lifecycle stage; FINAL only after sign.
