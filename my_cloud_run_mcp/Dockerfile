# Multi-stage Dockerfile for Node.js + Python MCP Server
FROM node:22-slim as base

# Install system dependencies for both Node.js and Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Development stage
FROM base as development

# Install Python dependencies in virtual environment
COPY requirements.txt ./
RUN python3 -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Install Node.js dependencies  
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Add health check endpoint
RUN echo 'import express from "express"; const app = express(); app.get("/health", (req, res) => res.json({status: "ok", timestamp: new Date().toISOString()})); export { app };' > health.js

# Expose port
EXPOSE 3000

# Set Python path to use virtual environment
ENV PATH="/usr/src/app/.venv/bin:$PATH"
ENV PYTHONPATH="/usr/src/app"

# Development command with hot reload
CMD ["npm", "run", "dev"]

# Production stage
FROM base as production

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /usr/src/app
USER app

# Install Python dependencies in virtual environment
COPY --chown=app:app requirements.txt ./
RUN python3 -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies (production only)
COPY --chown=app:app package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY --chown=app:app . .

# Set Python path to use virtual environment
ENV PATH="/usr/src/app/.venv/bin:$PATH"
ENV PYTHONPATH="/usr/src/app"
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Production command
CMD ["node", "mcp-server.js"]
