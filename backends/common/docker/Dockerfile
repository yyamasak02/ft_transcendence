FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080

RUN npm run build

ENV TZ=Asia/Tokyo

CMD ["sh", "-c", "npm run db:setup && npm run start"]