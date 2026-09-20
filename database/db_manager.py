"""AutoApply AI — Complete Database Manager (SQLite)
Provides parameterized CRUD operations and schema management.
Performance-optimized: persistent connection, WAL mode, batch operations, consolidated queries.
"""

import sqlite3
import json
import hashlib
import threading
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager
from config.settings import DB_PATH


import os

class DatabaseManager:
    """Manages all SQLite database operations for AutoApply AI."""
    _initialized_paths = set()
    _db_lock = threading.RLock()

    def __init__(self, db_path: str = None):
        self.db_path = str(db_path or DB_PATH)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = None

    def _get_conn(self) -> sqlite3.Connection:
        """Get or create a persistent connection with optimized pragmas."""
        if self._conn is None:
            conn = sqlite3.connect(
                self.db_path,
                timeout=10,
                check_same_thread=False
            )
            conn.row_factory = sqlite3.Row
            # Performance pragmas
            if os.getenv("VERCEL"):
                conn.execute("PRAGMA journal_mode=DELETE")
            else:
                conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA cache_size=-64000")
            conn.execute("PRAGMA busy_timeout=10000")
            conn.execute("PRAGMA temp_store=MEMORY")
            self._conn = conn
            self.init_db()
        return self._conn


    @contextmanager
    def _connect(self):
        with DatabaseManager._db_lock:
            conn = self._get_conn()
            if conn.in_transaction:
                yield conn
            else:
                try:
                    yield conn
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise

    # ─── Schema Initialization ────────────────────────────────────────

    def init_db(self):
        """Create all required tables according to architecture spec."""
        resolved = str(Path(self.db_path).resolve())
        if resolved in DatabaseManager._initialized_paths:
            return
        with self._connect() as conn:
            conn.executescript("""
                -- Profiles table
                CREATE TABLE IF NOT EXISTS profiles (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name       TEXT NOT NULL,
                    email           TEXT,
                    phone           TEXT,
                    location        TEXT,
                    target_roles    TEXT,
                    experience      TEXT,
                    education       TEXT,
                    linkedin        TEXT,
                    github          TEXT,
                    skills          TEXT,
                    theme_pref      TEXT DEFAULT 'light',
                    created_at      TEXT DEFAULT (datetime('now')),
                    updated_at      TEXT DEFAULT (datetime('now'))
                );

                -- Resumes table
                CREATE TABLE IF NOT EXISTS resumes (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    name        TEXT NOT NULL,
                    email       TEXT,
                    phone       TEXT,
                    file_path   TEXT,
                    raw_text    TEXT,
                    skills      TEXT,
                    experience  TEXT,
                    education   TEXT,
                    linkedin    TEXT,
                    github      TEXT,
                    is_active   INTEGER DEFAULT 1,
                    created_at  TEXT DEFAULT (datetime('now'))
                );

                -- Jobs table
                CREATE TABLE IF NOT EXISTS jobs (
                    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                    title               TEXT NOT NULL,
                    company             TEXT NOT NULL,
                    location            TEXT,
                    description         TEXT,
                    requirements        TEXT,
                    url                 TEXT,
                    source              TEXT,
                    source_job_id       TEXT,
                    job_hash            TEXT UNIQUE,
                    salary              TEXT,
                    job_type            TEXT,
                    company_type        TEXT DEFAULT 'MNC (Multi National Company)',
                    is_mnc              INTEGER DEFAULT 1,
                    experience          TEXT,
                    ats_score           REAL DEFAULT 0,
                    matched_keywords    TEXT,
                    missing_keywords    TEXT,
                    is_saved            INTEGER DEFAULT 0,
                    created_at          TEXT DEFAULT (datetime('now')),
                    updated_at          TEXT DEFAULT (datetime('now'))
                );

                -- Applications table
                CREATE TABLE IF NOT EXISTS applications (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id          INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
                    status          TEXT DEFAULT 'Saved',
                    cover_letter    TEXT,
                    resume_used     TEXT,
                    email           TEXT,
                    email_sent      INTEGER DEFAULT 0,
                    notes           TEXT,
                    applied_at      TEXT DEFAULT (datetime('now')),
                    updated_at      TEXT DEFAULT (datetime('now'))
                );

                -- Cover Letters table
                CREATE TABLE IF NOT EXISTS cover_letters (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id      INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
                    content     TEXT NOT NULL,
                    created_at  TEXT DEFAULT (datetime('now'))
                );

                -- Agent Logs table
                CREATE TABLE IF NOT EXISTS agent_logs (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    agent_name  TEXT NOT NULL,
                    action      TEXT NOT NULL,
                    status      TEXT DEFAULT 'Completed',
                    details     TEXT,
                    created_at  TEXT DEFAULT (datetime('now'))
                );

                -- Indexes for optimization
                CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
                CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
                CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
                CREATE INDEX IF NOT EXISTS idx_jobs_ats_score ON jobs(ats_score);
                CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
                CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
                CREATE INDEX IF NOT EXISTS idx_apps_job_id ON applications(job_id);
                CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
                -- Performance: composite index for dedup lookups
                CREATE INDEX IF NOT EXISTS idx_jobs_source_sid ON jobs(source, source_job_id);
                -- Performance: index for stats aggregation
                CREATE INDEX IF NOT EXISTS idx_apps_email_sent ON applications(email_sent);
            """)

            # Migration for existing databases
            try:
                conn.execute("ALTER TABLE jobs ADD COLUMN company_type TEXT DEFAULT 'MNC (Multi National Company)'")
            except Exception:
                pass
            try:
                conn.execute("ALTER TABLE jobs ADD COLUMN is_mnc INTEGER DEFAULT 1")
            except Exception:
                pass

        DatabaseManager._initialized_paths.add(resolved)

    def reset_db(self):
        """Reset and recreate all tables."""
        with self._connect() as conn:
            conn.executescript("""
                DROP TABLE IF EXISTS agent_logs;
                DROP TABLE IF EXISTS applications;
                DROP TABLE IF EXISTS cover_letters;
                DROP TABLE IF EXISTS jobs;
                DROP TABLE IF EXISTS resumes;
                DROP TABLE IF EXISTS profiles;
            """)
        DatabaseManager._initialized = False
        self.init_db()

    # ─── Profiles CRUD ───────────────────────────────────────────────

    def save_profile(self, full_name: str, email: str = "", phone: str = "", location: str = "",
                     target_roles: str = "", experience: str = "", education: str = "",
                     linkedin: str = "", github: str = "", skills: list = None, theme_pref: str = "light") -> int:
        skills_json = json.dumps(skills or [])
        with self._connect() as conn:
            existing = conn.execute("SELECT id FROM profiles LIMIT 1").fetchone()
            if existing:
                conn.execute(
                    """UPDATE profiles SET
                       full_name=?, email=?, phone=?, location=?, target_roles=?, experience=?, education=?,
                       linkedin=?, github=?, skills=?, theme_pref=?, updated_at=datetime('now')
                       WHERE id=?""",
                    (full_name, email, phone, location, target_roles, experience, education,
                     linkedin, github, skills_json, theme_pref, existing["id"])
                )
                return existing["id"]
            else:
                cur = conn.execute(
                    """INSERT INTO profiles
                       (full_name, email, phone, location, target_roles, experience, education, linkedin, github, skills, theme_pref)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (full_name, email, phone, location, target_roles, experience, education, linkedin, github, skills_json, theme_pref)
                )
                return cur.lastrowid

    def get_profile(self) -> dict | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM profiles LIMIT 1").fetchone()
            if row:
                d = dict(row)
                try:
                    d["skills"] = json.loads(d["skills"]) if d.get("skills") else []
                except Exception:
                    d["skills"] = []
                return d
            return None

    def update_theme(self, theme: str):
        with self._connect() as conn:
            conn.execute("UPDATE profiles SET theme_pref=?", (theme,))

    # ─── Resumes CRUD ────────────────────────────────────────────────

    def save_resume(self, name: str, email: str = "", phone: str = "",
                    file_path: str = "", raw_text: str = "", skills: list = None,
                    experience: str = "", education: str = "",
                    linkedin: str = "", github: str = "") -> int:
        skills_json = json.dumps(skills or [])
        with self._connect() as conn:
            # Set all previous resumes as inactive
            conn.execute("UPDATE resumes SET is_active=0")
            cur = conn.execute(
                """INSERT INTO resumes
                   (name, email, phone, file_path, raw_text, skills, experience, education, linkedin, github, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                (name, email, phone, file_path, raw_text, skills_json, experience, education, linkedin, github)
            )
            return cur.lastrowid

    def get_active_resume(self) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM resumes WHERE is_active=1 ORDER BY created_at DESC LIMIT 1"
            ).fetchone()
            if not row:
                # Fallback to most recent
                row = conn.execute("SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1").fetchone()
            if row:
                d = dict(row)
                try:
                    d["skills"] = json.loads(d["skills"]) if d.get("skills") else []
                except Exception:
                    d["skills"] = []
                return d
            return None

    def get_all_resumes(self) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM resumes ORDER BY created_at DESC").fetchall()
            results = []
            for r in rows:
                d = dict(r)
                try:
                    d["skills"] = json.loads(d["skills"]) if d.get("skills") else []
                except Exception:
                    d["skills"] = []
                results.append(d)
            return results

    # ─── Jobs CRUD & Deduplication ───────────────────────────────────

    def _generate_job_hash(self, company: str, title: str, url: str) -> str:
        key = f"{company.strip().lower()}|{title.strip().lower()}|{url.strip().lower()}"
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    def insert_job(self, title: str, company: str, location: str = "",
                   description: str = "", requirements: str = "", url: str = "",
                   source: str = "Live", source_job_id: str = "", salary: str = "",
                   job_type: str = "Full-time", experience: str = "0-2 years",
                   ats_score: float = 0, matched_keywords: list = None,
                   missing_keywords: list = None, is_saved: int = 0) -> int:
        
        job_hash = self._generate_job_hash(company, title, url)
        matched_json = json.dumps(matched_keywords or [])
        missing_json = json.dumps(missing_keywords or [])

        with self._connect() as conn:
            # UPSERT: single query instead of SELECT + INSERT/UPDATE
            conn.execute("""
                INSERT INTO jobs
                (title, company, location, description, requirements, url, source, source_job_id,
                 job_hash, salary, job_type, experience, ats_score, matched_keywords, missing_keywords, is_saved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(job_hash) DO UPDATE SET
                    location=excluded.location,
                    description=excluded.description,
                    requirements=excluded.requirements,
                    ats_score=excluded.ats_score,
                    matched_keywords=excluded.matched_keywords,
                    missing_keywords=excluded.missing_keywords,
                    updated_at=datetime('now')
            """, (title, company, location, description, requirements, url, source, source_job_id,
                  job_hash, salary, job_type, experience, ats_score, matched_json, missing_json, is_saved))
            
            # Get the ID (works for both insert and update)
            row = conn.execute("SELECT id FROM jobs WHERE job_hash=?", (job_hash,)).fetchone()
            return row["id"] if row else 0

    def get_all_jobs(self, search: str = "", min_ats: float = 0) -> list[dict]:
        with self._connect() as conn:
            query = "SELECT * FROM jobs WHERE ats_score >= ?"
            params = [min_ats]
            if search:
                query += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
                pattern = f"%{search}%"
                params.extend([pattern, pattern, pattern])
            query += " ORDER BY ats_score DESC, created_at DESC"

            rows = conn.execute(query, params).fetchall()
            results = []
            for r in rows:
                d = dict(r)
                try:
                    d["matched_keywords"] = json.loads(d["matched_keywords"]) if d.get("matched_keywords") else []
                except Exception:
                    d["matched_keywords"] = []
                try:
                    d["missing_keywords"] = json.loads(d["missing_keywords"]) if d.get("missing_keywords") else []
                except Exception:
                    d["missing_keywords"] = []
                results.append(d)
            return results

    def get_job_by_id(self, job_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
            if row:
                d = dict(row)
                try:
                    d["matched_keywords"] = json.loads(d["matched_keywords"]) if d.get("matched_keywords") else []
                except Exception:
                    d["matched_keywords"] = []
                try:
                    d["missing_keywords"] = json.loads(d["missing_keywords"]) if d.get("missing_keywords") else []
                except Exception:
                    d["missing_keywords"] = []
                return d
            return None

    def toggle_save_job(self, job_id: int) -> bool:
        with self._connect() as conn:
            row = conn.execute("SELECT is_saved FROM jobs WHERE id=?", (job_id,)).fetchone()
            if row:
                new_state = 0 if row["is_saved"] else 1
                conn.execute("UPDATE jobs SET is_saved=? WHERE id=?", (new_state, job_id))
                return bool(new_state)
            return False

    def update_job_ats(self, job_id: int, ats_score: float, matched: list = None, missing: list = None):
        matched_json = json.dumps(matched or [])
        missing_json = json.dumps(missing or [])
        with self._connect() as conn:
            conn.execute(
                """UPDATE jobs SET ats_score=?, matched_keywords=?, missing_keywords=?, updated_at=datetime('now')
                   WHERE id=?""",
                (ats_score, matched_json, missing_json, job_id)
            )

    def batch_update_ats(self, updates: list[dict]):
        """Batch update ATS scores for multiple jobs in a single transaction."""
        if not updates:
            return
        with self._connect() as conn:
            conn.executemany(
                """UPDATE jobs SET ats_score=?, matched_keywords=?, missing_keywords=?, updated_at=datetime('now')
                   WHERE id=?""",
                [(u["ats_score"], json.dumps(u.get("matched", [])), json.dumps(u.get("missing", [])), u["job_id"]) for u in updates]
            )

    def batch_insert_jobs(self, jobs: list[dict]) -> list[int]:
        """Insert or upsert multiple jobs in a single transaction. Returns list of job IDs."""
        if not jobs:
            return []
        ids = []
        with self._connect() as conn:
            for job in jobs:
                job_hash = self._generate_job_hash(
                    job.get("company", ""), job.get("title", ""), job.get("url", "")
                )
                matched_json = json.dumps(job.get("matched_keywords", []))
                missing_json = json.dumps(job.get("missing_keywords", []))
                conn.execute("""
                    INSERT INTO jobs
                    (title, company, location, description, requirements, url, source, source_job_id,
                     job_hash, salary, job_type, experience, ats_score, matched_keywords, missing_keywords, is_saved)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(job_hash) DO UPDATE SET
                        location=excluded.location,
                        description=excluded.description,
                        requirements=excluded.requirements,
                        ats_score=excluded.ats_score,
                        matched_keywords=excluded.matched_keywords,
                        missing_keywords=excluded.missing_keywords,
                        updated_at=datetime('now')
                """, (
                    job.get("title", ""), job.get("company", ""), job.get("location", ""),
                    job.get("description", job.get("jd_text", "")), job.get("requirements", ""),
                    job.get("url", ""), job.get("source", "Live"), job.get("source_job_id", ""),
                    job_hash, job.get("salary", ""), job.get("job_type", "Full-time"),
                    job.get("experience", "0-2 years"), job.get("ats_score", 0),
                    matched_json, missing_json, job.get("is_saved", 0)
                ))
                row = conn.execute("SELECT id FROM jobs WHERE job_hash=?", (job_hash,)).fetchone()
                ids.append(row["id"] if row else 0)
        return ids

    def delete_job(self, job_id: int):
        with self._connect() as conn:
            conn.execute("DELETE FROM jobs WHERE id=?", (job_id,))

    # ─── Applications CRUD ────────────────────────────────────────────

    def create_application(self, job_id: int, status: str = "Saved", cover_letter: str = "",
                           resume_used: str = "", email: str = "", notes: str = "") -> int:
        valid_statuses = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn"]
        if status not in valid_statuses:
            status = "Saved"

        with self._connect() as conn:
            # Check if application already exists for this job
            row = conn.execute("SELECT id FROM applications WHERE job_id=?", (job_id,)).fetchone()
            if row:
                conn.execute(
                    """UPDATE applications SET status=?, cover_letter=?, resume_used=?, email=?, notes=?, updated_at=datetime('now')
                       WHERE id=?""",
                    (status, cover_letter, resume_used, email, notes, row["id"])
                )
                return row["id"]

            cur = conn.execute(
                """INSERT INTO applications (job_id, status, cover_letter, resume_used, email, notes)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (job_id, status, cover_letter, resume_used, email, notes)
            )
            return cur.lastrowid

    def update_application_status(self, app_id: int, status: str, notes: str = None):
        valid_statuses = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status {status}. Must be one of {valid_statuses}")
        with self._connect() as conn:
            if notes is not None:
                conn.execute(
                    "UPDATE applications SET status=?, notes=?, updated_at=datetime('now') WHERE id=?",
                    (status, notes, app_id)
                )
            else:
                conn.execute(
                    "UPDATE applications SET status=?, updated_at=datetime('now') WHERE id=?",
                    (status, app_id)
                )

    def mark_email_sent(self, app_id: int, email_recipient: str = ""):
        with self._connect() as conn:
            conn.execute(
                """UPDATE applications SET email_sent=1, status='Applied', email=?, updated_at=datetime('now')
                   WHERE id=?""",
                (email_recipient, app_id)
            )

    def get_all_applications(self) -> list[dict]:
        with self._connect() as conn:
            query = """
                SELECT a.*, j.title as job_title, j.company, j.location, j.ats_score, j.source, j.url
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                ORDER BY a.updated_at DESC
            """
            rows = conn.execute(query).fetchall()
            return [dict(r) for r in rows]

    def get_application_by_id(self, app_id: int) -> dict | None:
        with self._connect() as conn:
            query = """
                SELECT a.*, j.title as job_title, j.company, j.location, j.ats_score, j.source, j.url
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                WHERE a.id = ?
            """
            row = conn.execute(query, (app_id,)).fetchone()
            return dict(row) if row else None

    def delete_application(self, app_id: int):
        with self._connect() as conn:
            conn.execute("DELETE FROM applications WHERE id=?", (app_id,))

    # ─── Cover Letters CRUD ───────────────────────────────────────────

    def save_cover_letter(self, job_id: int, content: str) -> int:
        with self._connect() as conn:
            cur = conn.execute(
                "INSERT INTO cover_letters (job_id, content) VALUES (?, ?)",
                (job_id, content)
            )
            # Also sync with application if exists
            conn.execute(
                "UPDATE applications SET cover_letter=? WHERE job_id=?",
                (content, job_id)
            )
            return cur.lastrowid

    def get_cover_letter(self, job_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM cover_letters WHERE job_id=? ORDER BY created_at DESC LIMIT 1",
                (job_id,)
            ).fetchone()
            return dict(row) if row else None

    # ─── Dashboard Stats (Consolidated: 9 queries → 2) ───────────────

    def get_stats(self) -> dict:
        with self._connect() as conn:
            # Consolidated job stats (1 query instead of 3)
            job_row = conn.execute("""
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN is_saved=1 THEN 1 ELSE 0 END) as saved,
                       AVG(CASE WHEN ats_score > 0 THEN ats_score END) as avg_ats
                FROM jobs
            """).fetchone()

            # Consolidated application stats (1 query instead of 6)
            app_row = conn.execute("""
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN status='Applied' THEN 1 ELSE 0 END) as applied,
                       SUM(CASE WHEN email_sent=1 THEN 1 ELSE 0 END) as emails,
                       SUM(CASE WHEN status='Interview' THEN 1 ELSE 0 END) as interviews,
                       SUM(CASE WHEN status='Offer' THEN 1 ELSE 0 END) as offers,
                       SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END) as rejected
                FROM applications
            """).fetchone()

            return {
                "total_jobs":   job_row["total"] or 0,
                "saved_jobs":   job_row["saved"] or 0,
                "total_apps":   app_row["total"] or 0,
                "applied_apps": app_row["applied"] or 0,
                "emails_sent":  app_row["emails"] or 0,
                "interviews":   app_row["interviews"] or 0,
                "offers":       app_row["offers"] or 0,
                "rejected":     app_row["rejected"] or 0,
                "avg_ats":      round(job_row["avg_ats"] or 0, 1),
            }

    # ─── Agent Logs ───────────────────────────────────────────────────

    def log_agent_activity(self, agent_name: str, action: str, status: str = "Completed", details: str = "") -> int:
        with self._connect() as conn:
            cur = conn.execute(
                "INSERT INTO agent_logs (agent_name, action, status, details) VALUES (?, ?, ?, ?)",
                (agent_name, action, status, details)
            )
            return cur.lastrowid

    def get_agent_logs(self, limit: int = 50) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]
