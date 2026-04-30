import base64
from email.parser import BytesParser
from email.policy import default as EMAIL_POLICY
import html
import json
import mimetypes
import os
import posixpath
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).parent.resolve()
PORT = int(os.environ.get("PORT", "8000"))
REQUEST_TIMEOUT = float(os.environ.get("API_TIMEOUT_SECONDS", "7"))
FIREROAD_BASE_URL = os.environ.get("FIREROAD_BASE_URL", "https://fireroad.mit.edu").rstrip("/")
SEMO_COURSE_OFFERINGS_URL = os.environ.get(
    "SEMO_COURSE_OFFERINGS_URL",
    "https://app.semo.edu/adm/CourseDisplay/Option.aspx",
)
SEMO_COURSE_CATALOG_URL = os.environ.get(
    "SEMO_COURSE_CATALOG_URL",
    "https://semo.edu/student-support/academic-support/registrar/catalog/courses/bltn_data.php/",
)
RMP_GRAPHQL_URL = os.environ.get("RMP_GRAPHQL_URL", "https://www.ratemyprofessors.com/graphql")
RMP_AUTH_TOKEN = os.environ.get("RMP_AUTH_TOKEN", "dGVzdDp0ZXN0")
GEMINI_CONFIG_PATH = Path(os.environ.get("GEMINI_CONFIG_PATH", str(ROOT / "gemini_config.json"))).expanduser()
GEMINI_API_BASE_URL = os.environ.get(
    "GEMINI_API_BASE_URL",
    "https://generativelanguage.googleapis.com/v1beta",
).rstrip("/")
GEMINI_API_KEY_PLACEHOLDERS = {
    "",
    "PASTE_YOUR_GEMINI_API_KEY_HERE",
    "YOUR_GEMINI_API_KEY",
    "YOUR_API_KEY",
}
STATIC_BLOCKED_FILES = {
    ".env",
    ".gitignore",
    "gemini_config.json",
    "server.py",
}
STATIC_BLOCKED_DIRS = {
    ".git",
    ".venv",
    "__pycache__",
    "venv",
}

mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")

CACHE = {}
CACHE_LOCK = threading.RLock()

LOCAL_COURSES = [
    {
        "code": "PY 101",
        "title": "Introduction to Psychology",
        "credits": 3,
        "units": 9,
        "instructors": ["Emilie Kay Beltzer"],
        "description": "Section 01. CRN 10077. Registered via web.",
        "school": "Southeast Missouri State University",
        "source": "Registered SEMO schedule",
    },
    {
        "code": "RS 202",
        "title": "Old Testament Literature",
        "credits": 3,
        "units": 9,
        "instructors": ["Bruce W Gentry"],
        "description": "Section 01. CRN 10092. Registered via web.",
        "school": "Southeast Missouri State University",
        "source": "Registered SEMO schedule",
    },
    {
        "code": "CY 310",
        "title": "Info Security & Assurance",
        "credits": 3,
        "units": 9,
        "instructors": ["Xiaoming Liu"],
        "description": "Section BX1. CRN 10912. Registered via web.",
        "school": "Southeast Missouri State University",
        "source": "Registered SEMO schedule",
    },
    {
        "code": "CS 380",
        "title": "Com Operating System",
        "credits": 3,
        "units": 9,
        "instructors": ["Junaid Shuja"],
        "description": "Section BX1. CRN 11153. Registered via web.",
        "school": "Southeast Missouri State University",
        "source": "Registered SEMO schedule",
    },
    {
        "code": "CY 320",
        "title": "Access Control",
        "credits": 3,
        "units": 9,
        "instructors": ["Zhouzhou Li"],
        "description": "Section BX1. CRN 11157. Registered via web.",
        "school": "Southeast Missouri State University",
        "source": "Registered SEMO schedule",
    },
    {
        "code": "CS 351",
        "title": "C & the Posix Environment",
        "credits": 3,
        "units": 9,
        "instructors": ["Juefei Yuan"],
        "description": "Computer science course from Southeast Missouri State University course offerings.",
        "school": "Southeast Missouri State University",
        "source": "Local sample catalog",
    },
    {
        "code": "CS 265",
        "title": "Computer Science II",
        "credits": 3,
        "units": 9,
        "instructors": ["Ziping Liu"],
        "description": "Second computer science course from Southeast Missouri State University course offerings.",
        "school": "Southeast Missouri State University",
        "source": "Local sample catalog",
    },
    {
        "code": "CY 201",
        "title": "Intro to Cybersecurity",
        "credits": 3,
        "units": 9,
        "instructors": ["Ethan Chou"],
        "description": "Introductory cybersecurity course from Southeast Missouri State University course offerings.",
        "school": "Southeast Missouri State University",
        "source": "Local sample catalog",
    },
    {
        "code": "CY 320",
        "title": "Access Control",
        "credits": 3,
        "units": 9,
        "instructors": ["Zhouzhou Li"],
        "description": "Cybersecurity access control course from Southeast Missouri State University course offerings.",
        "school": "Southeast Missouri State University",
        "source": "Local sample catalog",
    },
    {
        "code": "MA 345",
        "title": "Linear Algebra",
        "credits": 3,
        "units": 9,
        "instructors": ["Alan Talmage"],
        "description": "Linear algebra course from Southeast Missouri State University course offerings.",
        "school": "Southeast Missouri State University",
        "source": "Local sample catalog",
    },
]

LOCAL_PROFESSORS = [
    {
        "name": "Emilie Kay Beltzer",
        "department": "Psychology",
        "school": "Southeast Missouri State University",
        "rating": 4.3,
        "difficulty": 2.6,
        "wouldTakeAgain": 88,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Bruce W Gentry",
        "department": "Religious Studies",
        "school": "Southeast Missouri State University",
        "rating": 4.0,
        "difficulty": 2.8,
        "wouldTakeAgain": 84,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Xiaoming Liu",
        "department": "Cybersecurity",
        "school": "Southeast Missouri State University",
        "rating": 3.8,
        "difficulty": 3.1,
        "wouldTakeAgain": 78,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Zhouzhou Li",
        "department": "Cybersecurity",
        "school": "Southeast Missouri State University",
        "rating": 4.0,
        "difficulty": 3.3,
        "wouldTakeAgain": 84,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Juefei Yuan",
        "department": "Computer Science",
        "school": "Southeast Missouri State University",
        "rating": 4.2,
        "difficulty": 3.0,
        "wouldTakeAgain": 88,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Ziping Liu",
        "department": "Computer Science",
        "school": "Southeast Missouri State University",
        "rating": 4.1,
        "difficulty": 3.2,
        "wouldTakeAgain": 85,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Ethan Chou",
        "department": "Cybersecurity",
        "school": "Southeast Missouri State University",
        "rating": 4.7,
        "difficulty": 2.6,
        "wouldTakeAgain": 92,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
    {
        "name": "Junaid Shuja",
        "department": "Computer Science",
        "school": "Southeast Missouri State University",
        "rating": 4.0,
        "difficulty": 3.3,
        "wouldTakeAgain": 84,
        "numRatings": 0,
        "tags": ["Sample signal", "Verify rating", "Advisor review"],
        "link": "",
        "source": "Local sample professor data",
    },
]

SCHOOL_QUERY = """
query NewSearchSchoolsQuery($query: SchoolSearchQuery!) {
  newSearch {
    schools(query: $query) {
      edges {
        node {
          id
          legacyId
          name
          city
          state
        }
      }
    }
  }
}
"""

TEACHER_SEARCH_QUERY = """
query NewSearchTeachersQuery($query: TeacherSearchQuery!) {
  newSearch {
    teachers(query: $query, first: 8, after: "") {
      edges {
        node {
          id
          legacyId
          firstName
          lastName
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
          department
          school {
            id
            name
          }
        }
      }
    }
  }
}
"""

TEACHER_DETAIL_QUERY = """
query TeacherRatingsPageQuery($id: ID!) {
  node(id: $id) {
    ... on Teacher {
      id
      legacyId
      firstName
      lastName
      avgRating
      avgDifficulty
      numRatings
      wouldTakeAgainPercent
      department
      school {
        id
        name
      }
      teacherRatingTags {
        tagName
        tagCount
      }
      courseCodes {
        courseName
        courseCount
      }
    }
  }
}
"""


class DegreeWiseHandler(BaseHTTPRequestHandler):
    server_version = "DegreeWise/1.0"

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api_get(parsed.path, urllib.parse.parse_qs(parsed.query))
            return

        self.serve_static(parsed.path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.handle_api_post(parsed.path)
            return

        self.send_json({"error": "Unknown endpoint"}, status=404)

    def handle_api_get(self, path, query):
        try:
            if path == "/api/health":
                self.send_json(
                    {
                        "ok": True,
                        "providers": {
                            "courses": "SEMO public course offerings plus SEMO undergraduate catalog",
                            "professors": "Rate My Professors GraphQL",
                            "ai": "Gemini REST API" if gemini_is_configured() else "Local fallback until Gemini is configured",
                        },
                        "fallbacks": ["local course samples", "local professor samples"],
                    }
                )
                return

            if path == "/api/courses/search":
                term = get_query_value(query, "q")
                university = get_query_value(query, "university")
                self.send_json(search_courses(term, university))
                return

            if path == "/api/courses/lookup":
                code = get_query_value(query, "code") or get_query_value(query, "q")
                university = get_query_value(query, "university")
                self.send_json(lookup_course(code, university))
                return

            if path == "/api/professors/search":
                name = get_query_value(query, "name") or get_query_value(query, "q")
                university = get_query_value(query, "university")
                self.send_json(search_professors(name, university))
                return

            self.send_json({"error": "Unknown API endpoint"}, status=404)
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=400)
        except Exception as exc:
            self.send_json({"error": "Server error", "detail": str(exc)}, status=500)

    def handle_api_post(self, path):
        try:
            if path == "/api/ai/analyze":
                self.send_json(analyze_schedule_with_gemini(self.read_json_body()))
                return

            if path == "/api/ai/chat":
                self.send_json(chat_with_gemini(self.read_json_body()))
                return

            if path == "/api/degree-map/analyze":
                self.send_json(analyze_degree_map_upload(self.read_multipart_body()))
                return

            if path == "/api/degree-map/gened":
                self.send_json(recommend_general_education(self.read_json_body()))
                return

            self.send_json({"error": "Unknown API endpoint"}, status=404)
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=400)
        except Exception as exc:
            self.send_json({"error": "Server error", "detail": str(exc)}, status=500)

    def read_json_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0") or 0)
        except ValueError as exc:
            raise ValueError("Invalid Content-Length header") from exc

        if length > 250000:
            raise ValueError("JSON body is too large")

        if length == 0:
            return {}

        try:
            raw_body = self.rfile.read(length).decode("utf-8")
            data = json.loads(raw_body or "{}")
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON body") from exc

        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object")

        return data

    def read_multipart_body(self):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type.lower():
            raise ValueError("Expected multipart/form-data upload")

        try:
            length = int(self.headers.get("Content-Length", "0") or 0)
        except ValueError as exc:
            raise ValueError("Invalid Content-Length header") from exc

        if length <= 0:
            raise ValueError("Missing upload body")
        if length > 8 * 1024 * 1024:
            raise ValueError("Degree map uploads must be under 8 MB")

        raw_body = self.rfile.read(length)
        message = BytesParser(policy=EMAIL_POLICY).parsebytes(
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + raw_body
        )

        fields = {}
        files = {}
        for part in message.iter_parts():
            if part.get_content_disposition() != "form-data":
                continue
            name = part.get_param("name", header="content-disposition")
            if not name:
                continue
            filename = part.get_filename()
            payload = part.get_payload(decode=True) or b""
            if filename:
                files[name] = {
                    "filename": filename,
                    "content_type": part.get_content_type() or "application/octet-stream",
                    "data": payload,
                }
            else:
                charset = part.get_content_charset() or "utf-8"
                fields[name] = payload.decode(charset, errors="replace")

        return {"fields": fields, "files": files}

    def serve_static(self, request_path):
        if request_path in ("", "/"):
            target = ROOT / "index.html"
        else:
            clean_path = posixpath.normpath(urllib.parse.unquote(request_path)).lstrip("/")
            target = (ROOT / clean_path).resolve()

        try:
            relative_path = target.relative_to(ROOT)
        except ValueError:
            self.send_error(404, "File not found")
            return

        if is_private_static_path(relative_path) or not target.is_file():
            self.send_error(404, "File not found")
            return

        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(data)

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, fmt, *args):
        if os.environ.get("QUIET_HTTP_LOGS") == "1":
            return
        super().log_message(fmt, *args)


def get_query_value(query, name):
    value = query.get(name, [""])[0].strip()
    return value[:140]


def is_private_static_path(relative_path):
    parts = relative_path.parts
    return relative_path.name in STATIC_BLOCKED_FILES or any(part in STATIC_BLOCKED_DIRS for part in parts)


def gemini_is_configured():
    return bool(load_gemini_settings()["api_key"])


def load_gemini_settings():
    file_config = {}
    if GEMINI_CONFIG_PATH.is_file():
        try:
            file_config = json.loads(GEMINI_CONFIG_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            file_config = {}

    api_key = (
        os.environ.get("GEMINI_API_KEY")
        or file_config.get("GEMINI_API_KEY")
        or file_config.get("apiKey")
        or file_config.get("api_key")
        or ""
    ).strip()
    model = (
        os.environ.get("GEMINI_MODEL")
        or file_config.get("GEMINI_MODEL")
        or file_config.get("model")
        or "gemini-2.5-flash"
    ).strip()

    if api_key in GEMINI_API_KEY_PLACEHOLDERS or api_key.startswith("PASTE_"):
        api_key = ""

    return {"api_key": api_key, "model": model or "gemini-2.5-flash"}


def analyze_schedule_with_gemini(payload):
    settings = load_gemini_settings()
    if not settings["api_key"]:
        return gemini_disabled_payload("Add your Gemini API key to gemini_config.json or GEMINI_API_KEY.")

    prompt = build_gemini_analysis_prompt(payload)
    schema = {
        "type": "object",
        "properties": {
            "burnoutScore": {
                "type": "integer",
                "description": "A schedule burnout risk score from 0 to 100.",
            },
            "burnoutLabel": {
                "type": "string",
                "description": "One of Balanced, Needs Review, or High Load.",
            },
            "briefSummary": {
                "type": "string",
                "description": "Two concise sentences explaining the semester load.",
            },
            "recommendations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Three to five practical schedule or study recommendations.",
            },
        },
        "required": ["burnoutScore", "burnoutLabel", "briefSummary", "recommendations"],
    }

    try:
        result = call_gemini_json(prompt, schema, settings, temperature=0.25, max_output_tokens=900)
        score = bounded_int(result.get("burnoutScore"), 0, 100, fallback=payload_score(payload))
        label = normalize_burnout_label(result.get("burnoutLabel"), score)
        recommendations = clean_string_list(result.get("recommendations"), limit=5)
        return {
            "enabled": True,
            "source": "gemini",
            "model": settings["model"],
            "burnoutScore": score,
            "burnoutLabel": label,
            "briefSummary": trim_text(result.get("briefSummary"), 360),
            "recommendations": recommendations,
        }
    except Exception as exc:
        return gemini_disabled_payload(f"Gemini request failed: {short_error(exc)}", "analysis", retryable=True)


def chat_with_gemini(payload):
    settings = load_gemini_settings()
    if not settings["api_key"]:
        return gemini_disabled_payload("Add your Gemini API key to gemini_config.json or GEMINI_API_KEY.")

    question = trim_text(payload.get("question"), 500)
    if not question:
        raise ValueError("Missing chat question")

    prompt = build_gemini_chat_prompt(payload, question)
    schema = {
        "type": "object",
        "properties": {
            "answer": {
                "type": "string",
                "description": "A concise, useful answer to the student's schedule question.",
            }
        },
        "required": ["answer"],
    }

    try:
        result = call_gemini_json(prompt, schema, settings, temperature=0.35, max_output_tokens=1200)
        answer = clean_chat_answer(result.get("answer"))
        if not answer:
            raise ValueError("Gemini returned an empty or malformed chat answer")
        return {
            "enabled": True,
            "source": "gemini",
            "model": settings["model"],
            "answer": answer,
        }
    except Exception as exc:
        return gemini_disabled_payload(f"Gemini request failed: {short_error(exc)}", "chat", retryable=True)


def analyze_degree_map_upload(upload):
    fields = upload.get("fields") if isinstance(upload.get("fields"), dict) else {}
    files = upload.get("files") if isinstance(upload.get("files"), dict) else {}
    degree_file = files.get("degreeMap") or next(iter(files.values()), None)
    if not degree_file:
        raise ValueError("Upload a PDF or text degree map")

    filename = trim_text(degree_file.get("filename"), 180) or "degree-map"
    content_type = degree_file.get("content_type") or "application/octet-stream"
    data = degree_file.get("data") or b""
    if not data:
        raise ValueError("Uploaded degree map is empty")

    profile = {
        "university": trim_text(fields.get("university"), 120),
        "major": trim_text(fields.get("major"), 100),
        "creditsCompleted": int_or_zero(fields.get("creditsCompleted")),
    }
    document_text = extract_degree_document_text(filename, content_type, data)
    settings = load_gemini_settings()

    if settings["api_key"]:
        try:
            plan = analyze_degree_map_with_gemini(profile, filename, content_type, data, document_text, settings)
            return {
                "enabled": True,
                "source": "gemini",
                "model": settings["model"],
                "plan": plan,
            }
        except Exception as exc:
            fallback = build_degree_plan_fallback(profile, filename, document_text, provider_error=short_error(exc))
            return {
                "enabled": False,
                "source": "local",
                "fallback": True,
                "providerError": short_error(exc),
                "plan": fallback,
            }

    fallback = build_degree_plan_fallback(profile, filename, document_text)
    return {
        "enabled": False,
        "source": "local",
        "fallback": True,
        "reason": "Add your Gemini API key to gemini_config.json or GEMINI_API_KEY.",
        "plan": fallback,
    }


def analyze_degree_map_with_gemini(profile, filename, content_type, data, document_text, settings):
    schema = degree_plan_schema()
    prompt = build_degree_map_prompt(profile, filename, content_type, document_text)
    inline_part = None
    if len(data) <= 6 * 1024 * 1024 and content_type in {
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/octet-stream",
    }:
        mime_type = "application/pdf" if filename.lower().endswith(".pdf") else content_type
        inline_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(data).decode("ascii"),
            }
        }

    result = call_gemini_json_with_parts(prompt, schema, settings, inline_part=inline_part, temperature=0.18, max_output_tokens=12000)
    return normalize_degree_plan_result(result, profile, filename)


def build_degree_map_prompt(profile, filename, content_type, document_text):
    return (
        "You are DegreeWise, an academic planning assistant. Analyze the attached degree map document and build an "
        "efficient 4-year, 8-semester course plan. Extract actual major courses, prerequisites, completed or checked "
        "courses, credit totals, and general education requirements when visible. Prefer low burnout: keep most "
        "semesters near 14-15 credits, avoid stacking many upper-level/lab/project-heavy courses, and use general "
        "education or elective slots to smooth harder terms. Do not claim this replaces an advisor; include warnings "
        "for assumptions, missing prerequisites, transfer credit, catalog uncertainty, or unreadable document sections. "
        "Keep course reasons under 10 words and notes under 14 words so the JSON stays compact. "
        "Return only valid JSON matching the schema.\n\n"
        f"Student profile: {json.dumps(profile, ensure_ascii=True)}\n"
        f"Uploaded file: {filename} ({content_type})\n"
        f"Extracted text preview, if available:\n{trim_text(document_text, 7000)}"
    )


def degree_plan_schema():
    course_schema = {
        "type": "object",
        "properties": {
            "code": {"type": "string"},
            "title": {"type": "string"},
            "credits": {"type": "integer"},
            "category": {"type": "string"},
            "reason": {"type": "string"},
        },
        "required": ["code", "title", "credits", "category", "reason"],
    }
    gen_ed_schema = {
        "type": "object",
        "properties": {
            "area": {"type": "string"},
            "credits": {"type": "integer"},
            "recommendation": {"type": "string"},
        },
        "required": ["area", "credits", "recommendation"],
    }
    semester_schema = {
        "type": "object",
        "properties": {
            "year": {"type": "integer"},
            "term": {"type": "string"},
            "credits": {"type": "integer"},
            "burnoutScore": {"type": "integer"},
            "focus": {"type": "string"},
            "courses": {"type": "array", "items": course_schema},
            "genEdSlots": {"type": "array", "items": gen_ed_schema},
            "notes": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["year", "term", "credits", "burnoutScore", "focus", "courses", "genEdSlots", "notes"],
    }
    return {
        "type": "object",
        "properties": {
            "programName": {"type": "string"},
            "documentTitle": {"type": "string"},
            "totalCredits": {"type": "integer"},
            "strategy": {"type": "string"},
            "semesters": {"type": "array", "items": semester_schema},
            "warnings": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["programName", "documentTitle", "totalCredits", "strategy", "semesters", "warnings"],
    }


def call_gemini_json_with_parts(prompt, schema, settings, inline_part=None, temperature=0.2, max_output_tokens=4096):
    model = normalize_gemini_model(settings["model"])
    json_prompt = build_gemini_json_prompt(prompt, schema)
    parts = [{"text": json_prompt}]
    if inline_part:
        parts.append(inline_part)

    try:
        text = fetch_gemini_text_parts(
            model,
            parts,
            schema,
            settings,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        return parse_gemini_json_result(text, schema)
    except ValueError as first_error:
        retry_prompt = build_gemini_json_prompt(prompt, schema, retry=True)
        retry_parts = [{"text": retry_prompt}]
        if inline_part:
            retry_parts.append(inline_part)
        retry_text = fetch_gemini_text_parts(
            model,
            retry_parts,
            schema,
            settings,
            temperature=0.0,
            max_output_tokens=max_output_tokens,
        )
        try:
            return parse_gemini_json_result(retry_text, schema)
        except ValueError as retry_error:
            raise first_error from retry_error


def fetch_gemini_text_parts(model, parts, schema, settings, temperature=0.25, max_output_tokens=4096):
    model_path = urllib.parse.quote(model, safe="/")
    url = f"{GEMINI_API_BASE_URL}/{model_path}:generateContent"
    request_payload = {
        "contents": [
            {
                "role": "user",
                "parts": parts,
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "responseMimeType": "application/json",
            "responseSchema": to_gemini_response_schema(schema),
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings["api_key"],
    }

    try:
        response = fetch_json(url, method="POST", payload=request_payload, headers=headers, timeout=max(REQUEST_TIMEOUT, 90))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:800]
        raise RuntimeError(f"HTTP {exc.code} {exc.reason}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error: {exc.reason}") from exc

    return extract_gemini_text(response)


def normalize_degree_plan_result(result, profile, filename):
    semesters = result.get("semesters") if isinstance(result.get("semesters"), list) else []
    normalized_semesters = []
    for index, semester in enumerate(semesters[:8]):
        if not isinstance(semester, dict):
            continue
        courses = []
        for course in (semester.get("courses") or [])[:8]:
            if not isinstance(course, dict):
                continue
            code = trim_text(course.get("code"), 24)
            title = trim_text(course.get("title"), 120)
            if not code and not title:
                continue
            credits = bounded_int(course.get("credits"), 1, 5, fallback=3)
            courses.append(
                {
                    "code": code or "GEN",
                    "title": title or "Course requirement",
                    "credits": credits,
                    "category": trim_text(course.get("category"), 40) or "Course",
                    "reason": trim_text(course.get("reason"), 180),
                }
            )
        gen_ed_slots = []
        for slot in (semester.get("genEdSlots") or [])[:4]:
            if not isinstance(slot, dict):
                continue
            gen_ed_slots.append(
                {
                    "area": trim_text(slot.get("area"), 80) or "General Education",
                    "credits": bounded_int(slot.get("credits"), 1, 5, fallback=3),
                    "recommendation": trim_text(slot.get("recommendation"), 160),
                }
            )
        credits = bounded_int(semester.get("credits"), 1, 24, fallback=sum(course["credits"] for course in courses))
        normalized_semesters.append(
            {
                "year": bounded_int(semester.get("year"), 1, 4, fallback=index // 2 + 1),
                "term": trim_text(semester.get("term"), 80) or semester_title_for_index(index),
                "credits": credits,
                "burnoutScore": bounded_int(semester.get("burnoutScore"), 15, 88, fallback=estimate_degree_semester_burnout(courses, credits)),
                "focus": trim_text(semester.get("focus"), 160) or "Balanced progress",
                "courses": courses,
                "genEdSlots": gen_ed_slots,
                "notes": clean_string_list(semester.get("notes"), limit=3),
            }
        )

    if len(normalized_semesters) < 8:
        return build_degree_plan_fallback(profile, filename, json.dumps(result, ensure_ascii=True))

    total_credits = bounded_int(result.get("totalCredits"), 60, 180, fallback=sum(semester["credits"] for semester in normalized_semesters))
    return {
        "programName": trim_text(result.get("programName"), 120) or profile.get("major") or "Degree plan",
        "documentTitle": trim_text(result.get("documentTitle"), 160) or filename,
        "totalCredits": total_credits,
        "strategy": trim_text(result.get("strategy"), 420) or "Balanced prerequisites, major courses, and general education across 8 semesters.",
        "semesters": normalized_semesters,
        "warnings": clean_string_list(result.get("warnings"), limit=6),
    }


def build_degree_plan_fallback(profile, filename, document_text, provider_error=""):
    source_text = normalize_for_match(f"{filename} {document_text} {profile.get('major')}")
    cyber = "cyber" in source_text or "security" in source_text
    program = "Cybersecurity B.S." if cyber else (profile.get("major") or "Computer Science B.S.")
    template = cybersecurity_degree_plan_template() if cyber else computer_science_degree_plan_template()
    semesters = []
    for index, semester in enumerate(template):
        credits = sum(course["credits"] for course in semester["courses"])
        semesters.append(
            {
                "year": index // 2 + 1,
                "term": semester_title_for_index(index),
                "credits": credits,
                "burnoutScore": estimate_degree_semester_burnout(semester["courses"], credits),
                "focus": semester["focus"],
                "courses": semester["courses"],
                "genEdSlots": semester["genEdSlots"],
                "notes": semester["notes"],
            }
        )

    warnings = [
        "This fallback plan uses a balanced template because the document could not be fully parsed locally.",
        "Confirm catalog year, transfer credits, prerequisites, and course availability with an advisor.",
    ]
    if provider_error:
        warnings.insert(0, f"Gemini analysis was unavailable: {provider_error}")

    return {
        "programName": program,
        "documentTitle": extract_pdf_title(document_text) or filename,
        "totalCredits": sum(semester["credits"] for semester in semesters),
        "strategy": "Keep technical sequences moving while using general education courses to lower pressure in upper-level semesters.",
        "semesters": semesters,
        "warnings": warnings,
    }


def cybersecurity_degree_plan_template():
    return [
        degree_semester(
            "Foundations",
            [
                degree_course("UI 100", "First Year Seminar", 3, "University"),
                degree_course("EN 100", "English Composition", 3, "Gen Ed"),
                degree_course("MA 134", "College Algebra or Precalculus", 3, "Math"),
                degree_course("CS 155", "Computer Science I", 3, "Major"),
                degree_course("CY 201", "Introduction to Cybersecurity", 3, "Major"),
            ],
            ["Natural Science"],
        ),
        degree_semester(
            "Programming and communication",
            [
                degree_course("EN 140", "Rhetoric and Critical Thinking", 3, "Gen Ed"),
                degree_course("MA 223", "Statistics or Discrete Math", 3, "Math"),
                degree_course("CS 265", "Computer Science II", 3, "Major"),
                degree_course("SC 105", "Fundamentals of Oral Communication", 3, "Gen Ed"),
                degree_course("PY 101", "Introduction to Psychology", 3, "Gen Ed"),
            ],
            [],
        ),
        degree_semester(
            "Core technical build",
            [
                degree_course("CY 310", "Information Security and Assurance", 3, "Major"),
                degree_course("CY 320", "Access Control", 3, "Major"),
                degree_course("CS 300", "Data Structures", 3, "Major"),
                degree_course("MA 345", "Linear Algebra", 3, "Math"),
                degree_course("BI 151", "Biological Science with Lab", 4, "Gen Ed"),
            ],
            [],
        ),
        degree_semester(
            "Systems and networks",
            [
                degree_course("CS 351", "C and the POSIX Environment", 3, "Major"),
                degree_course("CS 380", "Computer Operating Systems", 3, "Major"),
                degree_course("CY 350", "Network Defense", 3, "Major"),
                degree_course("PS 103", "US Political Systems", 3, "Gen Ed"),
                degree_course("Gen Ed", "Humanities elective", 3, "Gen Ed"),
            ],
            ["Humanities"],
        ),
        degree_semester(
            "Upper-level security",
            [
                degree_course("CY 410", "Secure Systems Administration", 3, "Major"),
                degree_course("CY 430", "Digital Forensics", 3, "Major"),
                degree_course("CS 445", "Database Systems", 3, "Major"),
                degree_course("Gen Ed", "Fine Arts elective", 3, "Gen Ed"),
                degree_course("Free Elective", "Light elective", 3, "Elective"),
            ],
            ["Fine Arts"],
        ),
        degree_semester(
            "Applied practice",
            [
                degree_course("CY 440", "Ethical Hacking", 3, "Major"),
                degree_course("CY 450", "Cybersecurity Policy and Risk", 3, "Major"),
                degree_course("CS 499", "Software Engineering or Project Course", 3, "Major"),
                degree_course("Gen Ed", "Global cultures elective", 3, "Gen Ed"),
                degree_course("Free Elective", "Career-aligned elective", 3, "Elective"),
            ],
            ["Global Perspectives"],
        ),
        degree_semester(
            "Capstone preparation",
            [
                degree_course("CY 470", "Cloud or Enterprise Security", 3, "Major"),
                degree_course("CY 480", "Security Internship or Practicum", 3, "Major"),
                degree_course("Major Elective", "Cybersecurity elective", 3, "Major"),
                degree_course("Free Elective", "Low-load elective", 3, "Elective"),
            ],
            ["General Education elective"],
        ),
        degree_semester(
            "Graduation finish",
            [
                degree_course("CY 490", "Cybersecurity Capstone", 3, "Major"),
                degree_course("Major Elective", "Advanced cybersecurity elective", 3, "Major"),
                degree_course("Free Elective", "Degree completion elective", 3, "Elective"),
                degree_course("Gen Ed", "Remaining general education requirement", 3, "Gen Ed"),
            ],
            ["Remaining requirement"],
        ),
    ]


def computer_science_degree_plan_template():
    return [
        degree_semester("Foundations", [degree_course("UI 100", "First Year Seminar", 3, "University"), degree_course("EN 100", "English Composition", 3, "Gen Ed"), degree_course("MA 134", "Precalculus", 3, "Math"), degree_course("CS 155", "Computer Science I", 3, "Major"), degree_course("Gen Ed", "Natural science", 3, "Gen Ed")], ["Natural Science"]),
        degree_semester("Programming sequence", [degree_course("EN 140", "Rhetoric and Critical Thinking", 3, "Gen Ed"), degree_course("MA 223", "Discrete Mathematics", 3, "Math"), degree_course("CS 265", "Computer Science II", 3, "Major"), degree_course("SC 105", "Oral Communication", 3, "Gen Ed"), degree_course("PY 101", "Introduction to Psychology", 3, "Gen Ed")], []),
        degree_semester("Core CS", [degree_course("CS 300", "Data Structures", 3, "Major"), degree_course("CS 351", "C and the POSIX Environment", 3, "Major"), degree_course("MA 345", "Linear Algebra", 3, "Math"), degree_course("Gen Ed", "Humanities elective", 3, "Gen Ed"), degree_course("Gen Ed", "Lab science", 4, "Gen Ed")], ["Humanities"]),
        degree_semester("Systems", [degree_course("CS 380", "Computer Operating Systems", 3, "Major"), degree_course("CS 390", "Algorithms", 3, "Major"), degree_course("CS 445", "Database Systems", 3, "Major"), degree_course("PS 103", "US Political Systems", 3, "Gen Ed"), degree_course("Free Elective", "Light elective", 3, "Elective")], []),
        degree_semester("Applications", [degree_course("CS 440", "Networks", 3, "Major"), degree_course("CS 499", "Software Engineering", 3, "Major"), degree_course("Major Elective", "CS elective", 3, "Major"), degree_course("Gen Ed", "Fine arts elective", 3, "Gen Ed"), degree_course("Free Elective", "Career elective", 3, "Elective")], ["Fine Arts"]),
        degree_semester("Advanced CS", [degree_course("CS 460", "Programming Languages", 3, "Major"), degree_course("CS 470", "Cybersecurity or AI elective", 3, "Major"), degree_course("Major Elective", "Upper-level CS elective", 3, "Major"), degree_course("Gen Ed", "Global cultures elective", 3, "Gen Ed"), degree_course("Free Elective", "Low-load elective", 3, "Elective")], ["Global Perspectives"]),
        degree_semester("Capstone prep", [degree_course("CS 480", "Internship or Practicum", 3, "Major"), degree_course("Major Elective", "Upper-level CS elective", 3, "Major"), degree_course("Free Elective", "Technical elective", 3, "Elective"), degree_course("Free Elective", "Open elective", 3, "Elective")], ["General Education elective"]),
        degree_semester("Graduation finish", [degree_course("CS 495", "Senior Capstone", 3, "Major"), degree_course("Major Elective", "Advanced CS elective", 3, "Major"), degree_course("Free Elective", "Degree completion elective", 3, "Elective"), degree_course("Gen Ed", "Remaining general education requirement", 3, "Gen Ed")], ["Remaining requirement"]),
    ]


def degree_semester(focus, courses, gen_ed_areas):
    return {
        "focus": focus,
        "courses": courses,
        "genEdSlots": [{"area": area, "credits": 3, "recommendation": "Use a lighter option to balance the semester."} for area in gen_ed_areas],
        "notes": ["Balanced to keep technical progress moving without stacking too many high-load courses."],
    }


def degree_course(code, title, credits, category):
    return {
        "code": code,
        "title": title,
        "credits": credits,
        "category": category,
        "reason": "Placed here for prerequisite flow and balanced workload.",
    }


def estimate_degree_semester_burnout(courses, credits):
    score = 24 + max(0, credits - 12) * 5
    hard_terms = ("capstone", "operating", "systems", "forensics", "hacking", "algorithms", "security", "project")
    score += sum(5 for course in courses if any(term in normalize_for_match(course.get("title", "")) for term in hard_terms))
    score += sum(3 for course in courses if normalize_for_match(course.get("category", "")) in {"major", "math"})
    return max(22, min(82, round(score)))


def semester_title_for_index(index):
    labels = ["Fall", "Spring"] * 4
    year = 2026 + (index + 1) // 2
    return f"{labels[index % len(labels)]} {year}"


def extract_degree_document_text(filename, content_type, data):
    lower_name = filename.lower()
    if content_type.startswith("text/") or lower_name.endswith((".txt", ".text", ".csv")):
        return data.decode("utf-8", errors="replace")
    if lower_name.endswith(".pdf") or content_type == "application/pdf":
        return extract_pdf_text_fallback(data)
    if lower_name.endswith(".docx"):
        return "DOCX upload received. Gemini will analyze the uploaded file when supported; otherwise use a PDF export for best results."
    return data[:8000].decode("utf-8", errors="replace")


def extract_pdf_text_fallback(data):
    pieces = []
    metadata_title = extract_pdf_title(data.decode("latin-1", errors="ignore"))
    if metadata_title:
        pieces.append(f"Title: {metadata_title}")

    for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.DOTALL):
        raw = match.group(1).strip(b"\r\n")
        try:
            decoded = zlib.decompress(raw)
        except Exception:
            decoded = raw
        stream_text = decoded.decode("latin-1", errors="ignore")
        for literal in re.findall(r"\((?:\\.|[^\\()])*\)", stream_text):
            clean = decode_pdf_literal(literal[1:-1])
            if len(clean) > 1:
                pieces.append(clean)

    ascii_strings = re.findall(rb"[A-Za-z0-9][A-Za-z0-9 .,&:/()\-]{5,}", data)
    for chunk in ascii_strings[:220]:
        text = normalize_spaces(chunk.decode("latin-1", errors="ignore"))
        if text and not text.startswith(("stream", "endstream", "obj", "endobj")):
            pieces.append(text)

    return trim_text("\n".join(dict.fromkeys(pieces)), 9000)


def extract_pdf_title(text):
    line_match = re.search(r"Title:\s*(.+?)(?:\s+PDF-\d|\s+\d+\s+0\s+obj|$)", str(text))
    if line_match:
        return normalize_spaces(line_match.group(1))
    match = re.search(r"/Title\s*\((.*?)\)", str(text), flags=re.DOTALL)
    if not match:
        return ""
    return decode_pdf_literal(match.group(1))


def decode_pdf_literal(value):
    value = re.sub(r"\\([0-7]{1,3})", lambda match: chr(int(match.group(1), 8)), str(value))
    replacements = {
        r"\(": "(",
        r"\)": ")",
        r"\\": "\\",
        r"\n": " ",
        r"\r": " ",
        r"\t": " ",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return normalize_spaces(value)


GEN_ED_RECOMMENDATIONS = [
    {
        "area": "Written Communication",
        "courses": [
            ("EN 100", "English Composition", "Foundation writing course that pairs well with early technical classes."),
            ("EN 140", "Rhetoric and Critical Thinking", "Useful before research-heavy upper-level courses."),
        ],
    },
    {
        "area": "Oral Communication",
        "courses": [
            ("SC 105", "Fundamentals of Oral Communication", "Low technical load and helpful for presentations."),
            ("SC 155", "Interpersonal Communication", "Good choice when the semester already has labs or coding."),
        ],
    },
    {
        "area": "Social and Behavioral Sciences",
        "courses": [
            ("PY 101", "Introduction to Psychology", "Balanced reading load and useful for human-centered security topics."),
            ("SO 102", "Society, Culture, and Social Behavior", "Pairs well with math or programming-heavy terms."),
        ],
    },
    {
        "area": "Humanities",
        "courses": [
            ("RS 202", "Old Testament Literature", "Reading-focused option that can balance technical project work."),
            ("LI 243", "World Literature", "Good fit for a semester without multiple writing-heavy classes."),
        ],
    },
    {
        "area": "Natural Science",
        "courses": [
            ("BI 151", "Biological Science", "Useful lab science slot; avoid pairing with too many project courses."),
            ("CH 181", "Basic Principles of Chemistry", "Consider in a lighter technical semester."),
        ],
    },
    {
        "area": "Fine Arts",
        "courses": [
            ("AR 100", "Art Appreciation", "Usually a lighter creative balance for upper-level major work."),
            ("MU 182", "Music Appreciation", "Good option when you need a nontechnical course."),
        ],
    },
    {
        "area": "Civics",
        "courses": [
            ("PS 103", "US Political Systems", "Helpful policy background for cybersecurity and public systems."),
            ("EC 101", "Economic Problems and Policies", "Useful context for business or risk-focused careers."),
        ],
    },
    {
        "area": "Global Perspectives",
        "courses": [
            ("AN 181", "Cultural Anthropology", "Good perspective-building option with moderate workload."),
            ("GO 150", "People and Places of the World", "Often pairs well with a technical-heavy term."),
        ],
    },
]


def recommend_general_education(payload):
    semester = payload.get("semester") if isinstance(payload.get("semester"), dict) else {}
    semester_index = int_or_zero(payload.get("semesterIndex"))
    degree_plan = payload.get("degreePlan") if isinstance(payload.get("degreePlan"), dict) else {}
    used_codes = set()
    for plan_semester in degree_plan.get("semesters") or []:
        for course in plan_semester.get("courses") or []:
            code = normalize_course_code_for_match(course.get("code", ""))
            if code:
                used_codes.add(code)

    slots = semester.get("genEdSlots") if isinstance(semester.get("genEdSlots"), list) else []
    target_areas = [slot.get("area", "") for slot in slots if isinstance(slot, dict) and slot.get("area")]
    if not target_areas:
        target_areas = infer_gen_ed_areas_for_semester(semester_index)

    recommendations = []
    for area in target_areas:
        pool = best_gen_ed_pool(area)
        for code, title, reason in pool["courses"]:
            if normalize_course_code_for_match(code) in used_codes:
                continue
            recommendations.append(
                {
                    "code": code,
                    "title": title,
                    "area": pool["area"],
                    "credits": 3,
                    "reason": reason,
                }
            )
            used_codes.add(normalize_course_code_for_match(code))
            break
        if len(recommendations) >= 3:
            break

    if len(recommendations) < 2:
        for pool in GEN_ED_RECOMMENDATIONS:
            for code, title, reason in pool["courses"]:
                normalized = normalize_course_code_for_match(code)
                if normalized in used_codes:
                    continue
                recommendations.append(
                    {
                        "code": code,
                        "title": title,
                        "area": pool["area"],
                        "credits": 3,
                        "reason": reason,
                    }
                )
                used_codes.add(normalized)
                break
            if len(recommendations) >= 3:
                break

    return {
        "recommendations": recommendations[:3],
        "note": "Use these as catalog/advisor review options, not guaranteed seat availability.",
    }


def infer_gen_ed_areas_for_semester(semester_index):
    sequence = [
        ["Written Communication"],
        ["Oral Communication", "Social and Behavioral Sciences"],
        ["Natural Science"],
        ["Humanities", "Civics"],
        ["Fine Arts"],
        ["Global Perspectives"],
        ["General Education elective"],
        ["Remaining requirement"],
    ]
    return sequence[semester_index % len(sequence)]


def best_gen_ed_pool(area):
    normalized = normalize_for_match(area)
    for pool in GEN_ED_RECOMMENDATIONS:
        if normalize_for_match(pool["area"]) in normalized or normalized in normalize_for_match(pool["area"]):
            return pool
    if "human" in normalized:
        return GEN_ED_RECOMMENDATIONS[3]
    if "science" in normalized or "lab" in normalized:
        return GEN_ED_RECOMMENDATIONS[4]
    if "fine" in normalized or "art" in normalized:
        return GEN_ED_RECOMMENDATIONS[5]
    if "global" in normalized or "culture" in normalized:
        return GEN_ED_RECOMMENDATIONS[7]
    return GEN_ED_RECOMMENDATIONS[semester_area_index(normalized)]


def semester_area_index(normalized):
    seed = sum(ord(char) for char in normalized)
    return seed % len(GEN_ED_RECOMMENDATIONS)


def gemini_disabled_payload(reason, context="setup", retryable=False):
    print(f"[Gemini {context}] {reason}", flush=True)
    return {
        "enabled": False,
        "source": "local",
        "reason": reason,
        "retryable": retryable,
    }


def call_gemini_json(prompt, schema, settings, temperature=0.25, max_output_tokens=800):
    model = normalize_gemini_model(settings["model"])
    json_prompt = build_gemini_json_prompt(prompt, schema)
    try:
        text = fetch_gemini_text(
            model,
            json_prompt,
            schema,
            settings,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        return parse_gemini_json_result(text, schema)
    except ValueError as first_error:
        retry_max_output_tokens = min(max_output_tokens * 2, 2048)
        retry_prompt = build_gemini_json_prompt(prompt, schema, retry=True)
        retry_text = fetch_gemini_text(
            model,
            retry_prompt,
            schema,
            settings,
            temperature=0.0,
            max_output_tokens=retry_max_output_tokens,
        )
        try:
            return parse_gemini_json_result(retry_text, schema)
        except ValueError as retry_error:
            raise first_error from retry_error


def fetch_gemini_text(model, prompt, schema, settings, temperature=0.25, max_output_tokens=800):
    model_path = urllib.parse.quote(model, safe="/")
    url = f"{GEMINI_API_BASE_URL}/{model_path}:generateContent"
    request_payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "responseMimeType": "application/json",
            "responseSchema": to_gemini_response_schema(schema),
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings["api_key"],
    }

    try:
        response = fetch_json(url, method="POST", payload=request_payload, headers=headers)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:800]
        raise RuntimeError(f"HTTP {exc.code} {exc.reason}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error: {exc.reason}") from exc

    return extract_gemini_text(response)


def build_gemini_json_prompt(prompt, schema, retry=False):
    required = ", ".join(schema.get("required") or [])
    prefix = "Your previous response was not valid JSON. " if retry else ""
    return (
        f"{prompt}\n\n"
        f"{prefix}JSON response contract:\n"
        f"- Return exactly one JSON object with these required keys: {required}.\n"
        "- Do not include markdown fences, comments, explanations, or text outside the JSON object.\n"
        "- Use double quotes around every JSON key and string value."
    )


def normalize_gemini_model(model):
    model = (model or "gemini-2.5-flash").strip()
    return model if model.startswith("models/") else f"models/{model}"


def extract_gemini_text(response):
    candidates = response.get("candidates") or []
    for candidate in candidates:
        content = candidate.get("content") or {}
        parts = content.get("parts") or []
        text = "".join(str(part.get("text") or "") for part in parts)
        if text.strip():
            if candidate.get("finishReason") == "MAX_TOKENS":
                raise ValueError(f"Gemini response was truncated: {trim_text(text, 240)}")
            return text.strip()

    feedback = response.get("promptFeedback") or {}
    raise RuntimeError(f"No text returned from Gemini. {feedback}")


def parse_gemini_json_result(text, schema):
    try:
        parsed = parse_json_text(text)
    except ValueError:
        coerced = coerce_plain_text_to_schema(text, schema)
        if coerced is not None:
            return coerced
        raise

    if isinstance(parsed, dict):
        validate_single_string_schema_value(parsed, schema)
        return parsed

    if isinstance(parsed, str):
        try:
            nested = parse_json_text(parsed)
            if isinstance(nested, dict):
                return nested
        except ValueError:
            pass
        coerced = coerce_plain_text_to_schema(parsed, schema)
        if coerced is not None:
            return coerced

    raise ValueError(f"Gemini returned JSON that was not an object: {trim_text(parsed, 500)}")


def parse_json_text(text):
    text = text.strip()
    for candidate in json_text_candidates(text):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            without_trailing_commas = re.sub(r",\s*([}\]])", r"\1", candidate)
            if without_trailing_commas != candidate:
                try:
                    return json.loads(without_trailing_commas)
                except json.JSONDecodeError:
                    pass

    raise ValueError(f"Gemini returned text instead of JSON: {trim_text(text, 500)}")


def json_text_candidates(text):
    seen = set()

    def add(candidate):
        candidate = candidate.strip()
        if candidate and candidate not in seen:
            seen.add(candidate)
            yield candidate

    yield from add(text)

    for fenced in re.finditer(r"```(?:json)?\s*(.*?)```", text, flags=re.IGNORECASE | re.DOTALL):
        yield from add(fenced.group(1))

    object_text = extract_first_json_object(text)
    if object_text:
        yield from add(object_text)


def extract_first_json_object(text):
    start = text.find("{")
    if start == -1:
        return ""

    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]

    return ""


def coerce_plain_text_to_schema(text, schema):
    properties = schema.get("properties") if isinstance(schema.get("properties"), dict) else {}
    required = schema.get("required") if isinstance(schema.get("required"), list) else []
    if len(required) != 1:
        return None

    key = required[0]
    prop_schema = properties.get(key) if isinstance(properties.get(key), dict) else {}
    if str(prop_schema.get("type", "")).lower() != "string":
        return None

    if looks_like_json_fragment(text):
        return None

    value = trim_text(text, 900)
    return {key: value} if value else None


def clean_chat_answer(value):
    text = trim_text(value, 1100)
    if not text:
        return ""

    if looks_like_json_fragment(text):
        try:
            parsed = parse_json_text(text)
        except ValueError:
            return ""
        if isinstance(parsed, dict):
            return clean_chat_answer(parsed.get("answer"))
        return ""

    return text


def validate_single_string_schema_value(result, schema):
    properties = schema.get("properties") if isinstance(schema.get("properties"), dict) else {}
    required = schema.get("required") if isinstance(schema.get("required"), list) else []
    if len(required) != 1:
        return

    key = required[0]
    prop_schema = properties.get(key) if isinstance(properties.get(key), dict) else {}
    if str(prop_schema.get("type", "")).lower() != "string":
        return

    value = result.get(key)
    if isinstance(value, str) and looks_like_json_fragment(value):
        raise ValueError(f"Gemini returned a JSON fragment inside {key}: {trim_text(value, 240)}")


def looks_like_json_fragment(text):
    text = normalize_spaces(text)
    if not text:
        return False
    if text.startswith("{") or text.startswith("["):
        return True
    return bool(re.search(r'["\']?answer["\']?\s*:', text[:160], flags=re.IGNORECASE))


def to_gemini_response_schema(schema):
    type_map = {
        "object": "OBJECT",
        "array": "ARRAY",
        "string": "STRING",
        "integer": "INTEGER",
        "number": "NUMBER",
        "boolean": "BOOLEAN",
    }
    converted = {}

    for key, value in schema.items():
        if key == "type" and isinstance(value, str):
            converted[key] = type_map.get(value.lower(), value)
        elif key == "properties" and isinstance(value, dict):
            converted[key] = {
                prop_name: to_gemini_response_schema(prop_schema)
                for prop_name, prop_schema in value.items()
                if isinstance(prop_schema, dict)
            }
            converted.setdefault("propertyOrdering", list(value.keys()))
        elif key == "items" and isinstance(value, dict):
            converted[key] = to_gemini_response_schema(value)
        elif key in {"required", "description", "enum", "format", "nullable"}:
            converted[key] = value

    return converted


def build_gemini_analysis_prompt(payload):
    compact_payload = compact_ai_payload(payload)
    return (
        "You are DegreeWise, a college schedule planning assistant for a student. "
        "Analyze the schedule using the provided course, professor, and local heuristic data. "
        "Return only valid JSON matching the schema. Do not give medical advice or replace an academic advisor. "
        "Use practical language, and recommend advisor review when the schedule is genuinely risky.\n\n"
        f"Schedule data:\n{json.dumps(compact_payload, ensure_ascii=True)}"
    )


def build_gemini_chat_prompt(payload, question):
    compact_payload = compact_ai_payload(payload)
    conversation = compact_payload.get("conversation") or []
    conversation_text = json.dumps(conversation, ensure_ascii=True) if conversation else "[]"
    return (
        "You are DegreeWise, a concise college schedule assistant. "
        "Answer the student's question using the current schedule data and the 4-year degree plan when available. "
        "Mention uncertainty when professor, course, prerequisite, or catalog data is pending. "
        "Do not claim official advising authority, and do not make medical claims. "
        "Use the recent conversation when the student asks follow-up questions like 'it', 'that', 'switch it out', or 'repeat that'. "
        "If recommending a schedule switch, name the class to consider moving and suggest the type of lower-load replacement, "
        "but do not invent that a specific course is available or required. "
        "Keep the answer under 140 words. Return only valid JSON matching the schema.\n\n"
        f"Student question: {question}\n\n"
        f"Recent conversation:\n{conversation_text}\n\n"
        f"Schedule data:\n{json.dumps(compact_payload, ensure_ascii=True)}"
    )


def compact_ai_payload(payload):
    semester = payload.get("semester") if isinstance(payload.get("semester"), dict) else {}
    courses = []
    for course in semester.get("courses") or []:
        if not isinstance(course, dict):
            continue
        info = course.get("courseInfo") if isinstance(course.get("courseInfo"), dict) else {}
        professor = course.get("professorSignal") if isinstance(course.get("professorSignal"), dict) else {}
        courses.append(
            {
                "name": trim_text(course.get("name"), 120),
                "credits": int_or_zero(course.get("credits") or info.get("credits") or 3),
                "professor": trim_text(course.get("professor") or professor.get("name"), 90),
                "courseCode": trim_text(info.get("code"), 30),
                "courseTitle": trim_text(info.get("title"), 120),
                "courseDescription": trim_text(info.get("description"), 260),
                "source": trim_text(info.get("source"), 80),
                "professorRating": round_float(professor.get("rating"), default=0),
                "professorDifficulty": round_float(professor.get("difficulty"), default=0),
                "wouldTakeAgain": professor.get("wouldTakeAgain"),
                "professorTags": clean_string_list(professor.get("tags"), limit=4),
            }
        )

    return {
        "profile": payload.get("profile") if isinstance(payload.get("profile"), dict) else {},
        "semester": {
            "title": trim_text(semester.get("title"), 80),
            "courses": courses[:10],
        },
        "localRisk": payload.get("localRisk") if isinstance(payload.get("localRisk"), dict) else {},
        "breakdown": compact_breakdown(payload.get("breakdown")),
        "degreePlan": compact_degree_plan(payload.get("degreePlan")),
        "conversation": compact_chat_history(payload.get("conversation")),
    }


def compact_degree_plan(plan):
    if not isinstance(plan, dict):
        return {}

    semesters = []
    for semester in (plan.get("semesters") or [])[:8]:
        if not isinstance(semester, dict):
            continue
        courses = []
        for course in (semester.get("courses") or [])[:8]:
            if not isinstance(course, dict):
                continue
            courses.append(
                {
                    "code": trim_text(course.get("code"), 24),
                    "title": trim_text(course.get("title"), 120),
                    "credits": int_or_zero(course.get("credits") or 3),
                    "category": trim_text(course.get("category"), 40),
                }
            )
        semesters.append(
            {
                "year": int_or_zero(semester.get("year")),
                "term": trim_text(semester.get("term"), 80),
                "credits": int_or_zero(semester.get("credits")),
                "burnoutScore": int_or_zero(semester.get("burnoutScore")),
                "focus": trim_text(semester.get("focus"), 140),
                "courses": courses,
                "genEdSlots": semester.get("genEdSlots") if isinstance(semester.get("genEdSlots"), list) else [],
                "genEdRecommendations": semester.get("genEdRecommendations") if isinstance(semester.get("genEdRecommendations"), list) else [],
                "notes": clean_string_list(semester.get("notes"), limit=2),
            }
        )

    return {
        "programName": trim_text(plan.get("programName"), 120),
        "totalCredits": int_or_zero(plan.get("totalCredits")),
        "strategy": trim_text(plan.get("strategy"), 300),
        "warnings": clean_string_list(plan.get("warnings"), limit=4),
        "semesters": semesters,
    }


def compact_chat_history(history):
    if not isinstance(history, list):
        return []

    messages = []
    for message in history[-10:]:
        if not isinstance(message, dict):
            continue
        role = normalize_spaces(message.get("role")).lower()
        if role not in {"user", "assistant"}:
            continue
        text = trim_text(message.get("text"), 500)
        if text:
            messages.append({"role": role, "text": text})

    return messages


def compact_breakdown(breakdown):
    if not isinstance(breakdown, dict):
        return {}

    classes = []
    for item in breakdown.get("classes") or []:
        if not isinstance(item, dict):
            continue
        course = item.get("course") if isinstance(item.get("course"), dict) else {}
        classes.append(
            {
                "course": trim_text(course.get("name") or item.get("title"), 120),
                "professor": trim_text(course.get("professor"), 90),
                "credits": item.get("credits"),
                "classScore": item.get("classScore"),
                "scores": item.get("scores") if isinstance(item.get("scores"), dict) else {},
                "note": trim_text(item.get("note"), 220),
            }
        )

    return {
        "scores": breakdown.get("scores") if isinstance(breakdown.get("scores"), dict) else {},
        "summary": trim_text(breakdown.get("summary"), 300),
        "classes": classes[:10],
    }


def payload_score(payload):
    local_risk = payload.get("localRisk") if isinstance(payload.get("localRisk"), dict) else {}
    return bounded_int(local_risk.get("score"), 0, 100, fallback=50)


def normalize_burnout_label(value, score):
    label = normalize_spaces(value)
    allowed = {"Balanced", "Needs Review", "High Load"}
    if label in allowed:
        return label
    if score >= 72:
        return "High Load"
    if score >= 48:
        return "Needs Review"
    return "Balanced"


def clean_string_list(value, limit=5):
    if not isinstance(value, list):
        return []

    cleaned = []
    for item in value:
        text = trim_text(item, 220)
        if text:
            cleaned.append(text)
        if len(cleaned) >= limit:
            break
    return cleaned


def bounded_int(value, minimum, maximum, fallback=0):
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        number = fallback
    return max(minimum, min(maximum, number))


def trim_text(value, limit=240):
    text = normalize_spaces(value)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "..."


def short_error(exc):
    message = normalize_spaces(str(exc))
    secrets = [os.environ.get("GEMINI_API_KEY")]
    try:
        secrets.append(load_gemini_settings().get("api_key"))
    except Exception:
        pass

    for secret in secrets:
        if secret:
            message = message.replace(secret, "[hidden]")
    return message[:600]


def search_courses(term, university):
    term = normalize_spaces(term)
    if len(term) < 2:
        return {"provider": "none", "fallback": False, "results": []}

    cache_key = ("course-search", university.lower(), term.lower())
    cached = cache_get(cache_key)
    if cached:
        return cached

    provider_error = None
    if should_use_semo(university, term):
        try:
            results = search_semo_courses(term)
            if results:
                payload = {
                    "provider": semo_provider_label(results),
                    "fallback": False,
                    "results": results,
                }
                cache_set(cache_key, payload, ttl=900)
                return payload
            provider_error = "No SEMO course offering matches"
        except Exception as exc:
            provider_error = str(exc)

    if should_use_fireroad(university, term):
        try:
            path_term = urllib.parse.quote(term, safe="")
            url = f"{FIREROAD_BASE_URL}/courses/search/{path_term}?full=true"
            raw_courses = fetch_json(url)
            results = [normalize_fireroad_course(item) for item in raw_courses[:10]]
            if results:
                payload = {
                    "provider": "FireRoad MIT catalog API",
                    "fallback": False,
                    "results": results,
                }
                cache_set(cache_key, payload, ttl=1800)
                return payload
            provider_error = "No FireRoad matches"
        except Exception as exc:
            provider_error = str(exc)

    fallback_results = filter_local_courses(term)
    payload = {
        "provider": "Local sample catalog",
        "fallback": True,
        "providerError": provider_error,
        "results": fallback_results,
    }
    cache_set(cache_key, payload, ttl=300)
    return payload


def lookup_course(code, university):
    code = clean_course_query(code)
    if not code:
        raise ValueError("Missing course code")

    cache_key = ("course-lookup", university.lower(), code.lower())
    cached = cache_get(cache_key)
    if cached:
        return cached

    provider_error = None
    if should_use_semo(university, code):
        try:
            results = search_semo_courses(code)
            if results:
                course_code = normalize_course_code_for_match(code)
                exact = next((item for item in results if normalize_course_code_for_match(item["code"]) == course_code), results[0])
                payload = {
                    "provider": semo_provider_label(results),
                    "fallback": False,
                    "course": exact,
                    "results": results,
                }
                cache_set(cache_key, payload, ttl=900)
                return payload
            provider_error = "No SEMO course offering matches"
        except Exception as exc:
            provider_error = str(exc)

    if should_use_fireroad(university, code):
        try:
            subject_id = urllib.parse.quote(extract_course_code(code), safe="")
            url = f"{FIREROAD_BASE_URL}/courses/lookup/{subject_id}?full=true"
            course = normalize_fireroad_course(fetch_json(url))
            payload = {
                "provider": "FireRoad MIT catalog API",
                "fallback": False,
                "course": course,
                "results": [course],
            }
            cache_set(cache_key, payload, ttl=3600)
            return payload
        except Exception as exc:
            provider_error = str(exc)

    search_payload = search_courses(code, university)
    if search_payload["results"]:
        payload = {
            "provider": search_payload["provider"],
            "fallback": search_payload.get("fallback", True),
            "providerError": provider_error or search_payload.get("providerError"),
            "course": search_payload["results"][0],
            "results": search_payload["results"],
        }
        cache_set(cache_key, payload, ttl=600)
        return payload

    payload = {
        "provider": "none",
        "fallback": True,
        "providerError": provider_error,
        "course": None,
        "results": [],
    }
    cache_set(cache_key, payload, ttl=120)
    return payload


def search_professors(name, university):
    name = normalize_spaces(name)
    university = normalize_spaces(university)
    if len(name) < 2:
        return {"provider": "none", "fallback": False, "results": []}

    cache_key = ("professor-search", university.lower(), name.lower())
    cached = cache_get(cache_key)
    if cached:
        return cached

    provider_error = None
    try:
        schools = search_rmp_schools(university) if university else []
        school_id = schools[0]["id"] if schools else None
        variables = {"query": {"text": name, "fallback": True, "departmentID": None}}
        if school_id:
            variables["query"]["schoolID"] = school_id

        data = rmp_graphql(TEACHER_SEARCH_QUERY, variables)
        edges = data.get("data", {}).get("newSearch", {}).get("teachers", {}).get("edges", [])
        results = [normalize_rmp_teacher(edge.get("node", {})) for edge in edges[:5]]
        results = [item for item in results if item["name"].strip()]
        results.sort(key=lambda item: name_match_score(name, item["name"]), reverse=True)

        if results:
            results[0] = hydrate_rmp_teacher(results[0])
            payload = {
                "provider": "Rate My Professors GraphQL",
                "fallback": False,
                "school": schools[0] if schools else None,
                "result": results[0],
                "results": results,
            }
            cache_set(cache_key, payload, ttl=1800)
            return payload
    except Exception as exc:
        provider_error = str(exc)

    fallback_results = filter_local_professors(name, university)
    if not fallback_results:
        fallback_results = [generated_professor_sample(name, university)]

    payload = {
        "provider": "Local sample professor data",
        "fallback": True,
        "providerError": provider_error,
        "result": fallback_results[0],
        "results": fallback_results,
    }
    cache_set(cache_key, payload, ttl=300)
    return payload


def search_rmp_schools(university):
    cache_key = ("rmp-school", university.lower())
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    data = rmp_graphql(SCHOOL_QUERY, {"query": {"text": university}})
    edges = data.get("data", {}).get("newSearch", {}).get("schools", {}).get("edges", [])
    schools = []
    for edge in edges[:5]:
        node = edge.get("node", {})
        schools.append(
            {
                "id": node.get("id", ""),
                "legacyId": node.get("legacyId"),
                "name": node.get("name", ""),
                "city": node.get("city", ""),
                "state": node.get("state", ""),
            }
        )

    cache_set(cache_key, schools, ttl=86400)
    return schools


def hydrate_rmp_teacher(teacher):
    if not teacher.get("id"):
        return teacher

    cache_key = ("rmp-teacher-detail", teacher["id"])
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        data = rmp_graphql(TEACHER_DETAIL_QUERY, {"id": teacher["id"]})
        node = data.get("data", {}).get("node") or {}
        if node:
            hydrated = normalize_rmp_teacher(node)
            cache_set(cache_key, hydrated, ttl=3600)
            return hydrated
    except Exception:
        pass

    return teacher


def rmp_graphql(query, variables):
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Authorization": f"Basic {RMP_AUTH_TOKEN}",
        "Content-Type": "application/json",
        "Origin": "https://www.ratemyprofessors.com",
        "Referer": "https://www.ratemyprofessors.com/",
        "User-Agent": "Mozilla/5.0 DegreeWise/1.0",
    }
    payload = {"query": query, "variables": variables}
    return fetch_json(RMP_GRAPHQL_URL, method="POST", payload=payload, headers=headers)


def fetch_json(url, method="GET", payload=None, headers=None, timeout=None):
    body = None
    request_headers = headers.copy() if headers else {}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")

    request = urllib.request.Request(url, data=body, headers=request_headers, method=method)
    with urllib.request.urlopen(request, timeout=timeout or REQUEST_TIMEOUT) as response:
        text = response.read().decode(response.headers.get_content_charset() or "utf-8")
        return json.loads(text)


def fetch_text(url, headers=None):
    request_headers = headers.copy() if headers else {}
    request_headers.setdefault("User-Agent", "Mozilla/5.0 DegreeWise/1.0")
    request = urllib.request.Request(url, headers=request_headers, method="GET")
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
        return response.read().decode(response.headers.get_content_charset() or "utf-8", errors="replace")


def search_semo_courses(term):
    term = normalize_spaces(term)
    if len(term) < 2:
        return []

    offerings = get_semo_course_offerings()
    catalog = get_semo_course_catalog()
    needle = normalize_for_match(term)
    code_needle = normalize_course_code_for_match(term)
    matches = []
    seen = set()

    for course in offerings:
        exact_code_match = code_needle and normalize_course_code_for_match(course["code"]) == code_needle
        text = normalize_for_match(
            f"{course['code']} {course['title']} {course.get('section', '')} "
            f"{course.get('campus', '')} {course.get('session', '')} {' '.join(course.get('instructors', []))}"
        )
        if exact_code_match or needle in text:
            key = (course["code"], course.get("section", ""), course.get("crn", ""))
            if key not in seen:
                matches.append(course)
                seen.add(key)

    for course in catalog:
        exact_code_match = code_needle and normalize_course_code_for_match(course["code"]) == code_needle
        text = normalize_for_match(f"{course['code']} {course['title']} {course['description']}")
        if exact_code_match or needle in text:
            key = (course["code"], "catalog", "")
            if key not in seen:
                matches.append(course)
                seen.add(key)

    matches.sort(key=lambda item: semo_match_score(term, item), reverse=True)
    return matches[:12]


def get_semo_course_offerings():
    cache_key = ("semo-course-offerings", SEMO_COURSE_OFFERINGS_URL)
    cached = cache_get(cache_key)
    if cached:
        return cached

    html_text = fetch_text(SEMO_COURSE_OFFERINGS_URL)
    semester = extract_semo_semester(html_text)
    rows = parse_html_table("gvResults", html_text)
    courses = []

    for cells in rows:
        if len(cells) != 11 or cells[0].lower() == "subject":
            continue

        subject, number, section, campus, crn, title, credits, days, meeting_time, session, instructor = cells
        code = f"{subject} {number}".strip()
        instructor_names = [format_person_name(instructor)] if instructor else []
        course = {
            "code": code,
            "title": title,
            "name": f"{code} - {title}".strip(" -"),
            "credits": int_or_zero(credits),
            "units": int_or_zero(credits) * 3,
            "level": "Undergraduate" if int_or_zero(number) < 600 else "Graduate",
            "offered": [semester] if semester else [],
            "instructors": instructor_names,
            "description": f"{campus} section {section}. CRN {crn}. {session}.",
            "prerequisites": "",
            "workloadHours": max(1, int_or_zero(credits)) * 3,
            "rating": None,
            "url": SEMO_COURSE_OFFERINGS_URL,
            "source": "SEMO public course offerings",
            "school": "Southeast Missouri State University",
            "section": section,
            "campus": campus,
            "crn": crn,
            "days": days,
            "time": meeting_time,
            "session": session,
        }
        courses.append(course)

    cache_set(cache_key, courses, ttl=900)
    return courses


def get_semo_course_catalog():
    cache_key = ("semo-course-catalog", SEMO_COURSE_CATALOG_URL)
    cached = cache_get(cache_key)
    if cached:
        return cached

    catalog_text = fetch_text(SEMO_COURSE_CATALOG_URL)
    courses = []
    for cells in parse_semo_catalog_rows(catalog_text):
        if len(cells) < 3:
            continue
        code_text, title, description = cells[:3]
        code_match = re.match(r"([A-Z]{2,4})\s+(\d{3}[A-Z]?)", code_text)
        if not code_match:
            continue
        subject, number = code_match.groups()
        credits = extract_credit_hours(description)
        code = f"{subject} {number}"
        courses.append(
            {
                "code": code,
                "title": title.rstrip("."),
                "name": f"{code} - {title.rstrip('.')}",
                "credits": credits,
                "units": credits * 3,
                "level": "Undergraduate" if int_or_zero(number) < 600 else "Graduate",
                "offered": [],
                "instructors": [],
                "description": description,
                "prerequisites": extract_prerequisites(description),
                "workloadHours": max(1, credits) * 3,
                "rating": None,
                "url": SEMO_COURSE_CATALOG_URL,
                "source": "SEMO undergraduate catalog",
                "school": "Southeast Missouri State University",
                "section": "",
                "campus": "",
                "crn": "",
                "days": "",
                "time": "",
                "session": "Catalog course",
            }
        )

    cache_set(cache_key, courses, ttl=3600)
    return courses


def parse_semo_catalog_rows(html_text):
    rows = []
    for row_html in re.findall(
        r"<tr\b[^>]*class=['\"][^'\"]*course[^'\"]*['\"][^>]*>(.*?)</tr>",
        html_text,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        cells = []
        for cell_html in re.findall(r"<td\b[^>]*>(.*?)</td>", row_html, flags=re.IGNORECASE | re.DOTALL):
            text = re.sub(r"<[^>]+>", " ", cell_html)
            text = html.unescape(text).replace("\xa0", " ")
            cells.append(normalize_spaces(text))
        if cells:
            rows.append(cells)
    return rows


def parse_html_table(table_id, html_text):
    table_match = re.search(
        rf'<table[^>]+id=["\']{re.escape(table_id)}["\'][^>]*>(.*?)</table>',
        html_text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not table_match:
        return []

    table_html = table_match.group(1)
    rows = []
    for row_html in re.findall(r"<tr\b[^>]*>(.*?)</tr>", table_html, flags=re.IGNORECASE | re.DOTALL):
        cells = []
        for cell_html in re.findall(r"<t[dh]\b[^>]*>(.*?)</t[dh]>", row_html, flags=re.IGNORECASE | re.DOTALL):
            text = re.sub(r"<[^>]+>", " ", cell_html)
            text = html.unescape(text).replace("\xa0", " ")
            cells.append(normalize_spaces(text))
        if cells:
            rows.append(cells)
    return rows


def extract_semo_semester(html_text):
    semester = ""
    year = ""
    semester_match = re.search(r'id=["\']lblSemester["\'][^>]*>(.*?)</span>', html_text, flags=re.IGNORECASE | re.DOTALL)
    year_match = re.search(r'id=["\']lblYear["\'][^>]*>(.*?)</span>', html_text, flags=re.IGNORECASE | re.DOTALL)
    if semester_match:
        semester = normalize_spaces(html.unescape(re.sub(r"<[^>]+>", " ", semester_match.group(1))))
    if year_match:
        year = normalize_spaces(html.unescape(re.sub(r"<[^>]+>", " ", year_match.group(1))))
    return normalize_spaces(f"{semester} {year}")


def semo_match_score(query, course):
    normalized_query = normalize_for_match(query)
    code_query = normalize_course_code_for_match(query)
    subject_only_query = re.fullmatch(r"[a-z]{2,4}", normalized_query) is not None
    score = 0
    if code_query and normalize_course_code_for_match(course["code"]) == code_query:
        score += 100
    if normalize_for_match(course["code"]).startswith(normalized_query):
        score += 50
    if not subject_only_query and normalized_query in normalize_for_match(course["title"]):
        score += 25
    if "course offerings" in normalize_for_match(course.get("source", "")):
        score += 8
    if "catalog" in normalize_for_match(course.get("source", "")) and subject_only_query:
        score += max(0, 20 - int_or_zero(re.sub(r"\D", "", course.get("code", ""))) / 50)
    if "main campus" in normalize_for_match(course.get("campus", "")):
        score += 5
    if course.get("section") in ("01", "001"):
        score += 3
    return score


def semo_provider_label(results):
    sources = {item.get("source", "") for item in results}
    if any("catalog" in source.lower() for source in sources) and any("offerings" in source.lower() for source in sources):
        return "SEMO course offerings and undergraduate catalog"
    if any("catalog" in source.lower() for source in sources):
        return "SEMO undergraduate catalog"
    return "SEMO public course offerings"


def extract_credit_hours(description):
    matches = re.findall(r"\((\d+(?:-\d+)?)\)", description)
    if not matches:
        return 3
    raw = matches[-1]
    if "-" in raw:
        return int_or_zero(raw.split("-", 1)[-1])
    return max(0, int_or_zero(raw))


def extract_prerequisites(description):
    match = re.search(r"(Prerequisites?:.+?)(?:\(\d|$)", description, flags=re.IGNORECASE)
    if not match:
        return ""
    return normalize_spaces(match.group(1).rstrip("."))


def normalize_fireroad_course(item):
    code = str(item.get("subject_id") or item.get("code") or "").strip()
    total_units = int_or_zero(item.get("total_units"))
    credits = estimate_credit_hours(total_units)
    offered = []
    for label, key in (
        ("Fall", "offered_fall"),
        ("IAP", "offered_IAP"),
        ("Spring", "offered_spring"),
        ("Summer", "offered_summer"),
    ):
        if item.get(key):
            offered.append(label)

    workload_hours = None
    in_class = item.get("in_class_hours")
    out_class = item.get("out_of_class_hours")
    if isinstance(in_class, (int, float)) and isinstance(out_class, (int, float)):
        workload_hours = round(in_class + out_class, 1)

    return {
        "code": code,
        "title": item.get("title", ""),
        "name": f"{code} - {item.get('title', '')}".strip(" -"),
        "credits": credits,
        "units": total_units,
        "level": item.get("level", ""),
        "offered": offered,
        "instructors": item.get("instructors") or [],
        "description": item.get("description", ""),
        "prerequisites": item.get("prerequisites", ""),
        "workloadHours": workload_hours,
        "rating": item.get("rating"),
        "url": item.get("url", ""),
        "source": "FireRoad MIT catalog API",
    }


def normalize_rmp_teacher(node):
    first = node.get("firstName") or ""
    last = node.get("lastName") or ""
    legacy_id = node.get("legacyId")
    school = node.get("school") or {}
    tags = []
    for tag in sorted(node.get("teacherRatingTags") or [], key=lambda item: item.get("tagCount", 0), reverse=True):
        tag_name = tag.get("tagName")
        if tag_name and tag_name not in tags:
            tags.append(tag_name)

    if not tags:
        tags = inferred_professor_tags(node.get("avgRating"), node.get("avgDifficulty"))

    return {
        "id": node.get("id", ""),
        "legacyId": legacy_id,
        "name": normalize_spaces(f"{first} {last}"),
        "department": node.get("department") or "Department unavailable",
        "school": school.get("name", ""),
        "rating": round_float(node.get("avgRating"), default=0),
        "difficulty": round_float(node.get("avgDifficulty"), default=0),
        "wouldTakeAgain": round_float(node.get("wouldTakeAgainPercent"), default=None),
        "numRatings": int_or_zero(node.get("numRatings")),
        "tags": tags[:4],
        "courses": node.get("courseCodes") or [],
        "link": f"https://www.ratemyprofessors.com/professor/{legacy_id}" if legacy_id else "",
        "source": "Rate My Professors",
    }


def filter_local_courses(term):
    needle = normalize_for_match(term)
    results = []
    for course in LOCAL_COURSES:
        haystack = normalize_for_match(f"{course['code']} {course['title']} {course['description']}")
        if needle in haystack:
            normalized = dict(course)
            normalized["name"] = f"{course['code']} - {course['title']}"
            normalized["offered"] = ["Fall", "Spring"]
            normalized["level"] = "U"
            normalized["workloadHours"] = normalized["credits"] * 3
            results.append(normalized)
    return results[:8]


def filter_local_professors(name, university):
    needle = normalize_for_match(name)
    school_needle = normalize_for_match(university)
    matches = []
    for professor in LOCAL_PROFESSORS:
        name_match = needle in normalize_for_match(professor["name"])
        school_match = not school_needle or school_needle in normalize_for_match(professor["school"])
        if name_match and school_match:
            matches.append(dict(professor))

    if not matches:
        for professor in LOCAL_PROFESSORS:
            if needle in normalize_for_match(professor["name"]):
                matches.append(dict(professor))

    return matches[:5]


def generated_professor_sample(name, university):
    seed = sum(ord(char) for char in f"{name}{university}")
    rating = round(3.5 + (seed % 14) / 10, 1)
    difficulty = round(2.1 + (seed % 20) / 10, 1)
    return {
        "name": name,
        "department": "Department unavailable",
        "school": university,
        "rating": min(rating, 5.0),
        "difficulty": min(difficulty, 5.0),
        "wouldTakeAgain": 70 + (seed % 25),
        "numRatings": 0,
        "tags": ["Sample fallback", "Verify source", "Advisor review"],
        "link": "",
        "source": "Generated fallback sample",
    }


def inferred_professor_tags(rating, difficulty):
    rating = round_float(rating, default=0)
    difficulty = round_float(difficulty, default=0)
    tags = []
    if rating >= 4.5:
        tags.append("Highly rated")
    if difficulty >= 3.7:
        tags.append("Challenging")
    elif difficulty and difficulty <= 2.4:
        tags.append("Manageable")
    if not tags:
        tags.append("Review ratings")
    return tags


def name_match_score(query, candidate):
    query_parts = normalize_for_match(query).split()
    candidate_parts = normalize_for_match(candidate).split()
    if not query_parts or not candidate_parts:
        return 0

    exact_score = 20 if " ".join(query_parts) == " ".join(candidate_parts) else 0
    overlap_score = sum(5 for part in query_parts if part in candidate_parts)
    prefix_score = sum(2 for part in query_parts for candidate_part in candidate_parts if candidate_part.startswith(part))
    return exact_score + overlap_score + prefix_score


def should_use_semo(university, term):
    text = f"{university} {term}".lower()
    return (
        "southeast missouri state" in text
        or "southeast mo state" in text
        or "semo" in text
    )


def should_use_fireroad(university, term):
    text = f"{university} {term}".lower()
    return (
        "mit" in text
        or "massachusetts institute of technology" in text
        or re.search(r"\b\d{1,2}\.\d{2,4}\b", term) is not None
    )


def estimate_credit_hours(total_units):
    if not total_units:
        return 3
    return max(1, min(4, round(total_units / 3)))


def clean_course_query(value):
    return normalize_spaces(value).split(" - ", 1)[0][:80]


def extract_course_code(value):
    value = clean_course_query(value)
    match = re.search(r"\b\d{1,2}\.\d{2,4}\b", value)
    if match:
        return match.group(0)
    match = re.search(r"\b[A-Z]{2,5}\s*\d{2,4}[A-Z]?\b", value, re.IGNORECASE)
    if match:
        return normalize_spaces(match.group(0)).upper()
    return value


def normalize_course_code_for_match(value):
    code = extract_course_code(value)
    return re.sub(r"[^a-z0-9.]+", "", code.lower())


def format_person_name(value):
    value = normalize_spaces(value)
    if "," not in value:
        return value
    last, first = [part.strip() for part in value.split(",", 1)]
    return normalize_spaces(f"{first} {last}")


def normalize_for_match(value):
    return re.sub(r"[^a-z0-9.]+", " ", str(value).lower()).strip()


def normalize_spaces(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def int_or_zero(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def round_float(value, default=0):
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return default


def cache_get(key):
    with CACHE_LOCK:
        item = CACHE.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at < time.time():
            CACHE.pop(key, None)
            return None
        return value


def cache_set(key, value, ttl):
    with CACHE_LOCK:
        CACHE[key] = (time.time() + ttl, value)


def main():
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), DegreeWiseHandler)
    print(f"DegreeWise running at http://localhost:{PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
