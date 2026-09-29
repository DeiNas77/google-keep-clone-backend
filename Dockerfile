FROM node:22-alpine as base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

## Builder
FROM base as builder 
WORKDIR /app 

COPY package.json pnpm-lock.yaml ./ 
RUN pnpm install --frozen-lockfile 

COPY . . 
RUN pnpm run build 

## Runner 
FROM base as runner 
WORKDIR /app 

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile 

COPY --from=builder /app/dist ./dist 

EXPOSE 4000

CMD ["node", "dist/index.js"]
