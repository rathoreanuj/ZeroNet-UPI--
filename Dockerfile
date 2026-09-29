# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Node.js Runtime
FROM node:20-alpine
WORKDIR /app

# Install backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy compiled frontend assets to frontend/dist (served by Express server.js)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

WORKDIR /app/backend
CMD ["node", "src/server.js"]
