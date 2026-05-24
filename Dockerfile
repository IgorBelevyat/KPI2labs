FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate \
    && npm run build \
    && npx tsc prisma/seed.ts --esModuleInterop --skipLibCheck --ignoreConfig

FROM node:20-alpine AS runner

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npm cache clean --force
RUN npm install prisma@5.11.0 && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/seed.js ./prisma/

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/server.js"]
