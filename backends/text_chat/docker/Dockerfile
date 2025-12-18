FROM 24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8081

RUN npm run build

ENV TZ=Asia/Tokyo

CMD ["sh", "-c", "npm run start"]