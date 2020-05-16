## Description

Mutex server.

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Docker

```bash
# unit tests
$ docker build . -t mutex

# runnig docker instance
$ docker run --rm -p 3000:3000 mutex

```

## Using

### wait for a ressource to be available
```
$  curl -X GET localhost:3000/a_ressource_name
38c7cfa2-2f7f-4264-9089-0f92ac209bc0
```

If the ressource isn't available `{"statusCode":408,"message":"Request Timeout"}` is returned.

### release the ressource
`curl -X GET localhost:3000/a_ressource_name/38c7cfa2-2f7f-4264-9089-0f92ac209bc0`

### wait for a limited amount of time

Wait for a ressource no more than 1 second
```
$  curl -X GET localhost:3000/a_ressource_name/1000
```

## Configuration

By default the timeout is 10s and the maximum allowed timeout is 20s.

These limitation can be overided with env variables:
```
docker run --rm -p 3000:3000 -e DEFAULT_TIMEOUT=5000 -e MAXIMUM_TIMEOUT=10000 mutex
```

## License

[MIT licensed](LICENSE).
