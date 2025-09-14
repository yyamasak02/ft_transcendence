FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080

RUN npm run build

ENV TZ=Asia/Tokyo
