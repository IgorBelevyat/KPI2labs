FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --esModuleInterop --skipLibCheck --ignoreConfig

FROM node:20-alpine AS runner

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm cache clean --force
RUN npm install prisma && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY prisma.config.ts ./
COPY --from=builder /app/prisma/seed.js ./prisma/

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/server.js"]
