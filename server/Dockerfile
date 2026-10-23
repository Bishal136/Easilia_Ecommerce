# ==============================================================================
# Easilia Backend - Dockerfile (Arch Linux Base)
# ==============================================================================
FROM archlinux:latest

# Refresh keyring, update packages and install Node.js + npm
RUN pacman -Syu --needed --noconfirm && \
    pacman -S --needed --noconfirm nodejs npm && \
    pacman -Scc --noconfirm

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure all uploads directories exist with proper write permissions
RUN mkdir -p uploads/images uploads/avatars uploads/products uploads/videos uploads/documents && \
    chmod -R 777 uploads

# Default environment configuration
ENV NODE_ENV=production \
    PORT=5000 \
    UPLOAD_DIR=uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
