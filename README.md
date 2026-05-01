# DegreeWise

DegreeWise is a lightweight academic planning dashboard that helps students build semester schedules, estimate burnout risk, compare course and professor signals, map a 4-year degree path, and ask AI-guided questions before registration.

The app is intentionally simple to run: one Python server, static frontend files, no npm build step, no database, and optional Gemini AI support.

## What It Does

- Builds and edits semester schedules with classes, credits, professors, meeting days, start times, and modality.
- Scores semester burnout from course load, class count, technical difficulty, labs/projects, writing/reading pressure, and professor difficulty.
- Shows a class-by-class difficulty breakdown with practical explanations.
- Looks up course data from public SEMO sources and professor signals from Rate My Professors.
- Falls back to local sample course and professor data when external providers are unavailable.
- Tracks campus-life balance using schedule timing, back-to-back classes, long gaps, online/hybrid classes, and total workload.
- Supports a temporary what-if simulator for testing changes before saving them into the live plan.
- Detects prerequisite ordering issues for known course sequences.
- Recommends backup classes when a schedule is too heavy or a course needs a replacement.
- Uploads a degree map document and generates an efficient 8-semester, 4-year plan.
- Recommends general education classes for each semester in the degree map.
- Lets students ask chat questions about the current semester, what-if simulations, and the 4-year plan.
- Exports an advisor-ready summary that can be printed or saved as a PDF.

The default demo opens to a Fall 2026 schedule with a high-burnout but good-professor course load, including complete class names, professors, times, days, and modality.

## Project Structure

```text
.
+-- app.js                  # Frontend behavior, schedule scoring, chat, degree map UI
+-- index.html              # DegreeWise dashboard markup
+-- styles.css              # Responsive UI styling
+-- server.py               # Python backend, static server, API routes, provider integrations
+-- requirements.txt        # Python dependencies; currently no third-party packages required
+-- Procfile                # Generic web host start command
+-- render.yaml             # Render deployment config
+-- degreewise-fly/         # Self-contained Fly.io-ready deployment copy
+-- docs/                   # Full documentation
+-- MARKETING_FEATURES.md   # Marketing feature list
+-- START_HACKATHON.md      # Hackathon submission marker
```

## Run Locally

Requirements:

- Python 3.10 or newer
- A browser

Start the app:

```bash
python server.py
```

Open:

```text
http://localhost:8000
```

The backend reads `PORT`, so you can run on another port:

```bash
PORT=8080 python server.py
```

On PowerShell:

```powershell
$env:PORT="8080"; python server.py
```

## Gemini Setup

Gemini is optional. Without a key, DegreeWise still runs with local scoring, local recommendations, local chat fallback, and local degree-map fallback behavior.

For local development, create `gemini_config.json` in the repository root:

```json
{
  "GEMINI_API_KEY": "your-key-here",
  "GEMINI_MODEL": "gemini-2.5-flash"
}
```

For hosted deployments, use environment variables or platform secrets instead:

```text
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

Security notes:

- `gemini_config.json` is ignored by git in this project.
- Do not commit real API keys into docs or deployment folders.
- If a real key is pasted into chat, screenshots, git history, or a public demo, rotate it in the provider console and replace it with a new secret.

## API Endpoints

```text
GET  /api/health
GET  /api/courses/search?q=CS&university=Southeast%20Missouri%20State%20University
GET  /api/courses/lookup?code=CS%20265&university=Southeast%20Missouri%20State%20University
GET  /api/professors/search?name=Ziping%20Liu&university=Southeast%20Missouri%20State%20University
POST /api/ai/analyze
POST /api/ai/chat
POST /api/degree-map/analyze
POST /api/degree-map/gened
```

## Degree Mapper

The 4-Year Degree Mapper accepts PDF and text documents, with DOCX accepted as a best-effort upload. PDF or text export is recommended for the most reliable extraction.

Workflow:

1. Click `Upload Degree Map`.
2. Select a degree map PDF or text file.
3. DegreeWise creates an 8-semester plan with courses, credits, focus areas, burnout estimates, warnings, and gen ed slots.
4. Use `Recommend Gen Eds` on a semester to fill lighter requirement options.
5. Ask the chat assistant questions about prerequisites, hard semesters, gen ed placement, and graduation pacing.

## Deployment

Generic Python host:

```bash
python server.py
```

Set the platform port through `PORT`. Use environment variables for Gemini secrets.

Fly.io:

```bash
cd degreewise-fly
fly apps create degreewise
fly secrets set GEMINI_API_KEY="your-key-here"
fly deploy
fly open
```

The `degreewise-fly` folder includes its own `Dockerfile`, `fly.toml`, `.dockerignore`, and deployment README. If you change root app files later, copy the updated `server.py`, `index.html`, `styles.css`, `app.js`, and `requirements.txt` into `degreewise-fly` before deploying.

## Documentation

See `docs/README.md` for:

- Product feature guide
- User workflows
- Degree mapper behavior
- AI and fallback behavior
- API details
- Deployment checklist
- Demo script
- Troubleshooting

## Data And Privacy

- No account system is required.
- The app does not use a database.
- Schedule state is held in the browser while the app is open.
- The backend does not save student degree maps or schedules.
- The theme preference may be stored locally in the browser.
- Uploaded degree maps are processed for the current request and are not persisted by the server.

## Troubleshooting

- If the API indicator is offline, confirm `python server.py` is running and refresh the page.
- If Gemini is unavailable, confirm `GEMINI_API_KEY` is configured or keep using local fallback mode.
- If degree-map parsing is weak, upload a text-based PDF or plain text export instead of a scanned image.
- If Fly.io says the app name is taken, change `app = "degreewise"` in `degreewise-fly/fly.toml` and create the matching app name.
