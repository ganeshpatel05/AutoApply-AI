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
        """Extract and title-case candidate name accurately."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines[:5]:
            clean_line = re.sub(r'[\w\.-]+@[\w\.-]+', '', line)
            clean_line = re.sub(r'(?:https?://)?(?:www\.)?(?:linkedin|github)\.com\S*', '', clean_line, flags=re.IGNORECASE)
            clean_line = re.sub(r'[\+\d\-\(\)\s]{8,}', '', clean_line)
            clean_line = re.sub(r'\b(?:resume|cv|curriculum|vitae|profile|summary|contact|email|phone)\b', '', clean_line, flags=re.IGNORECASE).strip()
            
            words = clean_line.split()
            if 1 <= len(words) <= 4:
                title_keywords = {"software", "developer", "engineer", "full", "stack", "java", "python", "backend", "frontend", "web", "data", "intern", "manager", "lead", "senior", "junior"}
                if not any(w.lower() in title_keywords for w in words):
                    name = " ".join(words).title()
                    if len(name) >= 3:
                        return name

        first_chunk = text[:300]
        first_chunk = re.sub(r'[\w\.-]+@[\w\.-]+', '', first_chunk)
        first_chunk = re.sub(r'(?:https?://)?(?:www\.)?(?:linkedin|github)\.com\S*', '', first_chunk, flags=re.IGNORECASE)
        first_chunk = re.sub(r'[\+\d\-\(\)\s]{8,}', '', first_chunk)
        
        split_pattern = r'\b(?:Software|Developer|Java|Full|Stack|Engineer|Web|Data|Python|Backend|Frontend|Indore|Mumbai|Delhi|Bangalore|Pune|Hyderabad|India|USA|UK|PROFESSIONAL|SUMMARY|OBJECTIVE|EXPERIENCE|EDUCATION)\b'
        match = re.search(split_pattern, first_chunk, re.IGNORECASE)
        if match:
            name_part = first_chunk[:match.start()].strip()
            words = name_part.split()
            if 1 <= len(words) <= 4:
                name = " ".join(words).title()
                if len(name) >= 3:
                    return name
                    
        return "Candidate"

    def _extract_email(self, text: str) -> str:
        emails = extract_emails(text)
        return emails[0] if emails else ""

    def _extract_phone(self, text: str) -> str:
        from utils.helpers import extract_phone_numbers
        phones = extract_phone_numbers(text)
        return phones[0] if phones else ""

    def _extract_skills(self, text: str) -> list[str]:
        """Extract clean technical skills without section category labels."""
        text_lower = text.lower()
        found = []

        skills_section = ""
        patterns = [
            r"(?:technical\s+)?skills?\s*[:\-]?\s*(.*?)(?=\n\s*(?:education|experience|projects|academic|\n)|\Z)",
            r"core\s+competencies?\s*[:\-]?\s*(.*?)(?=\n\s*(?:education|experience|projects|\n)|\Z)",
            r"technologies?\s*[:\-]?\s*(.*?)(?=\n\s*(?:education|experience|projects|\n)|\Z)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                skills_section = match.group(1).lower()
                break

        search_text = (skills_section or text_lower)
        found = list(set(self._keyword_pattern.findall(search_text)))

        if skills_section:
            raw_skills = re.split(r'[,\|/\n•\-]', skills_section)
            for s in raw_skills:
                s = s.strip()
                if ':' in s:
                    s = s.split(':')[-1].strip()
                if 2 <= len(s) <= 35 and s not in found:
                    found.append(s)

        cleaned = []
        for item in found:
            if ':' in item:
                item = item.split(':')[-1].strip()
            item_clean = item.strip().title()
            if len(item_clean) >= 2 and item_clean not in cleaned:
                cleaned.append(item_clean)

        return cleaned[:30]

    def _extract_experience(self, text: str) -> str:
        """Extract experience and key project section text."""
        patterns = [
            r"(?:professional\s+|career\s+)?summary\s*[:\-]?\s*(.*?)(?=\n\s*(?:technical\s+skills|skills|education|projects|academic|certifications)|\Z)",
            r"(?:professional\s+|work\s+|employment\s+|career\s+|relevant\s+)?(?:experience|history|employment)\s*[:\-]?\s*(.*?)(?=\n\s*(?:education|skills|projects|certifications|certificates|honors|publications|languages)|\Z)",
            r"(?:key\s+)?projects?\s*[:\-]?\s*(.*?)(?=\n\s*(?:education|skills|certifications|certificates|honors|languages|\Z))"
        ]
        extracted = []
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match and len(match.group(1).strip()) > 20:
                extracted.append(match.group(1).strip())
        
        if extracted:
            combined = "\n\n".join(extracted)
            return combined[:3000]
        
        return text[:2000].strip()

    def _extract_education(self, text: str) -> str:
        """Extract education section text."""
        pattern = r"(?:education|academic\s+qualifications|academic\s+background|qualifications|education\s+&\s+training)\s*[:\-]?\s*(.*?)(?=\n\s*(?:experience|skills|projects|certifications|summary|\Z))"
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match and len(match.group(1).strip()) > 10:
            return match.group(1).strip()[:1500]
            
        degrees = re.findall(r'(?:bachelor|master|bca|mca|b\.tech|m\.tech|btech|mtech|b\.sc|m\.sc|diploma)[^.\n]+', text, re.IGNORECASE)
        if degrees:
            return " | ".join([d.strip() for d in degrees[:4]])
        return ""

    def _extract_linkedin(self, text: str) -> str:
        match = re.search(r'linkedin\.com/in/[\w\-]+', text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    def _extract_github(self, text: str) -> str:
        match = re.search(r'github\.com/[\w\-]+', text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    def get_skills_text(self, resume_data: dict) -> str:
        """Return skills as a clean comma-separated string."""
        return ", ".join(resume_data.get("skills", []))

    def resume_summary(self, resume_data: dict) -> str:
        """Create a detailed summary string of the resume for LLM input."""
        exp = resume_data.get('experience', '')
        edu = resume_data.get('education', '')
        raw = resume_data.get('raw_text', '')
        if not exp and raw:
            exp = raw[:1500]
        return f"""Candidate Name: {resume_data.get('name', 'Candidate')}
Email: {resume_data.get('email', 'N/A')}
Phone: {resume_data.get('phone', 'N/A')}
Technical & Core Skills: {self.get_skills_text(resume_data)}

Work & Project Experience:
{exp[:2500]}

Education & Background:
{edu[:1000]}""".strip()


