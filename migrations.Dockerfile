FROM node:12

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY . .

ENTRYPOINT ["node", "--require", "ts-node/register", "./node_modules/typeorm/cli.js"]
CMD ["migration:run"]
