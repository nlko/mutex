from node:15.9.0-alpine3.13 as build

copy src /app
copy *.json /app/

workdir /app

run npm install

run npm run build

from node:15.9.0-alpine3.13

workdir /app

run npm install -g nodemon

copy --from=build /app/dist /app/
copy --from=build /app/package.json /app/

expose 3000

workdir /app

run npm install --prod

cmd nodemon main.js
