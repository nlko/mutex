## Description

Mutex server.

## Running the app

```bash
# install deps
$ yarn

# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Docker

```bash
# building
$ docker build . -t mutex

# running docker instance
$ docker run --rm --name mutex -p 3000:3000 mutex

```

## Using

### wait for a ressource to be available
```bash
$  curl -X GET localhost:3000/a_ressource_name
38c7cfa2-2f7f-4264-9089-0f92ac209bc0
```

If the ressource isn't available `{"statusCode":408,"message":"Request Timeout"}` is returned.

An alternative way is to request the url to call for realising the ressource by adding an url query parameter:
```bash
$  curl -X GET "localhost:3000/a_ressource_name?url=1"
http://localhost:3000/a_ressource_name/38c7cfa2-2f7f-4264-9089-0f92ac209bc0
```

### release the ressource
```bash
curl -X GET localhost:3000/a_ressource_name/38c7cfa2-2f7f-4264-9089-0f92ac209bc0
```

### wait for a limited amount of time

Wait for a ressource no more than 1 second
```bash
$  curl -X GET localhost:3000/a_ressource_name?timeout=1000
```

## Configuration

By default the timeout is 10s and the maximum allowed timeout is 20s.

Some debug traces can also be activated.

These limitation can be overided with env variables:
```bash
docker run --rm -p 3000:3000 -e DEFAULT_TIMEOUT=5000 -e MAXIMUM_TIMEOUT=10000 -e DEBUG_TRACE=1  mutex
```

## License

[MIT licensed](LICENSE).
