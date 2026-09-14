"""AutoApply AI — Job Scraper & Sources Architecture
Clean job search abstraction with live scrapers and bundled demo data mode.
"""

import re
import time
import random
import requests
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from config.settings import SCRAPE_DELAY, MAX_JOBS


class JobSource(ABC):
    """Abstract base class for all job sources."""

    @abstractmethod
    def search(self, role: str, location: str = "", experience: str = "0") -> list[dict]:
        """Search jobs and return normalized list of job dicts."""
        pass


class DemoJobSource(JobSource):
    """Bundled sample job data source for offline/demonstration mode."""

    def search(self, role: str, location: str = "", experience: str = "0") -> list[dict]:
        companies = [
            ("TCS", "Tata Consultancy Services"),
            ("Infosys", "Infosys Limited"),
            ("Wipro", "Wipro Technologies"),
            ("HCLTech", "HCL Technologies"),
            ("Tech Mahindra", "Tech Mahindra Limited"),
            ("Cognizant", "Cognizant Technology Solutions"),
            ("Accenture", "Accenture India"),
            ("Capgemini", "Capgemini India"),
        ]

        skills_pool = [
            "Python, Machine Learning, TensorFlow, SQL, Git",
            "Java, Spring Boot, Microservices, Docker, AWS",
            "React, Node.js, MongoDB, REST API, Git",
            "Data Science, Pandas, NumPy, Scikit-learn, Tableau",
            "Django, Flask, PostgreSQL, Redis, Linux",
            "Full Stack Development, React, Python, MySQL",
            "Angular, TypeScript, Node.js, GraphQL, Docker",
        ]

        jd_template = (
            "{role} Developer / Engineer\n\n"
            "We are hiring a talented {role} professional to join our team at {company}.\n\n"
            "Responsibilities:\n"
            "- Design, implement and maintain efficient software solutions\n"
            "- Collaborate with cross-functional development teams\n"
            "- Write clean, robust and testable code\n"
            "- Participate in design and code reviews\n\n"
            "Required Skills:\n"
            "{skills}\n\n"
            "Qualifications:\n"
            "- B.E. / B.Tech / MCA in Computer Science or IT\n"
            "- 0-2 years of relevant hands-on experience\n"
            "- Solid problem-solving and communication abilities\n\n"
            "Benefits: Competitive salary | Health insurance | Learning & Growth"
        )

        jobs = []
        locs = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai", "Remote", "Noida"]
        for i, (short, full) in enumerate(companies):
            skills = random.choice(skills_pool)
            job_loc = location if location else locs[i % len(locs)]
            jobs.append({
                "title": f"{role} Developer" if "Developer" not in role and "Engineer" not in role else role,
                "company": full,
                "location": job_loc,
                "description": jd_template.format(role=role, company=full, skills=skills),
                "requirements": skills,
                "url": f"https://demo-jobs.autoapply.ai/job/{role.lower().replace(' ','-')}-{short.lower()}-{i+1}",
                "source": "Demo Mode",
                "source_job_id": f"DEMO-{short}-{i+1}",
                "salary": "₹5.5L - ₹8.5L P.A.",
                "job_type": "Full-time",
                "experience": f"{experience} years" if experience != "0" else "0-2 years",
            })
        return jobs


class PublicJobSource(JobSource):
    """Scrapes public job listings from available sites."""

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    def search(self, role: str, location: str = "", experience: str = "0") -> list[dict]:
        session = requests.Session()
        session.headers.update(self.HEADERS)

        jobs = []
        # Try Internshala jobs endpoint
        try:
            role_slug = role.lower().replace(" ", "-")
            url = f"https://internshala.com/jobs/{role_slug}-jobs"
            resp = session.get(url, timeout=6)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                cards = soup.select(".internship_meta, .individual_internship")
                for card in cards[:10]:
                    title_el = card.select_one(".job-internship-name, .company-name a, h3")
                    comp_el = card.select_one(".company-name, .company")
                    loc_el = card.select_one(".location_link, .location")
                    link_el = card.select_one("a[href*='/jobs/detail']") or card.select_one("a[href]")

                    title = title_el.get_text(strip=True) if title_el else ""
                    company = comp_el.get_text(strip=True) if comp_el else ""
                    loc = loc_el.get_text(strip=True) if loc_el else (location or "Remote")
                    link = f"https://internshala.com{link_el['href']}" if link_el and link_el.get("href") else url

                    if title and company:
                        jobs.append({
                            "title": title,
                            "company": company,
                            "location": loc,
                            "description": f"{title} position at {company}. Skills required for {role}.",
                            "requirements": f"{role}, Communication, Teamwork",
                            "url": link,
                            "source": "Internshala",
                            "source_job_id": "",
                            "salary": "Not specified",
                            "job_type": "Full-time",
                            "experience": f"{experience} years",
                        })
        except Exception:
            pass

        return jobs


class JobScraper:
    """Orchestrates job searching across sources with fallback to Demo Mode."""

    def __init__(self, demo_mode: bool = False):
        self.demo_mode = demo_mode
        self.demo_source = DemoJobSource()
        self.public_source = PublicJobSource()

    def search_jobs(self, role: str, location: str = "", experience: str = "0", demo_mode: bool = None) -> list[dict]:
        use_demo = self.demo_mode if demo_mode is None else demo_mode
        
        if use_demo:
            print("   [INFO] Using Demo Job Source")
            return self.demo_source.search(role, location, experience)

        print(f"[SEARCH] Searching live jobs for: {role} in {location or 'All India'}")
        live_jobs = []
        try:
            live_jobs = self.public_source.search(role, location, experience)
        except Exception as e:
            print(f"   [WARNING] Live scraping error: {e}")

        if not live_jobs:
            print("   [INFO] Live source returned no jobs or was blocked. Returning empty list.")
            return []

        return live_jobs[:MAX_JOBS]
