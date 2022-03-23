FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# RUN npm ci --only=production

# Bundle app source
COPY . .
COPY .env.production .env

RUN npm run build

ENV NODE_ENV=production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
# At the end, set the user to use when running this image
USER node