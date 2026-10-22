# API Reference – Daily Health Companion

> **Not medical advice.** This API supports a self-management and organisation aid only.
> No diagnosis, prescription, or clinical interpretation is provided or implied.

Base URL: `https://<your-api>.onrender.com`  
All protected routes require `Authorization: Bearer <supabase-access-token>`.

---

## Health check (public)

```
GET /health
```

**Response 200**
```json
{
  "status": "ok",
  "service": "daily-health-companion-api",
  "time": "2026-10-22T10:00:00.000Z"
}
```

---

## Profile — `GET /api/v1/me`

Returns or creates the authenticated user's profile.

**Response 200**
```json
{
  "data": {
    "id": "uuid",
    "display_name": "Alice",
    "timezone": "Asia/Kolkata",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

## Profile — `PATCH /api/v1/me`

**Body** (all fields optional)
```json
{ "display_name": "Alice", "timezone": "Asia/Kolkata" }
```

---

## Preferences — `GET /api/v1/me/preferences`

## Preferences — `PATCH /api/v1/me/preferences`

**Body** (all optional)
```json
{
  "theme": "calm_blue|nature_green|warm_sunset|high_contrast",
  "text_size": "standard|large|extra_large",
  "simple_language": false,
  "interests": ["cooking", "walking"],
  "sound_enabled": true,
  "volume": 70,
  "snooze_minutes": 10
}
```

---

## Health logs

### `GET /api/v1/logs`

Query params:
| Param      | Type    | Example          |
|------------|---------|------------------|
| `category` | string  | `blood_pressure` |
| `from`     | date    | `2026-10-01`     |
| `to`       | date    | `2026-10-22`     |
| `page`     | integer | `1`              |
| `pageSize` | integer | `20` (max 100)   |

**Response 200**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### `POST /api/v1/logs`

**Body examples by category:**

**sleep**
```json
{
  "category": "sleep",
  "occurred_at": "2026-10-22T07:00:00Z",
  "data": { "duration_hours": 7.5, "quality": "good" }
}
```

**medication**
```json
{
  "category": "medication",
  "occurred_at": "2026-10-22T08:00:00Z",
  "data": { "name": "MetforminXR", "dose": "500mg", "taken": true }
}
```

**blood_pressure**
```json
{
  "category": "blood_pressure",
  "occurred_at": "2026-10-22T09:00:00Z",
  "data": { "systolic": 120, "diastolic": 80, "pulse": 72 }
}
```

**glucose**
```json
{
  "category": "glucose",
  "occurred_at": "2026-10-22T08:30:00Z",
  "data": { "value": 5.4, "context": "fasting" },
  "unit": "mmol/L"
}
```

**meal**
```json
{
  "category": "meal",
  "occurred_at": "2026-10-22T12:00:00Z",
  "data": { "description": "Salad and grilled chicken", "meal_type": "lunch" }
}
```

**activity**
```json
{
  "category": "activity",
  "occurred_at": "2026-10-22T17:00:00Z",
  "data": { "type": "Walking", "duration_minutes": 30, "intensity": "moderate" }
}
```

**Response 201** — created log object in `data`.

### `GET /api/v1/logs/:id`
### `PATCH /api/v1/logs/:id`

Updatable fields: `occurred_at`, `unit`, `note`, `data` (same category rules apply).

### `DELETE /api/v1/logs/:id` → 204

---

## Reminders

### `GET /api/v1/reminders`

Query params: `enabled` (boolean), `page`, `pageSize`.

### `POST /api/v1/reminders`

```json
{
  "title": "Evening walk",
  "time_of_day": "18:00",
  "start_date": "2026-10-22",
  "timezone": "Asia/Kolkata",
  "repeat_rule": "daily",
  "note": "Optional note"
}
```

`repeat_rule`: `none | daily | weekly | weekdays | weekends`

### `GET /api/v1/reminders/:id`
### `PATCH /api/v1/reminders/:id` — partial updates including `enabled: false` to disable
### `DELETE /api/v1/reminders/:id` → 204

### `GET /api/v1/reminders/due`

Returns occurrences due now that haven't been alerted yet.
Marks `last_alerted_at` atomically; each occurrence is returned at most once per polling cycle.

```json
{ "data": [ { "id": "...", "reminder_id": "...", "due_at": "...", "status": "pending", ... } ] }
```

### `POST /api/v1/reminders/:id/snooze`

```json
{ "minutes": 15 }
```

`minutes` is optional; falls back to the user's `snooze_minutes` preference.

### `POST /api/v1/reminders/:id/complete`

No body required. Marks the occurrence completed.

---

## Schedule copy

### `GET /api/v1/reminders/copy-yesterday/preview`

Preview what would be copied from yesterday. Nothing is saved.

```json
{
  "data": {
    "toCreate": [ { "title": "...", "time_of_day": "...", "start_date": "today" } ],
    "alreadyExists": 0,
    "userTimezone": "Asia/Kolkata"
  }
}
```

### `POST /api/v1/reminders/copy-yesterday`

**Body** (required)
```json
{ "confirm": true }
```

```json
{ "data": { "created": 3, "skipped": 1 } }
```

---

## Summaries

### `GET /api/v1/summaries`

Query: `type` = `daily|weekly|appointment`, `date` = `YYYY-MM-DD` (defaults to today).

Returns a factual count of the user's own entries. **Never interprets or scores readings.**

```json
{
  "data": {
    "type": "weekly",
    "dateRange": { "from": "2026-10-16", "to": "2026-10-22" },
    "logCount": 18,
    "byCategory": { "sleep": 7, "blood_pressure": 4, "glucose": 7 },
    "entries": [...],
    "disclaimer": "This summary contains only the entries you recorded..."
  }
}
```

---

## Assistant

### `POST /api/v1/assistant`

**Body**
```json
{
  "message": "Can you summarise my week?",
  "context": "general|summary|log_suggestion|reminder_suggestion",
  "date": "2026-10-22"
}
```

`message` max 2000 characters. Rate limited (10 req/min by default).

**Response 200**
```json
{
  "data": {
    "message": "Here is a summary of your entries this week...",
    "isDemoMode": false,
    "isEmergencyGuidance": false,
    "draft": null
  }
}
```

If the assistant suggests a log or reminder, it is returned as a **draft only** — nothing is saved until the user confirms through the normal log/reminder endpoints.

---

## Import

### `POST /api/v1/import/local/preview`

**Body**
```json
{
  "logs":      [ { "category": "sleep", "occurred_at": "...", "data": {...} } ],
  "reminders": [ { "title": "...", "time_of_day": "08:00", "start_date": "...", "timezone": "UTC", "repeat_rule": "none" } ]
}
```

Returns a preview without saving.

### `POST /api/v1/import/local`

```json
{ "confirm": true, "payload": { "logs": [...], "reminders": [...] } }
```

All imported records are assigned the authenticated user's ID. User IDs from the import payload are ignored. Runs in a single transaction.

---

## Error format

All errors use the same JSON shape:

```json
{
  "error": "Human-readable message",
  "code":  "MACHINE_CODE",
  "details": [ { "path": "field.name", "message": "what went wrong" } ]
}
```

No stack traces, secrets, or internal details are ever sent to the client.

| HTTP | Code                   | Meaning                         |
|------|------------------------|---------------------------------|
| 400  | VALIDATION_ERROR       | Schema validation failed        |
| 401  | AUTH_ERROR             | Missing, expired, or invalid token |
| 404  | NOT_FOUND              | Resource not found or not owned |
| 429  | RATE_LIMIT_EXCEEDED    | Too many requests               |
| 503  | SERVICE_UNAVAILABLE    | AI provider temporarily down    |
| 500  | INTERNAL_ERROR         | Unexpected server error         |
