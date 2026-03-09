# Project Truth — RFQ Builder

**EPC Solar Bid Management Tool**

A browser-based RFQ/RFP builder for solar EPC preconstruction teams. Part of the Project Truth business management platform by Distributed Energy Group.

## Features

- **Excel Import** — Upload completed bid intake workbooks (.xlsx). Parses all worksheets and maps fields to a normalized project schema.
- **Project Dashboard** — Completeness scoring, design basis conflict tracking, permitting status, estimating risk register.
- **Diligence Matrix** — Full filterable table of all intake fields with status tracking (Answered / Partial / Needs Review / Not Found).
- **RFQ/RFP Builder** — Generate trade-specific bid packages (Civil, Electrical, Mechanical, Equipment, Specialty, Custom). Toggleable sections, editable content, auto-populated from intake data.
- **RFI Log** — Track bidder questions with status, impact categorization, assignment, and due dates.
- **Respondent Log** — Track invited bidders, proposal status, amounts, and ranking by trade.
- **PDF Preview** — Print-ready layouts for Summary, RFI Register, Respondent Log, and Permitting Status. Draft/Final watermark toggle.

## Running Locally

This is a fully client-side application with no backend dependency.

### Option 1: Simple HTTP Server
```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```
Then open `http://localhost:8080`

### Option 2: GitHub Pages
Push to a GitHub repo and enable GitHub Pages on the `main` branch. The app will be live at `https://<org>.github.io/<repo>/`.

## Tech Stack

- React 18 (CDN)
- Babel Standalone (in-browser JSX transpilation)
- SheetJS / xlsx (Excel parsing)
- Vanilla CSS (no framework)
- No backend, no build step

## Project Structure

```
project-truth-rfq/
├── index.html          # Entry point with CDN dependencies
├── app.jsx             # Full application source (React + JSX)
├── README.md           # This file
└── sample/
    └── Endicott_Bid_Info_Completed_v5.xlsx  # Sample intake workbook
```

## Seeded Data

The app ships pre-loaded with the **Endicott NY Solar Farm** project (True Green Capital, 5 MWac, Endicott NY) including:
- Full diligence matrix (24 fields)
- 3 conflicting design bases
- 12 permitting milestones
- 7 estimating risks
- 5 seed RFIs
- 4 respondent slots by trade

## Trade Packages Supported

| Trade | Scope |
|-------|-------|
| Civil | Grading, roads, fencing, erosion control, stormwater |
| Electrical | DC/AC wiring, MV cable, grounding, POI, commissioning |
| Mechanical / Racking | Pile driving, racking assembly, module installation |
| Equipment Vendor | Modules, inverters, transformers, racking, combiners |
| Specialty | Custom scope definition |
| Custom | User-defined |

## Workflow

1. Upload completed bid intake spreadsheet
2. Review parsed data in Dashboard and Diligence Matrix
3. Select trade package in RFQ Builder
4. Edit/customize RFQ sections
5. Track bidder questions in RFI Log
6. Track invited bidders in Respondent Log
7. Preview and print/export PDFs

## Part of Project Truth

This module integrates with the broader Project Truth platform (PMO, Pre-Sales Pipeline, CRM, AI Executive Reporting) under Distributed Energy Group.

---

**Prepared by DEI Pre-Sales | March 2026**
