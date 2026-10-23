# 🐳 Dockerization Guide for Easilia Marketplace (Arch Linux Base)

This document provides complete instructions on how to build, run, and manage the full-stack Easilia application inside **Docker** using **Arch Linux** (`archlinux:latest`) base images.

---

## 🏗️ Docker Architecture Overview

```
                                🌐 User Browser
                                      │ (Port 80)
                                      ▼
                   ┌──────────────────────────────────────┐
                   │    easilia-client (Arch Linux)       │
                   │       Nginx Web Server               │
                   │  - Serves React SPA (dist/)          │
                   │  - SPA routing: try_files fallback   │
                   └──────┬───────────────────────┬───────┘
                          │ (Reverse Proxy)       │ (/uploads/)
                          │ http://server:5000    │
                          ▼                       │
                   ┌──────────────────────────────┴───────┐
                   │    easilia-server (Arch Linux)       │
                   │       Node.js Express API            │
                   │  - Handles /api/v1/ endpoints        │
                   │  - Socket.io WebSockets              │
                   │  - Stores media in persistent volume │
                   └──────────────┬───────────────────────┘
                                  │ (Port 27017)
                                  ▼
                   ┌──────────────────────────────────────┐
                   │    easilia-mongo (MongoDB 7.0)       │
                   │  - Local offline database            │
                   │  - (Or connect to MongoDB Atlas)     │
                   └──────────────────────────────────────┘
```

---

## 🚀 Quick Start (1-Command Run)

### 1. Build and Start All Containers
From the project root directory, run:
```bash
docker compose up -d --build
```

### 2. Access the Application
Once the build completes and containers start:
- 🌐 **Frontend Website**: [http://localhost](http://localhost) (or `http://localhost:80`)
- 🔗 **Backend Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) (or `http://localhost/api/v1/health`)
- 🍃 **Local MongoDB**: `localhost:27017`

---

## ⚙️ Configuration & Environment Variables

Copy the provided docker environment template:
```bash
cp .env.docker.example .env
```

### Database Options:

#### Option A: Use Local Docker MongoDB (Default)
In your `.env` file or `docker-compose.yml`:
```ini
MONGO_URI=mongodb://mongo:27017/easilia
```

#### Option B: Use MongoDB Atlas Cloud Database
To connect to your existing cloud database, update `MONGO_URI` in `.env`:
```ini
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.qehlvra.mongodb.net/easilia
```

---

## 🛠️ Common Docker Commands

### View Container Status
```bash
docker compose ps
```

### View Live Logs
```bash
# View logs from all services
docker compose logs -f

# View logs from backend only
docker compose logs -f server

# View logs from frontend/nginx only
docker compose logs -f client
```

### Stop the Containers
```bash
docker compose down
```

### Stop and Remove Persistent Volumes (Fresh Reset)
```bash
docker compose down -v
```

### Rebuild After Code Changes
```bash
docker compose up -d --build
```

---

## 📦 Running Scripts & Seeding Inside the Container

To seed the initial administrator user inside the Docker container:
```bash
docker compose exec server npm run seed
```

To run a bash shell inside the Arch Linux backend container:
```bash
docker compose exec server bash
```

To run a bash shell inside the Arch Linux frontend container:
```bash
docker compose exec client bash
```

---

## 📁 Persistent Storage & Volumes

- **`easilia_uploads`**: Maps to `/app/uploads` in the backend container. All product photos, user avatars, and banners remain safely stored on your host machine even when containers are restarted or rebuilt.
- **`easilia_mongo_data`**: Maps to `/data/db` in the MongoDB container to preserve your database records.

---

## 🐧 Why Arch Linux Base Images?

- **Cutting-edge Rolling Packages**: Both backend and frontend use official `archlinux:latest` base images with pacman package management.
- **Unified Environment**: Matches the development and host environment with modern libraries and glibc.
- **Optimized Caching**: Dockerfiles are structured so that `pacman` updates and `npm install` are cached in layers, making subsequent rebuilds nearly instant.
