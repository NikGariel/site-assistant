FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY shared/ ./shared/
COPY packages/ ./packages/
COPY demo/ ./demo/
RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3100
ENV PORT=3100
CMD ["pnpm", "--filter", "site-assistant-demo", "start"]
