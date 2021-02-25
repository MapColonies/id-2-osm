# id-2-osm

----------------------------------------

A restful API for saving and querying osm entities external id's


## Run Migrations
if you are running a DB other than _SQLite_ don't forget to run migrations before you start the app

### Shell

Just run the following command

```sh
npm run migration:run
```

### Docker
Build the migrations image

```sh
docker build -t id-2-osm-migrations:latest -f migrations.Dockerfile .
```

then simply run

```sh
docker run -it --rm --network host id-2-osm-migrations:latest
```

If you want to change the connection properties you can do it via either:
1. Env variables
2. Inject a config file based on your environment


Via env variables
```sh
docker run -it -e DB_USERNAME=VALUE  -e DB_PASSWORD=VALUE -e DB_NAME=VALUE -e DB_TYPE=VALUE -e DB_HOST=VALUE -e DB_PORT=VALUE --rm --network host id-2-osm-migrations:latest
```

Via injectiong a config file, assuming you want to run the migrations on your production

production.json:
```json
{
  "openapiConfig": {
    "filePath": "./openapi3.yaml",
    "basePath": "/docs",
    "rawPath": "/api",
    "uiPath": "/api"
  },
  "logger": {
    "level": "info"
  },
  "server": {
    "port": "8080"
  },
  "db": {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "username": "prod_avi",
    "password": "prod_avi",
    "database": "prod_avi"
  }
}
```
```sh
docker run -it --rm -e NODE_ENV=production --network host -v /path/to/proudction.json:/usr/app/config/production.json id-2-osm-migrations:latest
```
-------------------------------------------------------

## Build and Run

```sh
npm install
npm run start
```
