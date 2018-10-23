FROM node:8.12-alpine

RUN yarn global add strest-cli
COPY /tests /app/tests
WORKDIR /app

ENTRYPOINT ["strest"]