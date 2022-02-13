from node:lts-alpine as build

workdir /app

copy *.json /app/
copy yarn.lock /app/

run yarn

copy src /app

run yarn build

from node:lts-alpine

expose 3000

workdir /app

run yarn global add nodemon

copy *.json /app/
copy yarn.lock /app/

run yarn --prod

copy --from=build /app/dist /app/

cmd nodemon main.js
