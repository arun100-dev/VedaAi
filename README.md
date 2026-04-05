# VedaAI – AI Assessment Creator

A full-stack AI-powered platform that allows teachers to create structured, curriculum-aligned question papers in seconds using Groq LLaMA 3.3.

---

## Features

- **Authentication** — JWT-based signup and login with bcrypt password hashing
- **Assignment Creation** — Multi-step form with file upload, question types, marks configuration
- **AI Generation** — Groq LLaMA 3.3 with structured JSON prompts, never renders raw AI output
- **Real-time Progress** — WebSocket + BullMQ background jobs with live progress tracking
- **Structured Output** — Sections A/B/C, difficulty badges (Easy/Medium/Hard), marks display
- **Student Info Section** — Name, Roll Number, Section fields on the paper
- **Answer Key** — Toggleable answer key below the question paper
- **PDF Export** — Multi-page PDF download using jsPDF + html2canvas
- **Print Support** — Clean print stylesheet
- **Regenerate** — One-click paper regeneration
- **Search & Filter** — Search assignments by title or subject
- **Light/Dark Theme** — Persistent theme toggle across all pages
- **Mobile Responsive** — Works on all screen sizes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| State Management | Zustand with persistence |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Cache & Queue | Redis (Upstash) + BullMQ |
| Real-time | WebSocket (ws library) |
| AI | Groq LLaMA 3.3 70B Versatile |
| Auth | JWT + bcryptjs |
| Deployment | Vercel (frontend) + Render (backend + worker) |

---

## Architecture

```
┌─────────────────────────────────┐
│     Frontend — Next.js 14       │
│  Zustand · WebSocket · PDF      │
└────────────┬────────────────────┘
             │ REST API + WebSocket
┌────────────▼────────────────────┐
│   Backend — Express + TypeScript │
│   JWT Auth · Joi Validation     │
└──┬─────────────────┬────────────┘
   │                 │
┌──▼──────┐   ┌──────▼──────────┐
│ MongoDB │   │  Redis + BullMQ │
│ (Atlas) │   │   (Upstash)     │
└─────────┘   └──────┬──────────┘
                     │
              ┌──────▼──────────┐
              │  BullMQ Worker  │
              │  (Render)       │
              └──────┬──────────┘
                     │
              ┌──────▼──────────┐
              │  Groq LLaMA 3.3 │
              │  JSON output    │
              └─────────────────┘
```

### Flow

1. Teacher fills the Create Assignment form
2. Frontend sends `POST /api/assignments` with JWT token
3. Backend validates, saves to MongoDB, adds job to BullMQ queue
4. Worker picks up the job, builds structured prompt, calls Groq API
5. Progress broadcasted to frontend via WebSocket in real-time
6. Generated paper stored in MongoDB on completion
7. Frontend renders formatted question paper with sections, difficulty tags, marks
8. Teacher can Download PDF, Print, or Regenerate

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free) — [cloud.mongodb.com](https://cloud.mongodb.com)
- Upstash Redis account (free) — [upstash.com](https://upstash.com)
- Groq API key (free) — [console.groq.com](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/vedaai.git
cd vedaai
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/vedaai
REDIS_URL=rediss://default:TOKEN@host.upstash.io:6379
GROQ_API_KEY=gsk_your-groq-key-here
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Run the Application

Open **3 separate terminals**:

```bash
# Terminal 1 — Backend API
cd backend
npm run dev

# Terminal 2 — BullMQ Worker
cd backend
npm run worker

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Visit **http://localhost:3000** → Register → Create Assignment → Generate!

---

## Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com/ws
   ```
5. Deploy

### Backend → Render (Web Service)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `node dist/index.js`
6. Add all environment variables from `.env`
7. Deploy

### Worker → Render (Background Worker)

1. New Background Worker on Render
2. Same repo, same root directory `backend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `node dist/workers/assessmentWorker.js`
5. Add same environment variables
6. Deploy

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List all assignments |
| POST | `/api/assignments` | Create assignment + queue generation |
| GET | `/api/assignments/:id` | Get single assignment with paper |
| DELETE | `/api/assignments/:id` | Delete assignment |
| POST | `/api/assignments/:id/regenerate` | Regenerate question paper |

### WebSocket
Connect to `ws://localhost:5000/ws` and send:
```json
{ "type": "SUBSCRIBE", "assignmentId": "your-assignment-id" }
```

Receive real-time events:
- `JOB_PROGRESS` — generation progress (0–100%)
- `JOB_COMPLETED` — paper ready
- `JOB_FAILED` — generation failed

---

## Project Structure

```
vedaai/
├── backend/
│   ├── src/
│   │   ├── config/         # Redis queue + WebSocket manager
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/         # Mongoose schemas (User, Assignment)
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Groq AI service
│   │   ├── types/          # TypeScript interfaces
│   │   ├── workers/        # BullMQ background worker
│   │   └── index.ts        # App entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js App Router pages
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── assignments/
    │   ├── components/     # Reusable UI components
    │   ├── hooks/          # useWebSocket hook
    │   ├── lib/            # Axios API client
    │   ├── store/          # Zustand state stores
    │   └── types/          # TypeScript interfaces
    └── package.json
```

---

## Environment Variables Reference

### Backend

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Upstash Redis connection string |
| `GROQ_API_KEY` | Groq API key from console.groq.com |
| `JWT_SECRET` | Secret key for JWT signing |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL |

---
