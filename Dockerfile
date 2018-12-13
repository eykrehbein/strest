FROM node:8.12-alpine as builder

COPY . /app
WORKDIR /app

RUN npm i
RUN npm run build

FROM node:8.12-alpine
COPY --from=builder /app /app
WORKDIR /app
RUN npm link

CMD ["strest", "tests/success/"]
