# Research Analytics Platform — README.md

**Research Analytics Platform**  
*A simple platform for training ML models and running statistical analysis*  
**Authors:** Luke Rimmo Lego & Dr. Denver Baptiste  
**Status:** Developed

---

> **Note :** This README was written to make it easy for other students and early researchers to download, run, understand, and extend the project. If you carry this forward, please keep changes documented and keep the spirit of reproducibility and accessibility for research tools

---

## Table of contents
1. Overview  
2. What you can do with this repo  
3. Quick start, download, install, run locally  
4. Git & collaboration workflow (fork / clone / PR)  
5. Running scripts and common npm commands  
6. Python support (optional backend / analysis)  
7. Environment variables & example `.env`  
8. Docker 
9. Testing / linting / CI suggestions  
10. Data & model versioning suggestions for future work  
11. Roadmap, things future contributors can add  
12. Troubleshooting & tips  
13. Contact

---

## 1 — Overview
This repository contains a lightweight frontend (React + TypeScript) for loading CSVs, running common statistical tests (t-test, ANOVA, chi-square), training Random Forest models with basic versioning, and visualising results with interactive charts. The UI is purposely small so students can easily understand, modify, and extend it for coursework or research prototypes.

---

## 2 — What you can do with this ?
- Upload CSV datasets and preview them.  
- Run descriptive statistics and hypothesis tests.  
- Train Random Forest models (client-side) and view basic metrics and feature importances.  
- Export model metadata & results as JSON.  
- Visualize distributions, scatterplots, boxplots, confusion matrices, and feature importance charts.

---

## 3 — Quick start : download, install, run locally

### Prerequisites
- Node.js (LTS recommended; Node 18+ is a safe baseline).  
- npm (bundled with Node) or yarn.  
- Git.  
-  Python 3.9+ if you want to use the optional analysis/backend scripts in `python/`. See **Python support** below.

### Clone & run locally (minimum steps)
```bash
# 1) Clone the repo
git clone https://github.com/<your-username>/research-analytics-platform.git
cd research-analytics-platform

# 2) Install JS dependencies
npm ci        # preferred for reproducible installs. We have provided our package-lock.json that was generated
# or
npm install

# 3) Run the dev server
npm run dev

# 4) Open the app in your browser
# by default we use port 8080
# Open: http://localhost:8080
```

If the app uses Vite/Parcel/webpack, adjust `npm run dev` command if your project differs.

---

## 4 — Git & collaboration workflow 
If you want to contribute to the project or work in a team, follow this simple GitHub workflow:

```bash
# Fork the upstream repo on GitHub (use the Fork button in the web UI)

# Clone your fork
git clone git@github.com:your-username/research-analytics-platform.git
cd research-analytics-platform

# Add upstream to track original repository (so you can sync)
git remote add upstream https://github.com/original-owner/research-analytics-platform.git
git fetch upstream

# Create a feature branch for your work
git checkout -b feat/your-short-description

# Make changes, then
git add .
git commit -m "feat: short description of your change"
git push origin feat/your-short-description

# Then open a Pull Request from your fork to the original repo
# Keep PRs small and focused — makes review easier
```

**Windows users:** Git Bash is a friendly shell for these commands. Set `core.autocrlf` if you see line ending issues:
```bash
git config --global core.autocrlf true
```

---

## 5 — NPM scripts & common commands
Typical useful commands you will find in `package.json`:

```bash
npm run dev        # start dev server
npm run build      # build for production
npm run serve      # serve production build locally
npm run lint       # run ESLint
npm run format     # run Prettier
npm test           # run tests (if present)
```

**Tip:** Use `npm ci` in CI and reproducible builds; use `npm install` while developing if you need to add packages.

---

## 6 — Python support 
We include a minimal Python/analysis utility folder for users who prefer running heavier preprocessing or server-side utilities. To run those:

```bash
# create & activate a virtualenv
python -m venv .venv
# mac/linux
source .venv/bin/activate
# windows (PowerShell)
.venv\Scripts\Activate.ps1

# install python deps
pip install -r requirements.txt

# run helper scripts (examples)
python python/preprocess.py data/sample.csv
python python/run_stats.py data/sample.csv --test ttest --groupcol group
```

The `requirements.txt` included in this repo lists packages that support reproducible analysis (pandas, numpy, scipy, scikit-learn, statsmodels, fastapi/uvicorn for a small API). See the `requirements.txt` file in this repo root.

---

## 7 — Environment variables & example `.env`
If you plan to connect to a backend or persist models remotely, create a `.env` file in the project root with keys like:

```
# .env.example
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENABLE_MODEL_PERSISTENCE=false
```

Copy it and edit:
```bash
cp .env.example .env
# open .env in your editor and modify values
```

---

## 8 — Docker
We have provided a simple Dockerfile :

```bash
# build
docker build -t research-analytics-platform:latest .

# run
docker run -p 8080:80 research-analytics-platform:latest
```

## 9 — Testing, linting & CI
Some suggestions to keep the codebase healthy:
- Use `vitest` or `jest` for unit tests.
- Use `ESLint` + TypeScript rules and `Prettier` for formatting.
- Add `husky` pre-commit hooks to run `npm run lint` and a subset of tests.
- Add a GitHub Actions workflow to run `npm ci`, `npm run lint`, `npm test`, and `npm run build` on pull requests.

Example workflow file is included in this repo

---

## 10 — Data & model versioning (advice for future work)
For a student project we provide simple client-side timestamped JSON versions. If you push this forward, consider:
- Using DVC (Data Version Control) or MLflow for dataset + model tracking.
- Persisting artifacts to object storage (S3, MinIO).
- Storing environment metadata (OS, Node/Python versions, package-lock hash, dataset checksum) with each model run.

---

## 11 — Roadmap — things future contributors can add
These are concrete tasks that anyone can pick up and implement:
- Add server-side training (FastAPI or Flask) to handle large datasets and async training.
- Add cross-validation and more model types (XGBoost, LightGBM).
- Add hyperparameter search (GridSearch / RandomSearch / Optuna).
- Add user authentication + model registry UI.
- Add dataset lineage tracking via DVC or MLflow.
- Add export to ONNX or PMML for model portability.
- Improve accessibility and mobile responsiveness in the UI.
- Add automated example notebooks (Jupyter) that reproduce experiments end-to-end.

---

## 12 — Troubleshooting & tips 
- If `npm run dev` shows port conflict, check which process holds the port and kill it, or change the port in `vite.config.js`.  
- Large CSVs in-browser cause memory issues; add server-side ingestion for >50MB datasets.  
- If metrics look wrong, confirm correct encoding of categorical labels and that missing values were handled.


## 13 — Contact & how to carry it forward
If you want to carry this project forward:
1. Fork the repo and open a small PR with one focused change.  
2. Try adding tests for your change and document usage in the README.  
3. If you are a student, list this work on a portfolio and mention that it's a collaborative, extensible research tool.

Thanks for reading, good luck  
— Luke Rimmo Lego & Dr. Denver Baptiste 
