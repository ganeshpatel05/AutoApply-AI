"""AutoApply AI — Agent 1: Resume Agent
Extracts and structures resume information from PDF or plain text.
"""

from tools.resume_parser import ResumeParser
from database.db_manager import DatabaseManager


class ResumeAgent:
    """Agent responsible for parsing resumes and storing active profiles."""

    def __init__(self, db: DatabaseManager = None):
        self.parser = ResumeParser()
        self.db = db or DatabaseManager()

    def process_pdf(self, pdf_path: str) -> dict:
        """Parse PDF resume, save to database, mark active and return data."""
        data = self.parser.parse_pdf(pdf_path)
        filename = pdf_path.replace("\\", "/").split("/")[-1]
        
        resume_id = self.db.save_resume(
            name=data.get("name", "Candidate"),
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            file_path=pdf_path,
            raw_text=data.get("raw_text", ""),
            skills=data.get("skills", []),
            experience=data.get("experience", ""),
            education=data.get("education", ""),
            linkedin=data.get("linkedin", ""),
            github=data.get("github", "")
        )
        data["db_id"] = resume_id
        self.db.log_agent_activity("ResumeMind", f"Parsed PDF resume '{data.get('name')}'", "Completed", f"Extracted {len(data.get('skills', []))} skills")
        return data

    def process_text(self, name: str, text: str) -> dict:
        """Parse plain text resume, save to database and return data."""
        data = self.parser.parse_text(text)
        data["name"] = name or data.get("name", "Candidate")
        
        resume_id = self.db.save_resume(
            name=data["name"],
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            file_path="",
            raw_text=data.get("raw_text", ""),
            skills=data.get("skills", []),
            experience=data.get("experience", ""),
            education=data.get("education", ""),
            linkedin=data.get("linkedin", ""),
            github=data.get("github", "")
        )
        data["db_id"] = resume_id
        self.db.log_agent_activity("ResumeMind", f"Parsed text resume '{data['name']}'", "Completed", f"Extracted {len(data.get('skills', []))} skills")
        return data

    def get_active_resume(self) -> dict | None:
        """Fetch current active resume from SQLite database."""
        return self.db.get_active_resume()

    def score_resume(self, data: dict) -> dict:
        """Calculate a detailed resume quality score based on extracted fields."""
        content_score = 0
        skills_score = 0
        experience_score = 0
        education_score = 0
        completeness_score = 0

        # Content (Word Count)
        wc = data.get("word_count", 0)
        if wc > 600: content_score = 95
        elif wc > 300: content_score = 80
        elif wc > 100: content_score = 50
        else: content_score = 20

        # Skills
        skills = data.get("skills", [])
        if len(skills) > 15: skills_score = 95
        elif len(skills) > 8: skills_score = 80
        elif len(skills) > 3: skills_score = 50
        else: skills_score = 20

        # Experience
        exp = data.get("experience", "")
        if len(exp) > 300: experience_score = 95
        elif len(exp) > 100: experience_score = 70
        elif len(exp) > 20: experience_score = 40

        # Education
        edu = data.get("education", "")
        if len(edu) > 50: education_score = 95
        elif len(edu) > 10: education_score = 60

        # Completeness (Contact Info)
        fields = ["email", "phone", "linkedin", "github"]
        found_fields = sum(1 for f in fields if data.get(f))
        completeness_score = min(100, found_fields * 25)

        # Weighted Total
        total = int((content_score * 0.15) + (skills_score * 0.3) + (experience_score * 0.3) + (education_score * 0.15) + (completeness_score * 0.1))

        # Generate Actionable Suggestions
        suggestions = []
        if len(skills) < 10:
            suggestions.append("Add more specific technical frameworks & tools to your Skills section.")
        if "metrics" not in data.get("raw_text", "").lower() and "%" not in data.get("raw_text", ""):
            suggestions.append("Include measurable impact and metrics (e.g. 'Improved efficiency by 30%') in project descriptions.")
        if not data.get("linkedin"):
            suggestions.append("Add a valid LinkedIn profile URL to boost profile credibility.")
        if not data.get("github"):
            suggestions.append("Add a GitHub profile link to demonstrate code repositories.")
        if len(exp) < 150:
            suggestions.append("Expand work experience and key technical project details.")

        if not suggestions:
            suggestions.append("Great resume profile! Keep your project achievements updated with recent tech stacks.")

        return {
            "content": content_score,
            "skills": skills_score,
            "experience": experience_score,
            "education": education_score,
            "completeness": completeness_score,
            "suggestions": suggestions,
            "total": total
        }


