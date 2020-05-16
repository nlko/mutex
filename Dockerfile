from node:14.2.0-alpine3.11

copy src /app
copy *.json /app/

workdir /app

run yarn

run yarn build

run rm /app/src -rf
run rm /app/*.ts -rf

run rm /app/*.lock -rf

expose 3000

cmd yarn start:prod