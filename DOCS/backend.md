# Backend Requirements

The frontend was originally built against Firebase for authentication, realtime database and Cloud Functions. The goal of this document is to describe each backend capability in detail so the system can be reimplemented using any stack.

## Core Features

### Authentication
- Email and password registration and login
- Persistent sessions so the user stays logged in after refresh
- Password reset via an emailed link
- Admin list check based on UID

### Data Model
- Users own **categories**; each category contains many **statements**
- Global categories live under a shared namespace (`/global`) to distribute starter content
- Admin users can modify global categories, regular users can only read them

Recommended schema (SQL notation):
```sql
users(id primary key, email, password_hash, created_at)
categories(id primary key, user_id references users(id), label text, created_at, is_default boolean)
statements(id primary key, category_id references categories(id), text text, created_at)
```

### API Endpoints
Implement endpoints analogous to the existing Cloud Functions:
- `POST /categories` – body `{ label, default }` → returns created id
- `POST /statements` – body `{ categoryId, text }` → returns id
- `POST /import-global` – body `{ categoryId, force }` – copies a global category to the user
- `POST /chatbot` – body `{ phrase }` – returns generated phrase text
- `POST /tts` – body `{ text, voice }` – returns MP3 audio
- `GET  /factory/questions` – fetch onboarding questionnaire data

Authentication should be required for all endpoints except `chatbot` and `tts` if you wish to offer them publicly.

### Realtime Updates (optional)
Firebase provided realtime listeners. To replicate this you may:
- Use WebSocket or Server-Sent Events channels to push category or statement changes
- Alternatively, rely on periodic polling from the client

### File Storage
The existing project stores only small text strings, so any relational or document database is suitable. If you plan to support voice recordings in the future, provide an object storage bucket (S3, GCS, etc.) and return signed URLs from the API.

## Migration Tips
1. Export the Firebase realtime database as JSON.
2. Populate the new database preserving ids to keep references stable.
3. Recreate authentication accounts by iterating over Firebase Auth users and inserting them into the new user table with hashed passwords.
4. Implement a small compatibility layer that mirrors the original API signature so the Vue frontend requires minimal changes.
5. Gradually deprecate Firebase by switching environment variables in the frontend to point to the new endpoints.

By building these features your backend will remain decoupled from Firebase and can run on any provider such as Express with PostgreSQL, FastAPI with MongoDB, or a serverless platform.
