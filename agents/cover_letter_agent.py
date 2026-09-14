"""AutoApply AI — Agent 4: Cover Letter Agent
Generates professional cover letters using local Ollama model or graceful rule-based fallback.
"""

from tools.ollama_client import OllamaClient
from database.db_manager import DatabaseManager


class CoverLetterAgent:
    """Agent responsible for crafting truthful, personalized cover letters."""

    def __init__(self, db: DatabaseManager = None):
        self.ollama = OllamaClient()
        self.db = db or DatabaseManager()

    def generate_cover_letter(self, resume_data: dict, job: dict, tone: str = "Professional", length: str = "Standard") -> dict:
        """
        Generate a personalized cover letter.
        Returns {"content": str, "used_ai": bool, "model": str, "error": str}
        """
        name = resume_data.get("name", "Candidate")
        skills_list = resume_data.get("skills", [])
        skills_str = ", ".join(skills_list[:6])
        matched_str = ", ".join(job.get("matched_keywords", [])[:5])
        job_title = job.get("title", "Software Developer")
        company = job.get("company", "Company")
        jd_excerpt = job.get("description", job.get("jd_text", ""))[:400]

        word_count_req = "150-200 words" if length == "Short" else ("350-450 words" if length == "Detailed" else "250-300 words")

        prompt = f"""Write a {tone.lower()} job application cover letter.

Candidate Name: {name}
Applying For: {job_title} at {company}
Key Skills: {skills_str}
Matching Keywords: {matched_str}

Job Description Excerpt:
{jd_excerpt}

Requirements:
1. Tone: {tone} ({word_count_req}).
2. Highlight relevant candidate skills matching the job description.
3. Express genuine enthusiasm for {company}.
4. Clear closing call-to-action.
5. Truthful - do not invent fake experience.

Write ONLY the cover letter text, no preamble or commentary."""

        ai_res = self.ollama.generate(
            prompt=prompt,
            system_prompt=f"You are Scribe, an expert career writer specializing in {tone} cover letters."
        )

        if ai_res["success"] and ai_res["text"]:
            content = ai_res["text"]
            used_ai = True
            model_used = ai_res["model"]
            err_msg = ""
        else:
            used_ai = False
            model_used = "Rule-based Fallback"
            err_msg = ai_res.get("error", "Ollama unavailable")
            content = self._generate_fallback(name, job_title, company, skills_str, tone=tone, length=length)

        # Save to database if job has DB ID
        job_id = job.get("id") or job.get("db_id")
        if job_id:
            self.db.save_cover_letter(job_id=job_id, content=content)

        self.db.log_agent_activity(
            "Scribe",
            f"Generated {tone} cover letter for {job_title} at {company}",
            "Completed" if used_ai else "Fallback",
            f"Model: {model_used} | Length: {length}"
        )

        return {
            "content": content,
            "used_ai": used_ai,
            "model": model_used,
            "error": err_msg
        }

    def _generate_fallback(self, name: str, title: str, company: str, skills: str, tone: str = "Professional", length: str = "Standard") -> str:
        if tone == "Confident":
            opening = f"I am writing to express my eager interest in joining {company} as a {title}."
            mid = f"My track record in {skills or 'software engineering'} demonstrates my ability to tackle complex challenges and deliver measurable results from day one."
        elif tone == "Concise":
            opening = f"Please accept this application for the {title} role at {company}."
            mid = f"Key qualifications: hands-on expertise in {skills or 'software development'}, problem-solving, and collaborative delivery."
        elif tone == "Enthusiastic":
            opening = f"I am thrilled to apply for the {title} position at {company}!"
            mid = f"I have followed {company}'s work with great admiration and am confident that my passion for {skills or 'technology'} will add immediate value."
        else:
            opening = f"I am writing to express my strong interest in the {title} position at {company}."
            mid = f"With a solid technical background and hands-on experience in {skills or 'software development'}, I am confident in my ability to make meaningful contributions to your team."

        return f"""Dear Hiring Team at {company},

{opening}

{mid} Throughout my technical projects, I have developed expertise in building scalable software solutions and collaborating effectively in fast-paced environments. My background directly aligns with the core requirements of the {title} role.

Thank you for considering my application. I look forward to the opportunity to discuss how my technical skills and enthusiasm align with your team's goals.

Sincerely,
{name}"""

