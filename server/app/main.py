import io
import os
import re
import json
import math
import sqlite3
import hashlib
from collections import Counter
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

try:
    import docx
except Exception:
    docx = None


# ---------------- CONFIG ----------------

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_secret_key")
ALGORITHM = "HS256"
DB_PATH = "research_originality.db"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "")
SEMANTIC_SCHOLAR_API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

app = FastAPI(title="Research Originality Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ---------------- MODELS ----------------

class AuthUser(BaseModel):
    name: str | None = None
    email: str
    password: str


class TextRequest(BaseModel):
    text: str
    mode: str | None = "paraphrase"


class ReportRequest(BaseModel):
    title: str | None = "Originality Report"
    text: str
    improved_text: str | None = ""
    result: dict | None = {}


# ---------------- DATABASE ----------------

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        title TEXT,
        text TEXT,
        improved_text TEXT,
        plagiarism_percentage REAL,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


init_db()


# ---------------- AUTH ----------------

def create_token(email: str):
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        return email

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/")
def home():
    return {
        "message": "Backend running successfully",
        "online_search": {
            "serper": bool(SERPER_API_KEY),
            "brave": bool(BRAVE_API_KEY),
            "semantic_scholar": bool(SEMANTIC_SCHOLAR_API_KEY),
            "groq": bool(GROQ_API_KEY),
        },
    }


@app.post("/auth/signup")
def signup(user: AuthUser):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT email FROM users WHERE email = ?", (user.email,))
    existing = cur.fetchone()

    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(user.password)

    cur.execute(
        """
        INSERT INTO users (name, email, password, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            user.name,
            user.email,
            hashed_password,
            datetime.utcnow().isoformat(),
        ),
    )

    conn.commit()
    conn.close()

    token = create_token(user.email)

    return {
        "access_token": token,
        "token": token,
        "user": {
            "name": user.name,
            "email": user.email,
        },
    }


@app.post("/auth/login")
def login(user: AuthUser):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        "SELECT name, email, password FROM users WHERE email = ?",
        (user.email,),
    )

    saved_user = cur.fetchone()
    conn.close()

    if not saved_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    name, email, hashed_password = saved_user

    if hash_password(user.password) != hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(email)

    return {
        "access_token": token,
        "token": token,
        "user": {
            "name": name,
            "email": email,
        },
    }


@app.get("/auth/me")
def me(user_email: str = Depends(get_current_user)):
    return {"email": user_email}


# ---------------- TEXT HELPERS ----------------

def split_sentences(text: str):
    cleaned = text.replace("\n", " ").strip()
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    return [p.strip() for p in parts if len(p.strip()) > 25]


def clean_words(text: str):
    stopwords = {
        "the", "is", "are", "a", "an", "and", "or", "of", "to", "in",
        "for", "on", "with", "as", "by", "this", "that", "it", "be",
        "can", "will", "from", "at", "was", "were", "has", "have",
        "their", "there", "which", "also", "into", "its", "using",
        "used", "use", "based", "such", "these", "those", "than",
    }

    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return [w for w in words if w not in stopwords]


def cosine_similarity_text(text1: str, text2: str):
    words1 = clean_words(text1)
    words2 = clean_words(text2)

    if not words1 or not words2:
        return 0.0

    c1 = Counter(words1)
    c2 = Counter(words2)

    common = set(c1.keys()) & set(c2.keys())
    numerator = sum(c1[w] * c2[w] for w in common)

    sum1 = sum(v ** 2 for v in c1.values())
    sum2 = sum(v ** 2 for v in c2.values())

    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if denominator == 0:
        return 0.0

    return round((numerator / denominator) * 100, 2)


# ---------------- ONLINE SEARCH HELPERS ----------------

def web_search_serper(query: str):
    if not SERPER_API_KEY:
        return []

    url = "https://google.serper.dev/search"

    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "q": query,
        "num": 5,
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        if res.status_code != 200:
            return []

        data = res.json()
        results = []

        for item in data.get("organic", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "source": "Serper",
            })

        return results

    except Exception:
        return []


def web_search_brave(query: str):
    if not BRAVE_API_KEY:
        return []

    url = "https://api.search.brave.com/res/v1/web/search"

    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": BRAVE_API_KEY,
    }

    params = {
        "q": query,
        "count": 5,
    }

    try:
        res = requests.get(url, headers=headers, params=params, timeout=15)
        if res.status_code != 200:
            return []

        data = res.json()
        results = []

        for item in data.get("web", {}).get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": item.get("description", ""),
                "source": "Brave",
            })

        return results

    except Exception:
        return []


def semantic_scholar_search(query: str):
    if not SEMANTIC_SCHOLAR_API_KEY:
        return []

    url = "https://api.semanticscholar.org/graph/v1/paper/search"

    headers = {
        "x-api-key": SEMANTIC_SCHOLAR_API_KEY,
    }

    params = {
        "query": query,
        "limit": 3,
        "fields": "title,abstract,url,year,authors",
    }

    try:
        res = requests.get(url, headers=headers, params=params, timeout=15)
        if res.status_code != 200:
            return []

        data = res.json()
        results = []

        for paper in data.get("data", []):
            authors = paper.get("authors", [])
            author_names = ", ".join([a.get("name", "") for a in authors[:3]])

            snippet = paper.get("abstract") or paper.get("title", "")

            results.append({
                "title": paper.get("title", ""),
                "url": paper.get("url", ""),
                "snippet": snippet,
                "source": "Semantic Scholar",
                "year": paper.get("year"),
                "authors": author_names,
            })

        return results

    except Exception:
        return []


def online_sources_for_sentence(sentence: str):
    query = sentence[:250]

    results = []
    results.extend(web_search_serper(query))

    if len(results) < 2:
        results.extend(web_search_brave(query))

    if len(results) < 2:
        results.extend(semantic_scholar_search(query))

    return results


# ---------------- PLAGIARISM ROUTES ----------------

@app.post("/check-plagiarism")
def check_plagiarism(req: TextRequest):
    return check_plagiarism_online(req)


@app.post("/check-plagiarism-online")
def check_plagiarism_online(req: TextRequest):
    text = req.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")

    sentences = split_sentences(text)

    if not sentences:
        return {
            "plagiarism_percentage": 0,
            "similarity_percentage": 0,
            "score": 0,
            "matches": [],
            "similar_sentences": [],
            "detailed_matches": [],
            "total_sentences": 0,
            "message": "No valid sentences found.",
        }

    if not SERPER_API_KEY and not BRAVE_API_KEY and not SEMANTIC_SCHOLAR_API_KEY:
        return {
            "plagiarism_percentage": 0,
            "similarity_percentage": 0,
            "score": 0,
            "matches": [],
            "similar_sentences": [],
            "detailed_matches": [],
            "total_sentences": len(sentences),
            "message": "No online API key found. Add SERPER_API_KEY or BRAVE_API_KEY in server/.env.",
        }

    detailed_matches = []
    matched_sentences = []

    # limit for free APIs
    checked_sentences = sentences[:8]

    for sentence in checked_sentences:
        search_results = online_sources_for_sentence(sentence)

        best_match = None
        best_score = 0.0

        for result in search_results:
            searchable_text = f"{result.get('title', '')}. {result.get('snippet', '')}"
            score = cosine_similarity_text(sentence, searchable_text)

            if score > best_score:
                best_score = score
                best_match = result

        if best_match and best_score >= 35:
            matched_sentences.append(sentence)

            detailed_matches.append({
                "sentence": sentence,
                "matched_text": best_match.get("snippet", ""),
                "title": best_match.get("title", ""),
                "url": best_match.get("url", ""),
                "source": best_match.get("source", ""),
                "similarity": best_score,
            })

    plagiarism_percentage = round(
        (len(matched_sentences) / len(checked_sentences)) * 100,
        2,
    )

    average_similarity = 0.0
    if detailed_matches:
        average_similarity = round(
            sum(m["similarity"] for m in detailed_matches) / len(detailed_matches),
            2,
        )

    final_score = round((plagiarism_percentage * 0.7) + (average_similarity * 0.3), 2)

    return {
        "plagiarism_percentage": final_score,
        "similarity_percentage": final_score,
        "score": final_score,
        "matches": matched_sentences,
        "similar_sentences": matched_sentences,
        "detailed_matches": detailed_matches,
        "total_sentences": len(sentences),
        "checked_sentences": len(checked_sentences),
    }


# ---------------- REWRITE / PARAPHRASE ----------------

def simple_paraphrase(text: str):
    replacements = {
        "important": "significant",
        "shows": "demonstrates",
        "show": "demonstrate",
        "helps": "assists",
        "help": "assist",
        "use": "utilize",
        "used": "utilized",
        "system": "framework",
        "method": "approach",
        "problem": "challenge",
        "result": "outcome",
        "results": "outcomes",
        "improve": "enhance",
        "improves": "enhances",
        "detect": "identify",
        "detects": "identifies",
        "analysis": "evaluation",
        "data": "information",
        "fast": "efficient",
        "accurate": "precise",
        "research": "study",
        "paper": "manuscript",
    }

    words = text.split()
    output = []

    for word in words:
        stripped = word.strip(".,;:!?")
        lower = stripped.lower()

        if lower in replacements:
            new_word = replacements[lower]
            if stripped[:1].isupper():
                new_word = new_word.capitalize()

            suffix = word[len(stripped):]
            output.append(new_word + suffix)
        else:
            output.append(word)

    return " ".join(output)


def groq_rewrite(text: str, mode: str):
    if not GROQ_API_KEY:
        return None

    prompt_map = {
        "paraphrase": "Paraphrase this text academically while preserving meaning and reducing similarity:",
        "grammar": "Correct grammar and improve clarity:",
        "academic": "Rewrite this in formal academic style:",
        "expand": "Expand this explanation with academic detail:",
        "citation": "Add an academic citation note and source suggestion for this text:",
    }

    prompt = prompt_map.get(mode, prompt_map["paraphrase"])

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": "You are an academic writing assistant. Rewrite ethically and preserve meaning.",
            },
            {
                "role": "user",
                "content": f"{prompt}\n\n{text}",
            },
        ],
        "temperature": 0.4,
        "max_tokens": 900,
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        if res.status_code != 200:
            return None

        data = res.json()
        return data["choices"][0]["message"]["content"].strip()

    except Exception:
        return None


@app.post("/improve-text")
def improve_text(req: TextRequest):
    text = req.text.strip()
    mode = req.mode or "paraphrase"

    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")

    groq_output = groq_rewrite(text, mode)

    if groq_output:
        improved = groq_output
    elif mode == "grammar":
        improved = text.replace("  ", " ").strip()
    elif mode == "academic":
        improved = "From an academic perspective, " + simple_paraphrase(text)
    elif mode == "expand":
        improved = (
            text
            + "\n\nThis explanation can be expanded by discussing background, methodology, implementation, results, limitations, and future scope."
        )
    elif mode == "citation":
        improved = (
            text
            + "\n\nCitation note: Support this statement with peer-reviewed papers, journal articles, or trusted academic sources."
        )
    else:
        improved = simple_paraphrase(text)

    return {
        "improved_text": improved,
        "text": improved,
        "mode": mode,
        "used_groq": bool(groq_output),
    }


@app.post("/recheck-improved-text")
def recheck_improved_text(req: TextRequest):
    return check_plagiarism_online(req)


# ---------------- FILE UPLOAD ----------------

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_bytes = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".txt"):
        text = file_bytes.decode("utf-8", errors="ignore")

    elif filename.endswith(".pdf"):
        if PdfReader is None:
            raise HTTPException(status_code=500, detail="pypdf is not installed")

        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""

        for page in reader.pages:
            text += page.extract_text() or ""
            text += "\n"

    elif filename.endswith(".docx"):
        if docx is None:
            raise HTTPException(status_code=500, detail="python-docx is not installed")

        document = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in document.paragraphs])

    else:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and TXT files are allowed",
        )

    return {
        "filename": file.filename,
        "text": text,
        "extracted_text": text,
    }


# ---------------- REPORTS ----------------

@app.post("/generate-report")
def generate_report(req: ReportRequest):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)

    width, height = A4
    y = height - 50

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(50, y, "Research Originality Report")

    y -= 35
    pdf.setFont("Helvetica", 11)
    pdf.drawString(50, y, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    y -= 30
    score = 0

    if req.result:
        score = req.result.get("plagiarism_percentage", 0)

    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(50, y, f"Similarity Score: {score}%")

    y -= 35
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y, "Original Text:")

    y -= 20
    pdf.setFont("Helvetica", 10)

    for line in req.text[:2500].split("\n"):
        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 10)

        pdf.drawString(50, y, line[:95])
        y -= 14

    if req.improved_text:
        y -= 25
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, y, "Improved Text:")

        y -= 20
        pdf.setFont("Helvetica", 10)

        for line in req.improved_text[:2500].split("\n"):
            if y < 60:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)

            pdf.drawString(50, y, line[:95])
            y -= 14

    pdf.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=research_report.pdf"
        },
    )


@app.post("/reports/save")
def save_report(req: ReportRequest, user_email: str = Depends(get_current_user)):
    score = 0

    if req.result:
        score = req.result.get("plagiarism_percentage", 0)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO reports 
        (user_email, title, text, improved_text, plagiarism_percentage, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            user_email,
            req.title,
            req.text,
            req.improved_text,
            score,
            datetime.utcnow().isoformat(),
        ),
    )

    conn.commit()
    conn.close()

    return {"message": "Report saved successfully"}


@app.get("/reports/history")
def report_history(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, title, text, improved_text, plagiarism_percentage, created_at
        FROM reports
        WHERE user_email = ?
        ORDER BY id DESC
        """,
        (user_email,),
    )

    rows = cur.fetchall()
    conn.close()

    reports = []

    for row in rows:
        reports.append(
            {
                "id": row[0],
                "title": row[1],
                "text": row[2],
                "improved_text": row[3],
                "plagiarism_percentage": row[4],
                "created_at": row[5],
            }
        )

    return {"reports": reports}


# ---------------- STRIPE DEMO ----------------

@app.post("/stripe/create-checkout-session")
def stripe_checkout(user_email: str = Depends(get_current_user)):
    return {
        "url": "https://checkout.stripe.com/",
        "message": "Demo Stripe URL. Add real Stripe keys later.",
    }