# AI Coding Analysis

MVP project for fullstack interview preparation with AI integration.

## Stack

- Frontend: Vue 3 + Vite + Pinia + Vue Router
- Backend: Spring Boot 3
- LLM: DeepSeek Chat API

## Features (high level)

- **LeetCode-style analysis** with Markdown export.
- **System Design Draft** canvas: draggable nodes, edges, context menus, inline label editing, keyboard shortcuts, and type-styled nodes (`SystemDesignView.vue`).
- **Interview questions** search with AI-generated hints; **Favorites** tab with a combined **cheat sheet** (LLM) and Markdown download.

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

## Git and GitHub (push all code)

Remote is typically `origin` on GitHub (for example `https://github.com/<org-or-user>/<repo>.git`).

**Push your latest work to `main`:**

```bash
git checkout main
git pull origin main
git status
```

Stage and commit anything that is not yet committed:

```bash
git add -A
git commit -m "Describe your change in one clear sentence."
```

Push everything on `main` to GitHub:

```bash
git push origin main
```

If you are on another branch and want that work on `main`, merge (or open a pull request) first, for example:

```bash
git checkout main
git pull origin main
git merge your-feature-branch
git push origin main
```

After a successful push, `main` on GitHub matches your local `main` at the commit you just pushed.
