FROM node:16

WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn
COPY . /app/
RUN [ "yarn", "cross-env", "NODE_ENV=production", "webpack", "--mode", "production" ]

CMD [ "node", "dist/main.js" ]