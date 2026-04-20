# 🛡️ ShieldHer

> **An AI-powered personal safety layer for teen girls online.**  
> Combining real-time toxicity interception, anonymous identity protection, and emotional wellness tracking — in a single platform.

Built for **Hackfinity** — ACM-W's flagship hackathon at PES University, Department of Computer Science and Engineering.

---

## 📌 The Problem

67% of teen girls modify or delete online posts out of fear of harassment *(UNESCO, 2023)*. Every existing solution — content moderation, block buttons, reporting tools — acts **only after the harm is done**. The emotional damage is already inflicted.

There is no tool today that simultaneously:
- Intercepts toxic content **before delivery**
- Protects the user's **identity** so they can express freely
- Tracks the **emotional toll** and provides real-time support

**ShieldHer is that tool.**

---

## ✨ Features

### 🔴 Toxicity Shield
- NLP classifier intercepts harassment before it reaches the recipient
- Powered by **Google Perspective API**
- Real-time toxicity scoring — messages above threshold are blocked instantly
- Incident log maintained for evidence and reporting

### 🟣 Identity Layer
- Users sign up with a **pseudonym only** — no real name, no email
- JWT-based anonymous authentication
- Safe expression without fear of doxxing, stalking, or identity-based attacks

### 🟢 Wellness Engine
- After every blocked message, a mood check-in is triggered
- **Claude API (Anthropic)** generates warm, age-appropriate coping nudges
- Mood history tracked over time with a visual dashboard
- Surfaces emotional patterns and coping resources

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Toxicity API | Google Perspective API |
| AI Wellness | Claude API (Anthropic) — `claude-sonnet-4-20250514` |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🗂️ Project Structure

```
shieldher/
├── backend/
│   ├── models/
│   │   ├── User.js           # Pseudonym + hashed password
│   │   ├── Post.js           # Feed posts + toxicity scores
│   │   └── MoodLog.js        # Mood entries + AI nudges
│   ├── routes/
│   │   ├── auth.js           # Register, login, verify
│   │   ├── posts.js          # Check-and-send, feed
│   │   └── wellness.js       # Log mood, fetch history
│   ├── .env                  # API keys (never commit this!)
│   └── server.js             # Express entry point
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Feed.jsx
        │   └── Wellness.jsx
        ├── components/
        │   ├── Navigation.jsx
        │   └── WellnessTrigger.jsx   # Reusable mood popup
        └── utils/
            └── auth.js               # Token helpers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Google Perspective API key → [Get it here](https://developers.perspectiveapi.com/)
- Anthropic API key → [Get it here](https://console.anthropic.com/)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-team/shieldher.git
cd shieldher
```

---

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_long_random_string_here
PERSPECTIVE_API_KEY=your_google_perspective_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Start the backend:

```bash
node server.js
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

---

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm install recharts
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/register` | `{ pseudonym, password }` | Create anonymous account |
| POST | `/login` | `{ pseudonym, password }` | Sign in, get JWT token |
| GET | `/verify` | — (Bearer token) | Check if token is valid |

### Post Routes (`/api/posts`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/check-and-send` | `{ content }` | Check toxicity, block or post |
| GET | `/feed` | — | Get all safe posts |

### Wellness Routes (`/api/wellness`)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/log-mood` | `{ moodScore }` (1–5) | Log mood + get AI nudge |
| GET | `/history` | — | Get last 10 mood logs |

> All routes except `/register` and `/login` require:  
> `Authorization: Bearer <your_jwt_token>`

---

## 🎬 Demo Flow

1. **Register** with a pseudonym — no real identity needed
2. **Type a normal message** on the feed → it posts safely ✅
3. **Type a toxic/harassing message** → ShieldHer intercepts it 🛡️
4. **Wellness popup triggers** → select your mood emoji
5. **AI nudge appears** — warm, personalised support from Claude
6. **Visit Wellness page** → see your mood journey chart + past nudges

---

## 👥 Team ShieldHer

Built at Hackfinity by ACM-W, PES University

| Role | Responsibility |
|------|---------------|
| Person 1 | Project Lead — Backend core, server setup, MongoDB, integration |
| Person 2 | Toxicity Shield — Perspective API, Feed UI |
| Person 3 | Identity Layer — JWT auth, anonymous login UI |
| Person 4 | Wellness Engine — Claude API, mood tracking, Wellness UI |

---

## 🌍 Business Scope & Impact

- **500M+** teen social media users globally
- Cyberbullying intervention market projected at **$1.2B by 2027**
- **B2B opportunities:** Schools, EdTech platforms, NGOs, Social media companies
- **Freemium model:** Free core shield, premium wellness + reporting for institutions

---

## 📄 License

MIT License — built for social good. Feel free to build on this.

---

> *"Innovating for Women, Empowering Through Technology"* — Hackfinity, ACM-W PES University
