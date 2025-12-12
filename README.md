# Oralix

Oralix is a Flask web application providing:

- Authenticated text summarization (Groq API)
- Text-to-Speech playback of summaries (browser SpeechSynthesis)
- Automatic 50-question medium difficulty quiz generation from latest summary
- Persistent storage of summaries, generated quizzes, and quiz attempts (SQLite)
- Dashboard for reviewing history and detailed per-question quiz results

## Features

1. Register / Login / Logout (passwords hashed via Werkzeug)
2. Auth-only session creation for summarization context
3. Summarizer: compact paragraph with optional sources
4. Quiz: strict JSON parsing, shows user answers & correct answers with explanations
5. Dashboard: summaries, quizzes, attempts (expand attempt to view all Q&A)

## Tech Stack

- Python 3 / Flask
- Groq API (llama-3.3-70b-versatile)
- SQLite (file: `oralix.db`)
- HTML5 templates (Jinja2), CSS, vanilla JS
- SpeechSynthesis API for TTS

## Directory Structure

```
app.py
requirements.txt
templates/
  index.html
  about.html
  contact.html
  quiz.html
  register.html
  login.html
  dashboard.html
static/
  css/homedesign.css
  js/homescript.js
  js/quizscript.js
  js/hamburger.js
  img/logo.png
  img/title pic.png
  img/fb.jpg
  img/mail.jpg
```

(Unused images removed manually: background.png, text.png, gt.jpg, school.jpg)

## Environment Variables

Set before running:

- `GROQ_API_KEY` (required for summarization & quiz generation)
- `FLASK_SECRET` (session signing; use a strong random value in production)

## Installation & Run

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
setx GROQ_API_KEY "YOUR_KEY"   # or $env:GROQ_API_KEY="YOUR_KEY" for current session
setx FLASK_SECRET "CHANGE_ME_LONG_RANDOM" # or $env:FLASK_SECRET="CHANGE_ME_LONG_RANDOM"
python app.py
```

Visit: http://localhost:5000/

## Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| GET | / | Chat UI (requires login for sessions) |
| POST | /session | Create new summarization session (auth only) |
| POST | /summarize | Summarize text (needs `session_id`) |
| POST | /generate_quiz | Generate 50-question quiz from last summary |
| POST | /quiz_attempt | Store quiz attempt & answers (auth only) |
| GET | /register | Registration form |
| POST | /register | Create user |
| GET | /login | Login form |
| POST | /login | Authenticate user |
| GET | /logout | Clear session |
| GET | /dashboard | History dashboard |
| GET | /quiz | Quiz view UI |

## Data Model

- users(id, username, password_hash, created_at)
- summaries(id, user_id, input_text, summary_text, created_at)
- quizzes(id, user_id, quiz_json, created_at)
- quiz_attempts(id, user_id, quiz_id, score, total, attempt_json, created_at)

## Quiz JSON Schema

```
{
  "questions": [
    {
      "question": "string",
      "choices": ["A", "B", "C", "D"],
      "answer_index": 0,
      "explanation": "One concise sentence."
    }
  ]
}
```

## Notes / Future Improvements

Core baseline items (original list):
- CSRF protection for forms
- Pagination & human-readable timestamp formatting
- Quiz generation rate limiting
- Password reset flow
- Export (CSV/JSON) of summaries & attempts

Expanded roadmap (categorized):

Security & Privacy:
- Secure cookies (SameSite, HttpOnly in production) & CSRF tokens
- Content Security Policy & rate limiting (IP + user level)
- Two-factor authentication & email verification
- Password strength validation & reset tokens expiration
- Audit logging (logins, quiz generations)

Data & Persistence:
- Pagination + filtering (by date, keyword) on dashboard
- Tagging / categorization for summaries & quizzes
- Duplicate detection (hash summaries, avoid repeat quizzes)
- Data export & bulk deletion tools
- Automatic cleanup of stale sessions / orphan quizzes

Quiz & Learning Features:
- Difficulty selector (easy/medium/hard) & adjustable question count
- Timed quizzes / countdown mode
- Review mode (show only incorrect answers for retry)
- Printable / PDF quiz & answer key generation
- Adaptive quizzes: future questions based on weak areas

Summarization Enhancements:
- Multi-language support (input language detection + localized summaries)
- Markdown formatting (sanitized) for richer summaries
- Caching identical summarization requests
- Ability to regenerate summary with different style (concise vs detailed)

TTS & UX:
- Persist preferred voice per user
- Dark/light theme toggle with saved preference
- Improved accessibility (ARIA roles, keyboard navigation focus states)
- Toast notifications for success/error events
- Loading skeletons / spinners for quiz generation

Account & User Management:
- User profile page (avatar, bio, usage metrics)
- Admin panel for user moderation & usage analytics
- Password change & session revocation (logout all devices)

Infrastructure & DevOps:
- Docker containerization & Compose for multi-service stack
- Production WSGI server (gunicorn) behind Nginx reverse proxy
- Observability: metrics (quiz count, summaries/day) & error tracking (Sentry)
- CI pipeline with linting & automated tests (pytest)
- Feature flags for gradual rollout

Performance & Reliability:
- Background task queue (Celery / RQ) for long operations
- Edge caching (CDN) for static assets & large quiz JSON payloads
- Pre-warming frequently used voices / models

Integrations:
- Pluggable LLM provider abstraction (easily switch models)
- Webhook or email notifications on quiz completion
- Public API endpoints (authenticated tokens) for third-party apps

Prioritization Suggestion (Phase 1): CSRF, pagination + timestamps, password reset, quiz difficulty selector, caching & export. Phase 2: admin panel, adaptive quizzes, feature flags, observability. Phase 3: advanced security (2FA), multi-language, integrations.

## Cleanup Status

Old flat HTML/CSS/JS removed. Unused images targeted; deletion may need manual removal if filesystem restrictions persist.

## Security Considerations

- Do not expose `oralix.db` publicly
- Use HTTPS and secure cookie settings in production
- Validate quiz JSON length & content (current relies on model compliance)

## License

Internal / Proprietary (add actual license if needed).
