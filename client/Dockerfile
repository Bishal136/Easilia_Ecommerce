# ==============================================================================
# Easilia Frontend - Dockerfile (Multi-stage Arch Linux Base)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Application
# ------------------------------------------------------------------------------
FROM archlinux:latest AS builder

RUN pacman -Syu --needed --noconfirm && \
    pacman -S --needed --noconfirm nodejs npm && \
    pacman -Scc --noconfirm

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Set build-time environment variables for Vite SPA
ENV VITE_API_URL=/api/v1 \
    VITE_SERVER_URL= \
    VITE_SOCKET_URL=/

# Build production bundle (tsc -b && vite build)
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve via Nginx on Arch Linux
# ------------------------------------------------------------------------------
FROM archlinux:latest

RUN pacman -Syu --needed --noconfirm && \
    pacman -S --needed --noconfirm nginx && \
    pacman -Scc --noconfirm

# Clear default html files
RUN rm -rf /usr/share/nginx/html/*

# Copy customized Nginx reverse-proxy configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
