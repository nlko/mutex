from node:16.3.0-alpine3.13 as build

copy src /app
copy *.json /app/

workdir /app

run yarn

run yarn build

from node:16.3.0-alpine3.13

workdir /app

run yarn global add nodemon

copy --from=build /app/dist /app/
copy --from=build /app/package.json /app/

expose 3000

workdir /app

run yarn --prod

cmd nodemon main.js
