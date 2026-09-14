"""AutoApply AI — Resume Parser Tool
Extracts structured information from uploaded PDF resumes.
"""

import re
import json
import pdfplumber
import PyPDF2
from pathlib import Path
from utils.helpers import clean_text, extract_emails, extract_phone_numbers, common_tech_keywords


class ResumeParser:
    """Parses PDF resumes and extracts structured data."""

    def __init__(self):
        self.tech_keywords = common_tech_keywords()
        # Pre-compile keyword pattern for fast matching
        self._keyword_pattern = re.compile(
            r'\b(?:' + '|'.join(re.escape(kw) for kw in sorted(self.tech_keywords, key=len, reverse=True)) + r')\b'
        )

    # ─── Main Parse Entry Point ───────────────────────────────────────

    def parse_pdf(self, pdf_path: str) -> dict:
        """Parse a PDF resume and return structured data."""
        raw_text = self._extract_text(pdf_path)
        if not raw_text:
            raise ValueError(f"Could not extract text from: {pdf_path}")

        return {
            "raw_text":    raw_text,
            "name":        self._extract_name(raw_text),
            "email":       self._extract_email(raw_text),
            "phone":       self._extract_phone(raw_text),
            "skills":      self._extract_skills(raw_text),
            "experience":  self._extract_experience(raw_text),
            "education":   self._extract_education(raw_text),
            "linkedin":    self._extract_linkedin(raw_text),
            "github":      self._extract_github(raw_text),
            "word_count":  len(raw_text.split()),
        }

    def parse_text(self, text: str) -> dict:
        """Parse a plain-text resume."""
        return {
            "raw_text":    text,
            "name":        self._extract_name(text),
            "email":       self._extract_email(text),
            "phone":       self._extract_phone(text),
            "skills":      self._extract_skills(text),
            "experience":  self._extract_experience(text),
            "education":   self._extract_education(text),
            "linkedin":    self._extract_linkedin(text),
            "github":      self._extract_github(text),
            "word_count":  len(text.split()),
        }

    # ─── PDF Text Extraction ──────────────────────────────────────────

    def _extract_text(self, pdf_path: str) -> str:
        """Try pdfplumber first, fallback to PyPDF2."""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text += page_text + "\n"
        except Exception:
            pass

        if not text.strip():
            try:
                with open(pdf_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        text += (page.extract_text() or "") + "\n"
            except Exception as e:
                raise ValueError(f"PDF extraction failed: {e}")

        return clean_text(text)

    # ─── Field Extractors ─────────────────────────────────────────────

    def _extract_name(self, text: str) -> str:
        """Extract candidate name (usually the first non-empty line)."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines[:5]:
            # Skip lines that look like titles/headers
            if len(line.split()) <= 5 and not any(
                kw in line.lower() for kw in
                ["resume", "cv", "curriculum", "profile", "@", "phone", "email"]
            ):
                return line
        return "Candidate"

    def _extract_email(self, text: str) -> str:
        emails = extract_emails(text)
        return emails[0] if emails else ""

    def _extract_phone(self, text: str) -> str:
        from utils.helpers import extract_phone_numbers
        phones = extract_phone_numbers(text)
        return phones[0] if phones else ""

    def _extract_skills(self, text: str) -> list[str]:
        """Extract technical skills by matching against known keyword list."""
        text_lower = text.lower()
        found = []

        # Look for skills section
        skills_section = ""
        patterns = [
            r"(?:technical\s+)?skills?\s*[:\-]?\s*(.*?)(?=\n\n|\Z)",
            r"core\s+competencies?\s*[:\-]?\s*(.*?)(?=\n\n|\Z)",
            r"technologies?\s*[:\-]?\s*(.*?)(?=\n\n|\Z)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                skills_section = match.group(1).lower()
                break

        search_text = (skills_section or text_lower)

        # Single compiled regex pass instead of 65+ individual re.search calls
        found = list(set(self._keyword_pattern.findall(search_text)))

        # Also extract comma/slash-separated words from skills section
        if skills_section:
            raw_skills = re.split(r'[,\|/\n•\-]', skills_section)
            for s in raw_skills:
                s = s.strip()
                if 2 <= len(s) <= 30 and s not in found:
                    found.append(s)

        return list(dict.fromkeys(found))[:30]  # Deduplicate, max 30

    def _extract_experience(self, text: str) -> str:
        """Extract experience section text."""
        pattern = r"(?:work\s+)?experience\s*[:\-]?\s*(.*?)(?=education|skills|projects|certificates|\Z)"
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()[:800]
        return ""

    def _extract_education(self, text: str) -> str:
        """Extract education section text."""
        pattern = r"education\s*[:\-]?\s*(.*?)(?=experience|skills|projects|certificates|\Z)"
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()[:500]
        return ""

    def _extract_linkedin(self, text: str) -> str:
        match = re.search(r'linkedin\.com/in/[\w\-]+', text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    def _extract_github(self, text: str) -> str:
        match = re.search(r'github\.com/[\w\-]+', text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    def get_skills_text(self, resume_data: dict) -> str:
        """Return skills as a comma-separated string."""
        return ", ".join(resume_data.get("skills", []))

    def resume_summary(self, resume_data: dict) -> str:
        """Create a short summary string of the resume for LLM input."""
        return f"""
Name: {resume_data.get('name', 'Candidate')}
Email: {resume_data.get('email', 'N/A')}
Skills: {self.get_skills_text(resume_data)}
Experience: {resume_data.get('experience', '')[:300]}
Education: {resume_data.get('education', '')[:200]}
""".strip()
