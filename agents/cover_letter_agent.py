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
        # 1. Candidate Name Resolution
        name = resume_data.get("name", "").strip()
        if not name or name.lower() == "candidate":
            from tools.resume_parser import ResumeParser
            name = ResumeParser()._extract_name(resume_data.get("raw_text", ""))
        if not name or name.lower() == "candidate":
            prof = self.db.get_profile()
            if prof and prof.get("full_name"):
                name = prof["full_name"]
        if not name:
            name = "Candidate"

        # 2. Extract Experience & Education Context
        experience = resume_data.get("experience", "")
        education = resume_data.get("education", "")
        raw_text = resume_data.get("raw_text", "")

        if not experience and raw_text:
            from tools.resume_parser import ResumeParser
            experience = ResumeParser()._extract_experience(raw_text)

        if not education and raw_text:
            from tools.resume_parser import ResumeParser
            education = ResumeParser()._extract_education(raw_text)

        # 3. Clean & Prioritize Skills List
        skills_list = resume_data.get("skills", [])
        cleaned_skills = []
        for s in skills_list:
            clean_s = s.strip()
            if ':' in clean_s:
                clean_s = clean_s.split(':')[-1].strip()
            clean_s = clean_s.title()
            if clean_s and clean_s not in cleaned_skills:
                cleaned_skills.append(clean_s)
        
        soft_skills = {"communication", "problem solving", "agile", "testing", "debugging", "teamwork", "leadership", "management", "api", "rest"}
        tech_skills = [s for s in cleaned_skills if s.lower() not in soft_skills]
        other_skills = [s for s in cleaned_skills if s.lower() in soft_skills]
        ordered_skills = tech_skills + other_skills
        top_skills = ordered_skills[:10] if ordered_skills else ["Software Engineering", "Full Stack Development", "System Architecture"]
        skills_str = ", ".join(top_skills)


        # 4. Job Details
        job_title = job.get("title", "Software Developer")
        company = job.get("company", "Target Company")
        jd_text = job.get("description", job.get("jd_text", ""))[:1500]
        matched_list = job.get("matched_keywords", [])
        matched_str = ", ".join([m.title() for m in matched_list[:8]]) if matched_list else ""

        word_count_req = "150-200 words" if length == "Short" else ("350-450 words" if length == "Detailed" else "250-300 words")

        prompt = f"""Write a highly professional, {tone.lower()} cover letter for a job application.

Candidate Name: {name}
Applying For: {job_title} at {company}

CANDIDATE EDUCATION & CREDENTIALS:
{education[:400] if education else "Computer Applications & Software Engineering"}

CANDIDATE TECHNICAL SKILLS:
{skills_str}

CANDIDATE WORK & PROJECT EXPERIENCE SUMMARY:
{experience[:1800]}

TARGET JOB DESCRIPTION:
{jd_text}

MATCHING RELEVANT SKILLS:
{matched_str}

STRUCTURE REQUIREMENTS:
1. Tone: {tone} ({word_count_req}).
2. Paragraph 1: State interest in {job_title} at {company}, candidate name ({name}), and core qualifications.
3. Paragraph 2: Connect candidate's actual projects, tools ({skills_str}), and past achievements with key job description requirements.
4. Paragraph 3: Express enthusiasm for {company} and request an interview opportunity.
5. Closing: End strictly with 'Sincerely,' followed on the next line by '{name}'.
6. Truthful: Do not invent fake previous employer names or fake degrees.

Write ONLY the complete cover letter text."""

        ai_res = self.ollama.generate(
            prompt=prompt,
            system_prompt=f"You are Scribe, an executive career writer specializing in customized {tone} job application cover letters."
        )

        if ai_res["success"] and ai_res["text"]:
            content = ai_res["text"].strip()
            if content.startswith("```") and content.endswith("```"):
                lines = content.split("\n")
                if len(lines) > 2:
                    content = "\n".join(lines[1:-1]).strip()
            used_ai = True
            model_used = ai_res["model"]
            err_msg = ""
        else:
            used_ai = False
            model_used = "Smart Rule-Based Engine"
            err_msg = ai_res.get("error", "Ollama unavailable")
            content = self._generate_fallback(
                name=name,
                title=job_title,
                company=company,
                skills=top_skills,
                education=education,
                exp_summary=experience,
                tone=tone,
                length=length
            )

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

    def _generate_fallback(self, name: str, title: str, company: str, skills: list[str], education: str = "", exp_summary: str = "", tone: str = "Professional", length: str = "Standard") -> str:
        """Executive-level rule-based cover letter builder."""
        skills_formatted = ", ".join(skills[:6]) if skills else "Software Engineering and Modern Web Development"
        
        degree_match = ""
        if education:
            import re
            deg_found = re.findall(r'\b(?:MCA|BCA|B\.Tech|M\.Tech|BTech|MTech|B\.Sc|M\.Sc|Bachelor|Master)[^,\.\n]*', education, re.IGNORECASE)
            if deg_found:
                degree_match = f" holding a {deg_found[0].strip()}"

        # Clean up exp_summary snippet
        clean_exp = exp_summary.strip()
        if len(clean_exp) > 250:
            clean_exp = clean_exp[:250].rsplit('.', 1)[0] + "."

        if tone == "Confident":
            p1 = f"I am writing to express my strong interest in the {title} position at {company}. As a dedicated developer{degree_match} with expertise in {skills_formatted}, I am confident in my ability to deliver immediate value to your technical initiatives."
            p2 = f"Throughout my software projects, I have developed expertise in building scalable application components, writing clean code, and working with modern databases and APIs.{' ' + clean_exp if clean_exp else ''} My technical toolkit directly aligns with the core requirements of your {title} role."
            p3 = f"I am eager to contribute my problem-solving abilities and passion for quality engineering to {company}. Thank you for your consideration, and I look forward to discussing how my experience aligns with your team's goals."
        elif tone == "Enthusiastic":
            p1 = f"I am thrilled to apply for the {title} position at {company}! As a software developer{degree_match} specializing in {skills_formatted}, I have followed {company}'s work with great admiration."
            p2 = f"My hands-on background includes designing responsive web applications, developing robust backend services, and deploying software solutions.{' ' + clean_exp if clean_exp else ''} I thrive in fast-paced environments where innovation and clean system architecture are prioritized."
            p3 = f"Joining {company} as a {title} represents an exciting milestone for my career, and I am eager to bring my technical skills and enthusiasm to your team. Thank you for your time and consideration."
        elif tone == "Concise":
            p1 = f"Please accept this application for the {title} role at {company}. I bring a strong background in software engineering{degree_match} with hands-on experience in {skills_formatted}."
            p2 = f"In my recent projects, I have focused on full-stack application development, database management, and API design.{' ' + clean_exp if clean_exp else ''} I pride myself on writing efficient code and delivering reliable software."
            p3 = f"I would welcome the opportunity to interview and discuss how my technical skills align with {company}'s objectives. Thank you for your time."
        else: # Professional
            p1 = f"I am writing to express my enthusiastic interest in the {title} position at {company}. As a motivated software developer{degree_match} with a solid foundation in {skills_formatted}, I am excited about the opportunity to contribute to {company}'s engineering team."
            p2 = f"My technical background encompasses building responsive user interfaces, implementing backend RESTful services, and optimizing database performance.{' ' + clean_exp if clean_exp else ''} I take pride in adhering to software engineering best practices and collaborating effectively across development cycles."
            p3 = f"The {title} role at {company} matches my career trajectory and core technical qualifications. Thank you for your time and consideration, and I look forward to discussing my application with you."

        return f"""Dear Hiring Team at {company},

{p1}

{p2}

{p3}

Sincerely,
{name}"""



