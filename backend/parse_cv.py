import re
import io
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2
import docx

app = FastAPI(
    title="CV Extraction & Section Sorting Model API",
    description="Python NLP & Regex model for extracting Name, Phone, Email, Summary, Work Experience, Skills, Education from CV documents.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkExperience(BaseModel):
    id: str
    jobTitle: str
    company: str
    period: str
    description: List[str]

class Education(BaseModel):
    id: str
    degree: str
    fieldOfStudy: str
    institution: str
    year: str

class SkillCategory(BaseModel):
    categoryName: str
    skills: List[str]

class SocialLink(BaseModel):
    platform: str
    url: str

class ParsedCVResponse(BaseModel):
    name: str
    email: str
    phone: str
    location: str
    summary: str
    workExperience: List[WorkExperience]
    education: List[Education]
    skills: List[SkillCategory]
    languages: List[str]
    links: List[SocialLink]
    completenessScore: int
    sectionOrder: List[str]

SKILL_DB = {
    "Technical Skills": ["python", "javascript", "typescript", "java", "c++", "c#", "html", "css", "sql", "bash"],
    "Frameworks & Libraries": ["react", "next.js", "vue", "angular", "node.js", "django", "fastapi", "spring boot", "tailwind css", "express"],
    "Tools & Infrastructure": ["git", "docker", "kubernetes", "aws", "azure", "gcp", "linux", "postgresql", "mongodb", "figma", "jira"],
    "Soft Skills": ["leadership", "communication", "teamwork", "problem solving", "agile", "scrum", "project management"]
}

def parse_text_model(raw_text: str) -> Dict[str, Any]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    # 1. Regex Contact Extractor
    email = ""
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
    if email_match:
        email = email_match.group(0)

    phone = ""
    phone_match = re.search(r'(\+?\d{1,4}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}', raw_text)
    if phone_match:
        phone = phone_match.group(0).strip()

    # 2. Name Extractor
    name = "Candidate Name"
    for line in lines[:8]:
        if "cv" in line.lower() or "resume" in line.lower() or "@" in line or any(char.isdigit() for char in line):
            continue
        words = line.split()
        if 1 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
            name = line.strip()
            break

    # 3. Skills Classifier
    lower_text = raw_text.lower()
    skills_output = []
    for cat_name, keywords in SKILL_DB.items():
        found = [kw.title() for kw in keywords if kw in lower_text]
        if found:
            skills_output.append({"categoryName": cat_name, "skills": list(set(found))})

    # 4. Location Extractor
    location = "City, Country"
    location_match = re.search(r'(?:address|location|city)\s*[:\-]?\s*(.+)', raw_text, re.IGNORECASE)
    if location_match:
        location = location_match.group(1).strip()[:80]

    # 5. Summary & Experience Simple Segmenter
    summary = ""
    exp_list = []
    edu_list = []
    languages_found = []
    links_found = []
    
    current_section = "summary"
    exp_buffer = []
    
    for line in lines:
        l_lower = line.lower()
        if "summary" in l_lower or "profile" in l_lower or "about" in l_lower or "objective" in l_lower:
            current_section = "summary"
            continue
        elif "experience" in l_lower or "employment" in l_lower or "work history" in l_lower:
            current_section = "experience"
            continue
        elif "education" in l_lower or "academic" in l_lower or "qualification" in l_lower:
            current_section = "education"
            continue
        elif "language" in l_lower:
            current_section = "languages"
            continue
        elif "skill" in l_lower:
            current_section = "skills_section"
            continue
        
        if current_section == "summary":
            summary += " " + line
        elif current_section == "experience":
            if len(line) > 5 and ("present" in l_lower or re.search(r'\b(19|20)\d{2}\b', line)):
                # This looks like a job title / period line
                if exp_buffer:
                    exp_list.append(exp_buffer[-1])
                period_match = re.search(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w]*[\s\d,\-–]+(?:Present|\d{4}))', line, re.IGNORECASE)
                period = period_match.group(0).strip() if period_match else "Dates"
                exp_buffer.append({
                    "id": str(uuid.uuid4())[:8],
                    "jobTitle": re.sub(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w]*[\s\d,\-–]+(?:Present|\d{4}))', '', line, flags=re.IGNORECASE).strip() or line,
                    "company": "",
                    "period": period,
                    "description": []
                })
            elif exp_buffer:
                last = exp_buffer[-1]
                if not last["company"]:
                    last["company"] = line
                else:
                    last["description"].append(line)
        elif current_section == "education":
            if any(deg in l_lower for deg in ["bachelor", "master", "phd", "degree", "bs", "ms", "b.sc", "m.sc", "diploma", "certificate", "hnd", "a/l", "o/l"]):
                year_match = re.search(r'(19|20)\d{2}', line)
                edu_list.append({
                    "id": str(uuid.uuid4())[:8],
                    "degree": line.strip(),
                    "fieldOfStudy": "",
                    "institution": "",
                    "year": year_match.group(0) if year_match else ""
                })
            elif edu_list and not edu_list[-1]["institution"]:
                edu_list[-1]["institution"] = line.strip()
        elif current_section == "languages":
            for lang in re.split(r'[,;|•·\-]', line):
                lang = lang.strip()
                if lang and len(lang) < 30:
                    languages_found.append(lang)

    # Flush last experience buffer
    if exp_buffer:
        exp_list.append(exp_buffer[-1])

    # Social links extraction
    url_matches = re.findall(r'(https?://[^\s,]+)', raw_text)
    for url in url_matches:
        platform = "Website"
        ul = url.lower()
        if "linkedin" in ul: platform = "LinkedIn"
        elif "github" in ul: platform = "GitHub"
        elif "twitter" in ul or "x.com" in ul: platform = "Twitter/X"
        elif "facebook" in ul: platform = "Facebook"
        elif "stackoverflow" in ul: platform = "StackOverflow"
        links_found.append({"platform": platform, "url": url})

    # Defaults
    if not exp_list:
        exp_list = [{
            "id": str(uuid.uuid4())[:8],
            "jobTitle": "Not specified",
            "company": "Not specified",
            "period": "—",
            "description": ["No work experience details extracted."]
        }]

    if not edu_list:
        edu_list = [{
            "id": str(uuid.uuid4())[:8],
            "degree": "Not specified",
            "fieldOfStudy": "",
            "institution": "Not specified",
            "year": ""
        }]

    if not languages_found:
        languages_found = ["English"]

    # Completeness scoring
    score = 0
    if name != "Candidate Name": score += 15
    if email: score += 15
    if phone: score += 10
    if summary.strip(): score += 15
    if exp_list and exp_list[0]["jobTitle"] != "Not specified": score += 15
    if edu_list and edu_list[0]["degree"] != "Not specified": score += 15
    if skills_output: score += 10
    if links_found: score += 5

    section_order = []
    if summary.strip(): section_order.append("summary")
    if exp_list and exp_list[0]["jobTitle"] != "Not specified": section_order.append("workExperience")
    if skills_output: section_order.append("skills")
    if edu_list and edu_list[0]["degree"] != "Not specified": section_order.append("education")

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location,
        "summary": summary.strip() or "No summary extracted from CV.",
        "workExperience": exp_list,
        "education": edu_list,
        "skills": skills_output,
        "languages": languages_found,
        "links": links_found,
        "completenessScore": min(score, 100),
        "sectionOrder": section_order
    }

@app.get("/")
def read_root():
    return {"message": "CV Parsing NLP Engine API is running"}

def extract_text(filename: str, content: bytes) -> str:
    filename = filename.lower()
    raw_text = ""
    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        for page in reader.pages:
            raw_text += page.extract_text() + "\n"
    elif filename.endswith(".docx") or filename.endswith(".doc"):
        doc = docx.Document(io.BytesIO(content))
        raw_text = "\n".join([p.text for p in doc.paragraphs])
    else:
        raw_text = content.decode("utf-8", errors="ignore")
    return raw_text

@app.post("/api/parse-cv", response_model=ParsedCVResponse)
async def parse_cv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        return parse_text_model(extract_text(file.filename, content))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # CLI mode (used by the ASP.NET backend): parse the given file and print JSON to stdout
        import json
        path = sys.argv[1]
        try:
            with open(path, "rb") as f:
                result = parse_text_model(extract_text(path, f.read()))
            print(json.dumps(result, default=str))
        except Exception as e:
            print(f"Parsing error: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Standalone server mode: python parse_cv.py
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
