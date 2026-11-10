# DataInsight – Dynamic Data Visualisation & Intelligence Platform

**Academic Context**: Birmingham City University (BCU)  
**Module**: CMP7227 – Data Visualisation  
**Academic Year**: 2026/2027  
**Assessment**: Visualising a Relatively Large Dataset (100,000+ rows)

---

## 1. Project Overview

**DataInsight** is a production-grade, schema-agnostic, and universal data analytics platform. It automatically ingests, validates, processes, and visualises structured datasets (CSV, XLSX, XLS) without hardcoded schemas, predefined KPI thresholds, or external AI API dependencies.

Every metric, statistical coefficient, chart aggregation, and evidence-backed finding is computed deterministically directly from the active dataset.

---

## 2. Core Architecture

```
datainsight-platform/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint, middleware, health endpoints
│   │   ├── api/endpoints.py         # RESTful router (upload, preview, stats, quality, charts, reports)
│   │   ├── core/config.py           # Configuration, upload isolation, file size thresholds
│   │   ├── schemas/dataset.py       # Pydantic v2 schemas for all analytical models
│   │   ├── services/
│   │   │   ├── dataset_service.py   # Multi-encoding delimiter detection & type inference
│   │   │   └── export_service.py    # Academic ReportLab PDF & Excel generators
│   │   ├── analysis/statistics_service.py # Parametric/non-parametric stats & correlations
│   │   ├── processing/cleaner_service.py  # Non-destructive data cleaning engine
│   │   ├── visualization/chart_builder.py # Chart recommendation & dynamic aggregation
│   │   └── insights/insight_engine.py     # Deterministic evidence-backed discovery engine
│   ├── tests/test_api.py            # Automated pytest suite (including 100,000+ row performance)
│   ├── generate_samples.py          # Generates verification datasets (student lifestyle & 100k retail)
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Modern analytics landing page with direct CTA
│   │   ├── layout.tsx               # Global Dark theme layout & DatasetProvider wrapper
│   │   ├── upload/page.tsx          # Drag-and-drop universal dataset ingestion
│   │   ├── dashboard/page.tsx       # Dynamic KPI cards & recommended chart grid
│   │   ├── explorer/page.tsx        # High-performance tabular data grid (server pagination)
│   │   ├── data-quality/page.tsx    # Health index, duplicate analysis & interactive cleaning
│   │   ├── statistics/page.tsx      # Parametric tables & bivariate correlation matrices
│   │   ├── visualizations/page.tsx  # Dynamic chart builder with aggregations (Recharts)
│   │   ├── insights/page.tsx        # Evidence-based analytical findings & anomalies
│   │   ├── reports/page.tsx         # Academic assessment PDF & dataset export center
│   │   └── settings/page.tsx        # Session management & module coursework metadata
│   ├── components/layout/Navigation.tsx # Collapsible sidebar & dataset memory status
│   ├── context/DatasetContext.tsx   # React context with persistence & cross-page filters
│   ├── lib/api.ts                   # Strongly-typed Axios backend client
│   └── types/index.ts               # Complete TypeScript analytical contracts
```

---

## 3. Technology Stack

- **Backend**: Python 3.14+, FastAPI, Pandas, NumPy, SciPy, Scikit-learn, ReportLab, OpenPyXL, Uvicorn, Pytest.
- **Frontend**: Next.js 16+ (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts, Framer Motion, Axios.

---

## 4. Verification & Testing

The backend test suite verifies:
- File ingestion across formats (CSV with variable delimiters, multi-sheet XLSX).
- Dynamic heuristic type detection (numerical, categorical, datetime, boolean, ID).
- Scalability with **105,000+ records** (`global_retail_sales_100k.csv`).
- Non-destructive cleaning transformations (median/mode imputation, IQR outlier trimming, deduplication).
- Academic PDF generation.

To run the automated tests:
```bash
cd backend
python -m pytest tests/test_api.py -v
```

---

## 5. Running the Application Locally

### Step 1: Start Backend API
```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Health endpoint*: `http://127.0.0.1:8000/api/health`  
*Interactive Swagger docs*: `http://127.0.0.1:8000/docs`

### Step 2: Start Frontend Application
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

