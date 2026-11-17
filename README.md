# DataInsight Platform

> **Universal Dynamic Data Visualisation & Intelligence Platform**  
> MSc Artificial Intelligence · Module CMP7227 · Birmingham City University · 2026/27

---

## 🌐 Live Deployments

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** (Vercel) | [data-insight-platform.vercel.app](https://data-insight-platform.vercel.app) | [![Live](https://img.shields.io/badge/status-live-brightgreen)](#) |
| **Backend API** (Render) | [datainsight-platform.onrender.com](https://datainsight-platform.onrender.com) | [![Live](https://img.shields.io/badge/status-live-brightgreen)](#) |
| **API Docs (Swagger)** | [datainsight-platform.onrender.com/docs](https://datainsight-platform.onrender.com/docs) | — |
| **API Health Check** | [datainsight-platform.onrender.com/api/health](https://datainsight-platform.onrender.com/api/health) | — |

> **Note:** The backend runs on Render's free tier. The first request after inactivity may take 30–60 seconds to cold-start. Please be patient on initial load.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started (Local Dev)](#getting-started-local-dev)
6. [Environment Variables](#environment-variables)
7. [User Guide](#user-guide)
8. [API Reference](#api-reference)
9. [Deployment Guide](#deployment-guide)
10. [Architecture Diagram](#architecture-diagram)
11. [Colour Palette & Design System](#colour-palette--design-system)

---

## Overview

DataInsight is a **schema-agnostic** analytics platform. Upload any structured CSV or Excel file — the backend dynamically infers column types, computes statistical distributions, scores data quality, and recommends optimal visualisations. No pre-defined schema is required.

The platform was built as a coursework artefact for CMP7227 (Advanced Data Analytics) but is fully production-deployed and usable with any real-world dataset.

---

## Features

### 📤 Dataset Ingestion
- Drag-and-drop or browse upload for `.csv`, `.xlsx`, `.xls` files (up to 150 MB)
- Automatic delimiter detection for CSV files (`chardet` encoding sniffing)
- Multi-sheet Excel support — switch between sheets in the UI
- UUID-scoped session per upload; session auto-recovers from disk on backend restart

### 📊 Dashboard Overview (3 Tabs)
| Tab | Description |
|-----|-------------|
| **Cohort Overview** | KPI cards (total rows, columns, missing values, memory usage), interactive bar charts with labelled X/Y axes, scenario filter selectors |
| **Insights & Correlations** | Automated bivariate analysis — Pearson/Spearman correlation pairs (e.g. how sleep duration affects stress level), colour-coded strength badges, evidence-backed narratives |
| **Conclusions** | Scenario-level strategic conclusion, intervention priorities, risk flags, and audience-ready summary cards |

### 🔭 Data Explorer
- Paginated, sortable, searchable data table (up to 100k+ rows)
- Global filter bar — apply multi-column conditions (equals, contains, greater than, etc.)
- Persistent filter state across page navigation

### 🛡️ Data Quality Report
- Per-column null counts, null percentages, unique value cardinality
- Data quality score (0–100) with graded severity indicators
- Column-type validation and anomaly flags

### 📈 Statistical Analysis
- Descriptive statistics: mean, median, std, min, max, IQR, skewness, kurtosis
- Distribution visualisations per numerical column
- Outlier detection using IQR method

### 🎨 Visualisation Studio
- Algorithm-driven chart recommendations based on column type combinations
- Chart types: Bar, Line, Scatter, Pie, Histogram, Box Plot, Heatmap
- Interactive Recharts-powered rendering with tooltips and legends
- Custom chart builder — pick any X/Y column, group-by, aggregation, and limit

### 💡 Insights & Findings
- Rule-based insight engine — identifies top outliers, skewed distributions, high-cardinality columns, strongly-correlated pairs
- Each insight includes statistical evidence (coefficients, percentages, IQR bounds)

### 📄 Reports & Exports
- **PDF Report** — full executive report with KPI summary, data quality table, statistical summaries, correlation evidence, and strategic conclusion
- **CSV Export** — cleaned/filtered dataset as a downloadable file
- **XLSX Export** — Excel workbook export

### ⚙️ Settings
- Dark / Light theme toggle (persists across sessions via `localStorage`)
- Dataset session management — view active session ID, clear session

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.4.5 | React framework with Turbopack |
| React | 19.3.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Recharts | 3.x | Interactive charts |
| Axios | 1.x | HTTP client |
| Framer Motion | 14.x | Animations |
| Lucide React | 1.x | Icon set |
| TanStack Table | 9.x | Headless data table |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.115+ | REST API framework |
| Uvicorn | 0.30+ | ASGI server |
| Pydantic | 2.8+ | Data validation & schemas |
| Pandas | 2.2+ | Dataframe operations |
| NumPy | 1.26+ | Numerical computing |
| SciPy | 1.13+ | Statistical tests |
| scikit-learn | 1.5+ | ML utilities |
| ReportLab | 4.2+ | PDF generation |
| Plotly / Kaleido | 5.22+ | Chart rendering for PDF |
| openpyxl | 3.1+ | Excel file parsing |
| chardet | 5.2+ | Encoding detection |
| matplotlib | 3.8+ | Additional plotting |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting (CI/CD from GitHub `main`) |
| Render | Backend hosting (Docker/Python container) |
| GitHub | Source control & CI trigger |

---

## Project Structure

```
datainsight-platform/
├── README.md
├── start-dev.bat              # One-click local launcher (Windows)
├── vercel.json                # Root Vercel monorepo config
│
├── frontend/                  # Next.js application
│   ├── app/
│   │   ├── layout.tsx         # Root layout (sidebar + navbar)
│   │   ├── page.tsx           # Landing / redirect to upload
│   │   ├── upload/page.tsx    # Dataset upload page
│   │   ├── dashboard/page.tsx # Main analytics dashboard (3-tab)
│   │   ├── explorer/page.tsx  # Paginated data table
│   │   ├── data-quality/page.tsx
│   │   ├── statistics/page.tsx
│   │   ├── visualizations/page.tsx
│   │   ├── insights/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navigation.tsx # Collapsible sidebar + top navbar
│   │   ├── filters/
│   │   │   └── GlobalFilterBar.tsx
│   │   └── AnalysisConfigurator.tsx
│   ├── context/
│   │   ├── DatasetContext.tsx  # Global session state
│   │   └── ThemeContext.tsx    # Dark/light theme
│   ├── lib/
│   │   ├── api.ts             # Axios API client
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
│
└── backend/                   # FastAPI application
    ├── app/
    │   ├── main.py            # App entry point, CORS, routers
    │   ├── core/
    │   │   └── config.py      # Settings & upload directory
    │   ├── api/
    │   │   └── endpoints.py   # All REST endpoints
    │   ├── schemas/
    │   │   ├── dataset.py     # Pydantic response models
    │   │   ├── depression.py  # Analysis-specific models
    │   │   └── dynamic.py     # Dynamic analysis config
    │   ├── services/
    │   │   ├── dataset_service.py  # Session manager, file loader
    │   │   └── export_service.py   # PDF/CSV/XLSX generation
    │   ├── analysis/
    │   │   ├── depression_service.py  # Correlation + conclusion engine
    │   │   └── statistics_service.py
    │   ├── visualization/
    │   │   └── chart_builder.py
    │   ├── processing/
    │   │   └── cleaner_service.py
    │   └── insights/
    │       └── insight_engine.py
    ├── tests/
    │   ├── test_api.py
    │   └── qa_multi_dataset.py
    ├── requirements.txt
    ├── Dockerfile
    ├── Procfile
    └── render.yaml
```

---

## Getting Started (Local Dev)

### Prerequisites
- **Python** 3.11+
- **Node.js** 18+ and **npm**
- **Git**

### Quick Start (Windows)

```bat
# Clone the repo
git clone https://github.com/nahidn228/dataInsight-platform.git
cd dataInsight-platform

# Double-click or run:
start-dev.bat
```

This launches both the backend (port 8000) and frontend (port 3000) in separate terminal windows.

---

### Manual Setup

#### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend available at: `http://127.0.0.1:8000`  
Interactive API docs: `http://127.0.0.1:8000/docs`

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local
# Edit .env.local and set:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Start the development server
npm run dev
```

Frontend available at: `http://localhost:3000`

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description | Local Value | Production Value |
|----------|-------------|-------------|-----------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend | `http://localhost:8000/api` | `https://datainsight-platform.onrender.com/api` |

> **Important for Vercel:** Set `NEXT_PUBLIC_API_URL` in your Vercel project under  
> **Settings → Environment Variables** and redeploy. Without this, the app calls `localhost:8000` from the production browser — which will fail.

### Backend

The backend has no required environment variables for local development. On Render, the platform injects `PORT` automatically.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server listens on (auto-set by Render) | `8000` |

---

## User Guide

### Step 1 — Upload a Dataset

1. Navigate to **[Upload Dataset](https://data-insight-platform.vercel.app/upload)**
2. Drag-and-drop a `.csv`, `.xlsx`, or `.xls` file onto the upload zone — or click to browse
3. Supported limits: up to **150 MB**, up to **100,000+ rows**
4. The platform will automatically:
   - Detect file encoding and delimiters
   - Infer column data types (numerical, categorical, date-time, boolean)
   - Compute basic statistics and data quality scores
5. On success, you are redirected to the **Dashboard Overview**

> **Tip:** If you see "Failed to process dataset", check that the file is a valid spreadsheet (not password-protected or corrupted). The first upload on a cold Render instance may take 30–60 seconds.

---

### Step 2 — Dashboard Overview

The dashboard has **3 tabs**:

#### Tab 1 — Cohort Overview
- **KPI Cards**: Total Rows, Total Columns, Missing Values %, Memory Usage
- **Bar Chart**: Primary metric visualised by category group
  - X Axis = category column (e.g. Gender, Course, Age Group)
  - Y Axis = count or average of the selected metric
- **Scenario Selector**: Filter the analysis by a specific column value (e.g. filter to only depressed students)
- **Analysis Configurator**: Configure which columns map to target metric, grouping, and sub-filters

#### Tab 2 — Insights & Correlations
- Automatically computes **bivariate correlation pairs** (e.g. Sleep Duration vs Stress Level, Study Hours vs Academic Pressure)
- Each correlation shows:
  - **Pearson / Spearman coefficient**
  - **Strength badge** (Strong / Moderate / Weak)
  - **Direction** (Positive / Negative)
  - **Plain-language narrative** explaining the relationship
- Relationships are ranked by absolute strength

#### Tab 3 — Conclusions
- Provides a **scenario-level strategic conclusion** based on the entire dataset analysis
- Shows:
  - Overall risk rating
  - Top 3 intervention priority areas
  - Risk flags with actionable recommendations
  - Audience-ready summary suitable for presentations or reports

---

### Step 3 — Explore Your Data

Navigate to **Data Explorer** in the sidebar:

- **Search**: Type any value to filter visible rows across all columns
- **Sort**: Click any column header to sort ascending/descending
- **Paginate**: Use Previous/Next buttons; default page size is 50 rows
- **Filter Bar**: Apply multi-condition filters — e.g. `Age > 20` AND `Gender = Female`

---

### Step 4 — Data Quality Report

Navigate to **Data Quality** in the sidebar:

- View the overall **Quality Score** (0–100)
- See per-column breakdown:
  - Null count and null %
  - Unique value count
  - Data type
  - Quality flag (✅ Good / ⚠️ Warning / 🔴 Critical)
- Use this to decide which columns need cleaning before analysis

---

### Step 5 — Statistical Analysis

Navigate to **Statistical Analysis** in the sidebar:

- **Descriptive Stats Table**: mean, median, standard deviation, min, max, 25th/75th percentile, skewness, kurtosis — for every numerical column
- **Distribution Charts**: histogram-style visualisation per column
- **Outlier Report**: rows flagged as outliers (outside 1.5× IQR) per column

---

### Step 6 — Visualisation Studio

Navigate to **Visualisation Studio** in the sidebar:

1. **Recommended Charts** (auto-generated) — click any card to render that chart instantly
2. **Custom Chart Builder** — manually configure:
   - Chart type: Bar, Line, Scatter, Pie, Histogram, Box, Heatmap
   - X Column (categorical or date)
   - Y Column (numerical, with aggregation: sum, mean, count, min, max)
   - Group By (optional — adds colour series)
   - Row Limit (default 50, up to 500)
3. All charts are interactive — hover for tooltips, click legend to toggle series

---

### Step 7 — Insights & Findings

Navigate to **Insights & Findings** in the sidebar:

- Automatically generated rule-based insights:
  - High missing value columns
  - Heavily skewed distributions
  - High-cardinality categorical columns
  - Strongly correlated column pairs
  - Outlier-heavy columns
- Each insight card includes the statistical evidence used to generate it

---

### Step 8 — Export Reports

Navigate to **Reports & Exports** in the sidebar:

| Format | Contents | Use Case |
|--------|----------|----------|
| **PDF Report** | Executive summary, KPI table, data quality report, correlation analysis, strategic conclusion | Academic submission, stakeholder presentation |
| **CSV** | Cleaned/filtered dataset as comma-separated values | Further analysis in Excel or Python |
| **XLSX** | Excel workbook of the processed dataset | Sharing with non-technical stakeholders |

Click the corresponding **Download** button. PDF generation may take 5–15 seconds for large datasets.

---

### Step 9 — Settings

Navigate to **Settings** in the sidebar:

- **Theme**: Toggle between Dark mode and Light mode (saved to browser `localStorage`)
- **Session Info**: View your current dataset session ID
- **Clear Session**: Remove the active dataset and start fresh

---

### Sidebar Behaviour

| Element | Behaviour |
|---------|-----------|
| **Collapse button** (`‹`) | Collapses the sidebar to icon-only mode (saves screen space) |
| **Active Dataset badge** | Shows current filename, row count, and column count |
| **"Change" link** | Clears the active dataset — you can then upload a new one |
| **Green pulse dot** (Navbar) | Indicates the backend API is reachable |

---

## API Reference

Base URL (production): `https://datainsight-platform.onrender.com/api`

Full interactive docs: [`/docs`](https://datainsight-platform.onrender.com/docs)

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check — returns `{"status": "healthy"}` |
| `POST` | `/datasets/upload` | Upload a CSV/XLSX file. Returns `DatasetMetadata` with `dataset_id` |
| `GET` | `/datasets/{id}/metadata` | Get schema, column types, row/column counts |
| `GET` | `/datasets/{id}/preview` | Paginated data table (params: `page`, `page_size`, `sort_column`, `sort_ascending`, `search_query`) |
| `GET` | `/datasets/{id}/statistics` | Descriptive statistics for all numerical columns |
| `GET` | `/datasets/{id}/quality` | Data quality report with per-column null/unique analysis |
| `GET` | `/datasets/{id}/charts/recommendations` | Auto-generated chart recommendations |
| `POST` | `/datasets/{id}/charts/generate` | Build chart data for a given config (type, x_column, y_column, etc.) |
| `GET` | `/datasets/{id}/insights` | Rule-based analytical insights |
| `POST` | `/datasets/{id}/depression-analysis` | Full correlation + conclusion analysis (works on any dataset) |
| `POST` | `/datasets/{id}/clean` | Apply cleaning operations (drop nulls, fill values, rename columns) |
| `POST` | `/datasets/{id}/reset` | Reset to original uploaded dataset |
| `GET` | `/datasets/{id}/export` | Export dataset — `?format=csv`, `?format=xlsx`, or `?format=pdf` |

### Upload Request Example

```bash
curl -X POST https://datainsight-platform.onrender.com/api/datasets/upload \
  -F "file=@my_dataset.csv"
```

**Response:**
```json
{
  "dataset_id": "e946b089-584a-41c8-8ea9-90c3445340e2",
  "filename": "my_dataset.csv",
  "total_rows": 502,
  "total_columns": 11,
  "file_size_formatted": "48 KB",
  "columns": [ ... ]
}
```

Use the returned `dataset_id` in all subsequent requests.

---

## Deployment Guide

### Frontend — Vercel

1. Push to GitHub `main` branch → Vercel auto-deploys
2. **Required environment variable** in Vercel Project Settings → Environment Variables:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://datainsight-platform.onrender.com/api` |

3. Root `vercel.json` configures the monorepo build:

   ```json
   {
     "framework": "nextjs",
     "installCommand": "cd frontend && npm install",
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/.next"
   }
   ```

### Backend — Render

The backend deploys automatically from the `backend/render.yaml` manifest:

```yaml
services:
  - type: web
    name: datainsight-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
```

Render injects `$PORT` automatically. A `Dockerfile` is also included for Docker-based deployments.

> **Note:** Render's free tier uses ephemeral storage. Uploaded files persist within the same container lifetime but are wiped on each new deployment. Sessions are stored in-memory and auto-recovered from disk within the same container lifetime.

---

## Architecture Diagram

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│        USER BROWSER         │         │         VERCEL (Frontend)         │
│                             │◄───────►│  Next.js 16 · React 19 · TS      │
│  data-insight-platform      │  HTTPS  │  Tailwind · Recharts · Axios      │
│  .vercel.app                │         └──────────────┬───────────────────┘
└─────────────────────────────┘                        │
                                                       │ NEXT_PUBLIC_API_URL
                                                       │ HTTPS REST API calls
                                                       ▼
                                        ┌──────────────────────────────────┐
                                        │       RENDER (Backend)           │
                                        │  FastAPI · Uvicorn · Python 3.11 │
                                        │                                  │
                                        │  ┌─────────────────────────┐    │
                                        │  │  Session Manager         │    │
                                        │  │  (in-memory + disk)      │    │
                                        │  └─────────────────────────┘    │
                                        │  ┌─────────────────────────┐    │
                                        │  │  Dataset Service         │    │
                                        │  │  Pandas · chardet        │    │
                                        │  └─────────────────────────┘    │
                                        │  ┌─────────────────────────┐    │
                                        │  │  Analysis Engine         │    │
                                        │  │  SciPy · scikit-learn    │    │
                                        │  └─────────────────────────┘    │
                                        │  ┌─────────────────────────┐    │
                                        │  │  Export Service          │    │
                                        │  │  ReportLab · openpyxl    │    │
                                        │  └─────────────────────────┘    │
                                        └──────────────────────────────────┘
```

---

## Colour Palette & Design System

The UI uses a strict 5-colour semantic palette to maintain consistency across all pages:

| Token | Hex | Usage |
|-------|-----|-------|
| **Indigo** | `#6366f1` | Primary actions, active nav, links |
| **Rose** | `#f43f5e` | Errors, danger states, critical alerts |
| **Teal** | `#0d9488` | Success, positive metrics, good quality |
| **Amber** | `#f59e0b` | Warnings, moderate severity, highlights |
| **Slate** | `#64748b` | Secondary text, muted UI elements |

Theme variables (`--bg-surface`, `--text-primary`, `--border-subtle`, etc.) are defined in `frontend/app/globals.css` and switch automatically between dark and light mode.

---

## Running Tests

```bash
cd backend

# Activate virtual environment first
.venv\Scripts\activate

# Run unit tests
pytest tests/test_api.py -v

# Run multi-dataset QA suite
python tests/qa_multi_dataset.py
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request against `main`

Please ensure `npm run build` passes (zero TypeScript errors) before submitting a PR.

---

## Repository

**GitHub:** [github.com/nahidn228/dataInsight-platform](https://github.com/nahidn228/dataInsight-platform)  
**Branch:** `main`

---

## Licence

This project was developed for academic purposes as part of **CMP7227 — Advanced Data Analytics**, MSc Artificial Intelligence, Birmingham City University (2026/27).

© 2026 DataInsight Platform Contributors. All rights reserved.
