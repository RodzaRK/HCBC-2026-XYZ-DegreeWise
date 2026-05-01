# DegreeWise Documentation

This document covers the full DegreeWise app: features, workflows, architecture, configuration, API endpoints, deployment, and demo guidance.

## Product Summary

DegreeWise helps students make smarter academic plans before registration. It combines semester scheduling, burnout analysis, professor/course lookup, campus-life scoring, what-if simulation, 4-year degree mapping, general education recommendations, and advisor-ready export in one lightweight web app.

The goal is not to replace an academic advisor. DegreeWise helps students understand tradeoffs, spot overloaded terms, prepare better advising questions, and avoid preventable schedule stress.

## Core User Workflows

### 1. Build A Semester Schedule

Students can enter or edit:

- Semester name
- Course code or course title
- Credit hours
- Professor
- Meeting days
- Start time
- Modality, such as in person, online, or hybrid

The dashboard updates immediately as the schedule changes.

### 2. Understand Burnout Risk

DegreeWise calculates a semester burnout score from:

- Total credits
- Number of classes
- Technical or quantitative course load
- Upper-level course pressure
- Lab and project intensity
- Reading and writing expectations
- Professor difficulty signals
- Course workload estimates

The app shows:

- Overall burnout percentage
- Label such as `Balanced`, `Needs Review`, or `High Load`
- Brief explanation
- Factor breakdown
- Class-by-class difficulty cards
- Practical recommendations

### 3. Compare Course And Professor Signals

Course lookup uses:

- SEMO public course offerings
- SEMO undergraduate catalog
- Local sample catalog fallback

Professor lookup uses:

- Rate My Professors GraphQL
- Local sample professor fallback

Professor cards can show:

- Rating
- Difficulty
- Would-take-again percentage
- Department
- Source label

### 4. Check Campus-Life Balance

The campus-life score is separate from burnout risk. A schedule can have good professors and reasonable times but still be hard because the load is heavy.

Campus-life scoring considers:

- Early classes
- Late classes
- Back-to-back classes
- Long campus gaps
- Lunch-break risk
- Online or hybrid flexibility
- Six or more classes
- Technical course stacking
- Total credit load

The default demo intentionally shows this tradeoff: Fall 2026 has a high-burnout 18-credit load with good professors and a semi-balanced campus-life rhythm.

### 5. Run What-If Simulations

The simulator lets students test changes before committing them.

Available actions:

- Start a temporary simulation
- Add a light gen ed
- Move the hardest course later
- Swap a high-load course for a lighter backup
- Save or discard simulated changes

During simulation, DegreeWise recalculates:

- Burnout
- Credits
- Campus-life balance
- Prerequisite warnings
- Backup plans
- Graduation pacing impact

### 6. Detect Prerequisite Problems

Advisor Mode checks known prerequisite rules and parsed prerequisite text.

It supports:

- Single required prerequisites
- Multiple required prerequisites
- One-of-these prerequisite paths
- Completed-credit awareness when a 4-year plan is available
- Clear warning messages for missing prerequisites

This is an advising aid, not the final catalog authority.

### 7. Generate Backup Plans

Backup recommendations help when:

- A course is unavailable
- A class is too hard for the current term
- A schedule is overloaded
- A student needs a lower-risk alternative

Backups are ranked by:

- Requirement fit
- Credits
- Workload
- Professor quality
- Prerequisite fit
- Graduation flexibility

### 8. Upload A 4-Year Degree Map

The Degree Mapper turns a static degree map into an 8-semester plan.

Supported upload types:

- PDF
- TXT or other text files
- DOCX as best effort, with PDF/text recommended

The generated plan includes:

- Program name
- Document title
- Total credits
- Strategy summary
- Eight semesters
- Course list per semester
- Credits per semester
- Burnout estimate per semester
- Focus area per semester
- Gen ed slots
- Warnings and assumptions

If Gemini is configured, the app asks Gemini to analyze the uploaded document. If Gemini is unavailable, the app builds a local fallback plan so demos still work.

### 9. Recommend General Education Classes

Each degree-map semester can request gen ed recommendations.

Recommendations include:

- Course code
- Course title
- Requirement area
- Credits
- Reason

Gen eds are used as balancing tools. DegreeWise tries to place lighter requirements around harder technical semesters instead of treating them as random checkboxes.

### 10. Ask The Chat Assistant

The chat assistant can answer questions about:

- The current semester
- The hardest class
- Burnout score
- Professor difficulty
- Campus-life balance
- What-if simulations
- Prerequisite warnings
- Backup classes
- The 4-year degree plan
- General education placement
- Graduation pacing

If Gemini is not configured, the app uses local answer generation.

### 11. Export Advisor Summary

Advisor Export opens a printable summary with:

- Student profile
- Current semester table
- Burnout score and explanation
- Campus-life score
- Prerequisite warnings
- Backup recommendations
- 4-year degree map when available
- Suggested advisor questions

Users can save the browser print output as a PDF.

## Frontend Overview

Files:

- `index.html` defines the dashboard, semester builder templates, analytics panels, chat, simulator, and degree mapper.
- `styles.css` defines the responsive modern dashboard UI.
- `app.js` owns state, rendering, local scoring, course/professor lookups, chat handling, degree-map UI, simulation behavior, and advisor export.

Important frontend state:

- `state.semesters`
- `state.selectedSemester`
- `state.aiAnalysis`
- `state.chatHistory`
- `state.degreePlan`
- `state.simulationBase`
- `state.simulationEvents`

The frontend does not require a build step.

## Backend Overview

`server.py` provides:

- Static file serving
- CORS headers
- Health endpoint
- Course search and lookup
- Professor search
- Gemini schedule analysis
- Gemini chat
- Degree-map upload parsing
- General education recommendation API
- Local fallback data and fallback planning

The backend uses Python standard-library modules only.

## Configuration

Environment variables:

```text
PORT=8000
API_TIMEOUT_SECONDS=7
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
FIREROAD_BASE_URL=https://fireroad.mit.edu
SEMO_COURSE_OFFERINGS_URL=https://app.semo.edu/adm/CourseDisplay/Option.aspx
SEMO_COURSE_CATALOG_URL=https://semo.edu/student-support/academic-support/registrar/catalog/courses/bltn_data.php/
RMP_GRAPHQL_URL=https://www.ratemyprofessors.com/graphql
RMP_AUTH_TOKEN=dGVzdDp0ZXN0
QUIET_HTTP_LOGS=1
```

Local Gemini config file:

```json
{
  "GEMINI_API_KEY": "your-key-here",
  "GEMINI_MODEL": "gemini-2.5-flash"
}
```

Security guidance:

- Keep real keys out of git.
- Use `gemini_config.json` locally only.
- Use host secrets for Render, Fly.io, Railway, or similar platforms.
- Rotate exposed keys immediately.

## API Reference

### `GET /api/health`

Returns provider status and fallback availability.

Example response:

```json
{
  "ok": true,
  "providers": {
    "courses": "SEMO public course offerings plus SEMO undergraduate catalog",
    "professors": "Rate My Professors GraphQL",
    "ai": "Gemini REST API"
  },
  "fallbacks": ["local course samples", "local professor samples"]
}
```

### `GET /api/courses/search`

Query parameters:

- `q`
- `university`

Example:

```text
/api/courses/search?q=CS&university=Southeast%20Missouri%20State%20University
```

### `GET /api/courses/lookup`

Query parameters:

- `code` or `q`
- `university`

Example:

```text
/api/courses/lookup?code=CS%20265&university=Southeast%20Missouri%20State%20University
```

### `GET /api/professors/search`

Query parameters:

- `name` or `q`
- `university`

Example:

```text
/api/professors/search?name=Ziping%20Liu&university=Southeast%20Missouri%20State%20University
```

### `POST /api/ai/analyze`

JSON body includes profile, semester, local risk, local breakdown, life balance, prerequisite warnings, backup plans, and simulation state.

Returns:

- `enabled`
- `source`
- `model`
- `burnoutScore`
- `burnoutLabel`
- `briefSummary`
- `recommendations`

### `POST /api/ai/chat`

JSON body includes:

- `question`
- current schedule context
- optional degree plan context
- chat history

Returns:

- `enabled`
- `source`
- `model`
- `answer`

### `POST /api/degree-map/analyze`

Multipart form upload.

Expected file field:

- `degreeMap`

Optional fields:

- `university`
- `major`
- `creditsCompleted`

Returns:

- `enabled`
- `source`
- `model` when Gemini is used
- `fallback` when local fallback is used
- `plan`

Plan shape:

```json
{
  "programName": "Computer Science",
  "documentTitle": "Degree Map",
  "totalCredits": 120,
  "strategy": "Balanced prerequisites, major courses, and gen eds.",
  "semesters": [
    {
      "year": 1,
      "term": "Fall",
      "credits": 15,
      "burnoutScore": 42,
      "focus": "Foundation",
      "courses": [
        {
          "code": "CS 155",
          "title": "Computer Science I",
          "credits": 3,
          "category": "Major",
          "reason": "Starts sequence"
        }
      ],
      "genEdSlots": [
        {
          "area": "Written Communication",
          "credits": 3,
          "recommendation": "Place early"
        }
      ],
      "notes": ["Confirm catalog year with advisor."]
    }
  ],
  "warnings": ["Confirm transfer credits and prerequisites."]
}
```

### `POST /api/degree-map/gened`

JSON body:

```json
{
  "semesterIndex": 0,
  "semester": {
    "genEdSlots": [
      {
        "area": "Written Communication",
        "credits": 3,
        "recommendation": "Place early"
      }
    ]
  },
  "degreePlan": {
    "semesters": []
  }
}
```

Returns:

```json
{
  "recommendations": [
    {
      "code": "EN 100",
      "title": "English Composition",
      "area": "Written Communication",
      "credits": 3,
      "reason": "Pairs well with early technical classes."
    }
  ],
  "note": "Use these as catalog/advisor review options, not guaranteed seat availability."
}
```

## Deployment

### Generic Python Host

Start command:

```bash
python server.py
```

Required setting:

```text
PORT=<platform-provided-port>
```

Optional secrets:

```text
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

### Render

The repository includes `render.yaml`.

Typical settings:

- Build command: none
- Start command: `python server.py`
- Environment variable: `GEMINI_API_KEY`

### Fly.io

Use the self-contained deployment folder:

```bash
cd degreewise-fly
fly apps create degreewise
fly secrets set GEMINI_API_KEY="your-key-here"
fly secrets set GEMINI_MODEL="gemini-2.5-flash"
fly deploy
fly open
```

The Fly folder contains:

- `Dockerfile`
- `fly.toml`
- `.dockerignore`
- `.env.example`
- deployment README
- copied app files

When root app files change, sync these files into `degreewise-fly`:

- `server.py`
- `index.html`
- `styles.css`
- `app.js`
- `requirements.txt`


## Privacy And Persistence

- No login is required.
- No database is used.
- Student schedules are not persisted by the backend.
- Uploaded degree maps are processed for the request and not saved.
- Browser theme preference may be stored locally.
- API calls to external providers happen only when lookup or AI features are used.

## Known Limits

- Degree-map parsing is best with text-based PDFs or text exports.
- Scanned PDFs may produce weak fallback text.
- DOCX is accepted, but PDF/text is recommended.
- Course availability and professor data should be verified before registration.
- Prerequisite rules are helpful but not a replacement for the official catalog.
- Gen ed recommendations are advising prompts, not guaranteed seats.

## Troubleshooting

### API indicator is offline

Confirm the Python server is running:

```bash
python server.py
```

Then open `http://localhost:8000/api/health`.

### Gemini is not being used

Check:

- `gemini_config.json` exists locally, or `GEMINI_API_KEY` is set.
- The key is valid.
- The model name is valid.
- The server was restarted after adding the key.

### Degree map upload fails

Check:

- File is under 8 MB.
- File is PDF or text when possible.
- Server is running.
- Browser console and server logs for errors.

### Fly deploy fails

Check:

- `fly.toml` app name matches the app created on Fly.
- The app listens on `PORT=8080`.
- Secrets are set with `fly secrets set`.
- You are running `fly deploy` inside `degreewise-fly`.
