# MedVita Frontend

Frontend-only mock interface for **MedVita**, an AI-powered health symptom triage concept.

## Includes

- Sign-up / magic-link style entry screen
- Symptom input with quick-select chips and mock photo preview
- Mock loading state and results screen
- Four reusable urgency badge variants
- Expandable explanation / possible explanations / reference info
- Follow-up thread with pre-populated exchanges
- Reusable daily-limit indicator
- Mobile-first responsive styling
- Tailwind CSS theme with a muted health/care red and a separate emergency red

## No backend

There are **no AI calls, API routes, credentials, API keys, or real file uploads** in this project. All result and follow-up content is hardcoded mock data.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
