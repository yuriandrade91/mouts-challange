FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
ENV NODE_ENV=production

RUN mkdir -p /usr/src/app \
	&& chown -R node:node /usr/src/app
WORKDIR /usr/src/app
COPY package*.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=builder /usr/src/app/dist ./dist
COPY wait-for-postgres.sh /usr/local/bin/wait-for-postgres.sh
RUN chmod +x /usr/local/bin/wait-for-postgres.sh

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/wait-for-postgres.sh"]
CMD ["node", "dist/main.js"]
