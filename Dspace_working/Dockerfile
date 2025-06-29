# Multi-stage Dockerfile for React + Vite Frontend
FROM node:22-slim as base

WORKDIR /usr/src/app

# Development stage
FROM base as development

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Development command with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base as build

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Copy built assets from build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"] 