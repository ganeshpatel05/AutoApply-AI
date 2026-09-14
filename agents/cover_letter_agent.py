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
        Generate a personalized cover letter grounded in candidate experience.
        Returns {"content": str, "used_ai": bool, "model": str, "error": str}
        """
        name = resume_data.get("name", "Candidate")
        skills_list = resume_data.get("skills", [])
        skills_str = ", ".join(skills_list[:20]) if skills_list else "Software Engineering, Problem Solving"
        
        experience = resume_data.get("experience", "")
        education = resume_data.get("education", "")
        raw_text = resume_data.get("raw_text", "")
        
        exp_text = experience if experience else (raw_text[:1500] if raw_text else "Technical background in software development.")
        edu_text = education if education else ""
        
        matched_list = job.get("matched_keywords", [])
        matched_str = ", ".join(matched_list[:10]) if matched_list else ""
        job_title = job.get("title", "Software Developer")
        company = job.get("company", "Target Company")
        jd_text = job.get("description", job.get("jd_text", ""))[:1500]

        word_count_req = "150-200 words" if length == "Short" else ("350-450 words" if length == "Detailed" else "250-300 words")

        prompt = f"""Write a {tone.lower()} job application cover letter grounded directly in the candidate's actual background and achievements.

Candidate Name: {name}
Applying For: {job_title} at {company}

CANDIDATE TECHNICAL SKILLS:
{skills_str}

CANDIDATE WORK & PROJECT EXPERIENCE:
{exp_text[:2000]}

CANDIDATE EDUCATION & BACKGROUND:
{edu_text[:800]}

TARGET JOB DESCRIPTION:
{jd_text}

MATCHING KEYWORDS:
{matched_str}

Requirements:
1. Tone: {tone} ({word_count_req}).
2. Directly reference relevant skills, projects, and achievements from the candidate's actual experience that match the requirements for {job_title} at {company}.
3. Express genuine enthusiasm for joining {company}.
4. Truthful: Do not invent fake companies, degrees, or years of experience not mentioned above.
5. Provide a clear, professional closing call-to-action.

Write ONLY the cover letter text, with no introductory text, surrounding quotes, or markdown code block wrappers."""

        ai_res = self.ollama.generate(
            prompt=prompt,
            system_prompt=f"You are Scribe, an expert executive career strategist crafting highly customized, truthful {tone} cover letters."
        )

        if ai_res["success"] and ai_res["text"]:
            content = ai_res["text"]
            # Clean off any accidental markdown block wrappers if present
            if content.startswith("```") and content.endswith("```"):
                lines = content.split("\n")
                if len(lines) > 2:
                    content = "\n".join(lines[1:-1]).strip()
            used_ai = True
            model_used = ai_res["model"]
            err_msg = ""
        else:
            used_ai = False
            model_used = "Rule-based Fallback"
            err_msg = ai_res.get("error", "Ollama unavailable")
            content = self._generate_fallback(name, job_title, company, skills_str, exp_text[:300], tone=tone, length=length)

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

    def _generate_fallback(self, name: str, title: str, company: str, skills: str, exp_summary: str = "", tone: str = "Professional", length: str = "Standard") -> str:
        exp_context = f" In my recent work, I have focused on: {exp_summary[:180]}..." if exp_summary and len(exp_summary) > 20 else ""

        if tone == "Confident":
            opening = f"I am writing to express my strong interest in joining {company} as a {title}."
            mid = f"My proven technical background in {skills or 'software engineering'} demonstrates my ability to tackle complex problems and deliver measurable results.{exp_context}"
        elif tone == "Concise":
            opening = f"Please accept my application for the {title} role at {company}."
            mid = f"Key qualifications: hands-on expertise in {skills or 'software development'}, system implementation, and collaborative delivery.{exp_context}"
        elif tone == "Enthusiastic":
            opening = f"I am thrilled to apply for the {title} position at {company}!"
            mid = f"I have followed {company}'s growth with great admiration and am confident that my experience with {skills or 'technology'} will add immediate value to your team.{exp_context}"
        else:
            opening = f"I am writing to express my enthusiastic interest in the {title} position at {company}."
            mid = f"With a solid foundation in {skills or 'software engineering'}, I have built scalable solutions and delivered quality code.{exp_context}"

        return f"""Dear Hiring Team at {company},

{opening}

{mid} My hands-on projects and problem-solving skills directly align with the key responsibilities of the {title} role. I take pride in writing maintainable code and adapting quickly to complex team requirements.

Thank you for considering my application. I look forward to discussing how my technical background and passion align with {company}'s goals.

Sincerely,
{name}"""


