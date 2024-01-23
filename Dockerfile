FROM node:lts-alpine as node_modules_for_prod

WORKDIR /app

COPY *.json /app/
COPY yarn.lock /app/

RUN yarn --prod

FROM node:lts-alpine as node_modules_for_dev

COPY --from=node_modules_for_prod /app /app

WORKDIR /app

RUN yarn

FROM node:lts-alpine as build

COPY --from=node_modules_for_dev /app /app

WORKDIR /app

COPY src /app

RUN yarn build

FROM node:lts-alpine as prod

RUN yarn global add nodemon

COPY --from=node_modules_for_prod /app /app

COPY --from=build /app/dist /app/

WORKDIR /app

EXPOSE 3000

CMD nodemon main.js
