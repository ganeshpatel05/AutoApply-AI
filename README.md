# 🤖 AutoApply AI — Multi-Agent Job Application System

# "AutoApply AI — A Multi-Agent System for Job Discovery, Resume-JD Matching, Cover Letter Generation and Application Tracking"

A college MCA project implementing an internal multi-agent architecture in Python, FastAPI, React + Vite, SQLite, and Ollama.

---

## 🌟 Key Features

- **Decoupled Multi-Agent Architecture**: 5 specialized Python agents (Resume Agent, Job Search Agent, ATS Agent, Cover Letter Agent, Tracker Agent) working in harmony through a master orchestrator.
- **Modern React + Vite Frontend**: Responsive web UI featuring dark/light mode toggle, real-time analytics charts, interactive Job Matcher, Cover Letter generator, and Application Tracker.
- **FastAPI REST Backend**: High-performance asynchronous API layer serving all agent operations, database CRUD, and PDF uploads.
- **Local LLM Integration (Ollama)**: Uses local Ollama HTTP API (`http://localhost:11434`) for cover letter generation with automatic model detection and template fallbacks.
- **Deterministic 5-Component ATS Scoring**: Comprehensive match algorithm (Skill 40%, Keyword 25%, Experience 15%, Education 10%, Cosine Sim 10%) without arbitrary random scores.
- **SQLite Database Persistence**: Parameterized SQL CRUD operations for resumes, scraped jobs, applications, and cover letters.
- **Offline & Demo Mode Support**: Bundled realistic job datasets ensure 100% reliable demonstrations during college vivas even when external job portals block requests.
- **Optional Email Automation**: Gmail SMTP integration with HTML templates and PDF attachments.

---

## 🏗️ Architecture Overview

```text
AutoApply AI
│
├── agents/                      # Specialized Python Agent Classes
│   ├── resume_agent.py          # Resume Agent (PDF extraction & profile management)
│   ├── job_search_agent.py      # Job Search Agent (Portal scraping & normalization)
│   ├── ats_agent.py             # ATS Agent (5-component compatibility scoring)
│   ├── cover_letter_agent.py    # Cover Letter Agent (Ollama AI generation & fallbacks)
│   ├── tracker_agent.py         # Application Tracker Agent (Lifecycle & email delivery)
│   └── orchestrator.py          # Multi-Agent Master Pipeline Orchestrator
│
├── api/                         # FastAPI REST Backend Layer
│   ├── main.py                  # API Entry Point & CORS Setup
│   ├── routes/                  # Modular Route Handlers
│   └── schemas/                 # Pydantic Schemas
│
├── frontend/                    # React + Vite Frontend UI Layer
│   ├── src/                     # React Components, Hooks, & Pages
│   └── package.json             # NPM dependencies & Vite scripts
│
├── tools/                       # Service Layer Tools
│   ├── resume_parser.py         # PDF & plain-text parsing (pdfplumber / PyPDF2)
│   ├── job_scraper.py           # Scraping abstraction (PublicJobSource & DemoJobSource)
│   ├── ats_scorer.py            # Deterministic keyword & TF-IDF match scorer
│   ├── ollama_client.py         # Direct HTTP client for local Ollama server
│   └── email_sender.py          # SMTP email sender (MIMEMultipart HTML & PDF)
│
├── database/                    # Persistence Layer
│   └── db_manager.py            # SQLite Database Manager (tables, CRUD & stats)
│
├── config/                      # Application Configuration
│   └── settings.py              # Environment variables & constants
│
├── utils/                       # Utility Functions
│   └── helpers.py               # Text cleaning, date formatting & badge helpers
│
├── main.py                      # CLI Entry Point for pipeline execution & database management
├── setup.py                     # One-click environment setup wizard
├── start.bat                    # One-click Windows starter script for Backend + Frontend
└── requirements.txt             # Clean, minimal production dependencies
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Recommended Python Version**: Python 3.11.x or 3.12.x (Python 3.10+ supported).
- **Node.js**: Node 18+ for running the React Vite frontend.
- **Ollama Local LLM** (Optional for AI features, fallbacks provided): Download from [ollama.ai](https://ollama.ai).

### 1. Environment Setup

Using Windows PowerShell:

```powershell
# Navigate into project directory
cd AutoApply-AI

# Create virtual environment (Optional but recommended)
python -m venv venv
venv\Scripts\activate

# Install dependencies
python -m pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Initialize Database & Run Setup

```powershell
python setup.py
```

Or initialize database directly:

```powershell
python main.py --init-db
```

### 3. Launch Application (One-Click Starter)

Double-click `start.bat` or run:

```powershell
.\start.bat
```

Or start servers manually in separate terminals:

```powershell
# Terminal 1: Backend API (Port 8000)
venv\Scripts\python api\main.py

# Terminal 2: Frontend UI (Port 5173)
cd frontend
npm run dev
```

### 4. Run via CLI

```powershell
# View statistics
python main.py --stats

# Run full pipeline with Demo Mode
python main.py --role "Python Developer" --location "Bangalore" --demo

# Run full pipeline with custom resume PDF
python main.py --resume path/to/resume.pdf --role "Data Analyst"
```

---

## 🦙 Ollama Model Setup (Optional for AI Cover Letters)

1. Download & Install Ollama from [ollama.ai](https://ollama.ai).
2. Download a model (e.g. `mistral` or `llama3`):
   ```powershell
   ollama pull mistral
   ```
3. Start the local server:
   ```powershell
   ollama serve
   ```
4. AutoApply AI automatically detects running Ollama models at `http://localhost:11434`.

*If Ollama is offline or uninstalled, AutoApply AI seamlessly uses its intelligent template fallback generator so no features crash.*

---

## 📧 Email Setup (Optional SMTP Application Submission)

To enable direct email applications to recruiters:
1. Create a `.env` file (copied from `.env.example`).
2. Add your Gmail address and a 16-character App Password:
   ```env
   EMAIL_SENDER=your_email@gmail.com
   EMAIL_APP_PASSWORD=your_16_char_app_password
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   ```

---

## 🧪 Automated Testing

Run full suite of unit and integration tests:

```powershell
python -m unittest discover tests
```

---

## 🎓 College Viva Project Demonstration Guide

When explaining this project in your MCA viva:
1. **Multi-Agent System**: Explain how tasks are divided among specialized Python agent classes (`ResumeAgent`, `JobSearchAgent`, `ATSAgent`, `CoverLetterAgent`, `TrackerAgent`) coordinated by `AutoApplyOrchestrator`.
2. **Deterministic ATS Engine**: Show how ATS compatibility is calculated systematically through skill overlap, keyword presence, experience, education, and term-frequency similarity.
3. **Local LLM Integration**: Demonstrate direct HTTP calls to local Ollama API without relying on third-party API keys or cloud costs.
4. **SQLite Persistence**: Show the SQLite schema (`resumes`, `jobs`, `applications`, `cover_letters`) updating dynamically as actions are taken in the React UI or CLI.
5. **Demo Mode Reliability**: Demonstrate Demo Mode to prove how the system handles offline conditions and site anti-scraping blocks seamlessly.

