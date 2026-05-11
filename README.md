# AI Coding Analysis

MVP project for fullstack interview preparation with AI integration.

## Stack

- Frontend: Vue 3 + Vite + Pinia + Vue Router
- Backend: Spring Boot 3
- LLM: DeepSeek Chat API

## Backend Setup

1. Copy `backend/.env.local.example` to `backend/.env.local`.
2. Fill in `DEEPSEEK_API_KEY`.
3. Run:

```bash
cd backend
mvn spring-boot:run
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:8080`
