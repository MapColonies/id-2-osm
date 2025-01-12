FROM node:20

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY . .

ENTRYPOINT ["node", "--require", "ts-node/register", "./node_modules/typeorm/cli.js", "-d", "./dataSource.ts"]
CMD ["migration:run"]
