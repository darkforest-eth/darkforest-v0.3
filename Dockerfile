FROM node:12-alpine as build

RUN apk add --no-cache make gcc g++ python 

COPY client/yarn.lock client/yarn.lock
COPY client/package.json client/package.json

RUN cd client && yarn install
COPY client client
RUN cd client && yarn build

FROM node:12-alpine
COPY --from=build client/dist client/dist

COPY whitelist whitelist
RUN cd whitelist && yarn

COPY webserver webserver
RUN cd webserver && yarn
RUN cd webserver && yarn run pm2 install typescript

COPY mockchain mockchain
RUN cd mockchain && yarn

COPY eth eth

CMD cd webserver && NODE_ENV="production" yarn run start:prod
# CMD npx serve dist
