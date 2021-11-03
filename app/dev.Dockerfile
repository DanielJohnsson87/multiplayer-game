FROM node:12

WORKDIR /usr/app

COPY /app/package.json ./

RUN yarn install

COPY /app/src ./src

EXPOSE 9000

CMD [ "yarn", "start"]
