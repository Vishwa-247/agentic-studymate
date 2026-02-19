# StudyMate API Contract (MVP)

**Status:** Active (Milestone 0)

This document is the single source of truth for what the **public API Gateway** exposes ("Gateway-only exposed" posture).

- **Public base URL (local dev):** `http://localhost:8000`
- **Public base URL (Render):** `https://<your-render-gateway>.onrender.com`

## Security & Auth

### Public ingress
Only the **API Gateway** is public. All other services (orchestrator, interview-coach, course-generation, etc.) must be private/internal.

### Auth tokens
- The Gateway issues a **Gateway JWT** via `POST /auth/signin` (demo flow).
- The frontend must send this token on protected endpoints:
  - `Authorization: Bearer <token>`

> Note: Supabase auth is used for the web app login (client-side). Gateway auth is used for backend microservices protection.

## Error format
When possible, return:

```json
{ "detail": "Human readable message" }
```

## Endpoints

### Health
#### `GET /health`
Aggregated health of internal services.

**Response (200)**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T00:00:00Z",
  "services": {
    "orchestrator": { "status": "healthy", "response_code": 200 }
  },
  "database": "supabase_postgresql"
}
```

---

### Auth (Gateway)
#### `POST /auth/signin`
Demo sign-in. Returns a Gateway JWT. (Backend may attempt to resolve a Supabase user UUID by email.)

**Request**
```json
{ "email": "user@example.com", "password": "demo" }
```

**Response (200)**
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": { "id": "<uuid-or-email>", "email": "user@example.com", "name": "User" }
}
```

#### `POST /auth/signup`
Demo sign-up. Returns a Gateway JWT.

#### `POST /auth/signout`
Signs out (token still expires naturally; used mainly for parity).

---

### Orchestration
#### `GET /api/next?user_id=<uuid>`
Returns the next recommended module for a user.

**Response (200)**
```json
{
  "next_module": "mock_interview",
  "reason": "Your tradeoff score is lowest",
  "description": "..." 
}
```

**Notes**
- Frontend uses this endpoint via `src/lib/api.ts`.
- Internally proxies to orchestrator service `/next`.

---

### Evaluator
#### `POST /api/evaluate`
Evaluates an answer and updates user state.

**Request**
```json
{
  "user_id": "<uuid>",
  "module": "interview",
  "question": "...",
  "answer": "..."
}
```

**Response (200)**
```json
{ "status": "ok" }
```

---

### Interviews (current gateway surface)
#### `POST /interviews/start`
Starts a mock interview session (current implementation).

#### `GET /interviews`
Lists interviews.

#### `POST /interviews/{interviewId}/analyze`
Analyze interview.

> **Planned (Milestone 2)**: Add a deterministic state-machine interview journey under `/api/interview/*` without breaking existing `/interviews/*` endpoints.

#### `POST /api/interview/start`
Starts a deterministic production-thinking interview journey.

**Auth:** Gateway JWT required.

**Request**
```json
{
  "job_role": "Software Engineer",
  "tech_stack": "React, Supabase",
  "experience_level": "intermediate",
  "mode": "production_thinking"
}
```

**Response (200)**
```json
{
  "session_id": "<uuid>",
  "state": "AWAITING_CLARIFICATION",
  "prompt": "..."
}
```

#### `POST /api/interview/step`
Advances the journey state machine by one user message.

**Auth:** Gateway JWT required.

**Request**
```json
{
  "session_id": "<uuid>",
  "message": "My first questions are: what's the traffic profile and SLA?"
}
```

**Response (200)**
```json
{
  "session_id": "<uuid>",
  "state": "CORE_ANSWER",
  "prompt": "...",
  "done": false,
  "metrics": null
}
```

**Terminal response (COMPLETE)**
```json
{
  "session_id": "<uuid>",
  "state": "COMPLETE",
  "prompt": "Complete. Good work.",
  "done": true,
  "metrics": {
    "clarification_habit": 1.0,
    "structure": 0.67,
    "tradeoff_awareness": 0.33,
    "scalability_thinking": 0.5,
    "failure_awareness": 0.5,
    "adaptability": 0.33,
    "overall_score": 0.56
  }
}
```

**State enum**
- `INITIAL`
- `AWAITING_CLARIFICATION`
- `CORE_ANSWER`
- `FOLLOW_UP`
- `CURVEBALL`
- `REFLECTION`
- `COMPLETE`

---

### Courses
#### `POST /courses/generate-parallel`
Protected (requires Gateway JWT).

#### `GET /courses`
Protected.

#### `DELETE /courses/{courseId}`
Protected.

---

### Resume
#### `POST /resume/analyze`
Multipart form-data.

#### `POST /resume/extract-profile`
Multipart form-data.
