FROM node:12-alpine as build

RUN apk add --no-cache make gcc g++ python 

COPY yarn.lock yarn.lock
COPY package.json package.json

RUN yarn install
COPY . .
RUN yarn run build

FROM node:12-alpine
COPY --from=build dist dist
CMD npx serve dist
