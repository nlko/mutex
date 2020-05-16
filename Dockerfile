from node:14.2.0-alpine3.11 as build

copy src /app
copy *.json /app/

workdir /app

run npm install

run npm run build

from node:14.2.0-alpine3.11

workdir /app

copy --from=build /app/dist /app/
copy --from=build /app/package.json /app/

run npm install
run npm install -g nodemon

expose 3000

workdir /app

cmd nodemon dist/main.js