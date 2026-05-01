# DegreeWise on Fly.io

This folder is a self-contained Fly.io-ready copy of DegreeWise. It includes the Python backend, frontend assets, Dockerfile, Fly configuration, and deployment notes.

## Files

- `server.py` - Python backend and static file server.
- `index.html`, `styles.css`, `app.js` - DegreeWise frontend.
- `Dockerfile` - Container build for Fly.io.
- `fly.toml` - Fly app, port, HTTPS, autoscaling, and health check config.
- `.dockerignore` - Keeps local logs, browser profiles, and secrets out of the image.

## Deploy

Install and sign in with the Fly CLI, then run:

```bash
cd degreewise-fly
fly auth login
```

Create the Fly app. Fly app names are global, so use your own if `degreewise` is taken:

```bash
fly apps create degreewise
```

If you used a different name, update the `app = "degreewise"` line in `fly.toml` to match.

Gemini is optional. To enable AI analysis and chat in production, set the API key as a secret:

```bash
fly secrets set GEMINI_API_KEY="your-key-here"
fly secrets set GEMINI_MODEL="gemini-2.5-flash"
```

Deploy and open the site:

```bash
fly deploy
fly open
```

## Local Docker Test

```bash
docker build -t degreewise-fly .
docker run --rm -p 8080:8080 degreewise-fly
```

Then open `http://localhost:8080`.

## Notes

- The app listens on `PORT`, and `fly.toml` sets that to `8080`.
- `/api/health` is configured as the Fly health check.
- Do not copy `gemini_config.json` or `.env` into this folder for deployment. Use Fly secrets instead.
