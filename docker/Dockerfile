FROM node:18-alpine
RUN apk add --no-cache make gcc g++ python3

WORKDIR /tokene-contracts

COPY docker/package.json ./
COPY docker/package-lock.json ./
COPY docker/hardhat.config.ts ./
COPY docker/tsconfig.json ./

COPY contracts ./contracts
COPY deploy ./deploy
COPY scripts ./scripts

RUN npm install

ENTRYPOINT ["npm", "run"]
