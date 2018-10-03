FROM node:8.12-alpine

RUN npm i -g strest-cli

ENTRYPOINT ["strest"]