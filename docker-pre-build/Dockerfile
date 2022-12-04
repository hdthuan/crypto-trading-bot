FROM node:10

RUN apt-get update && apt-get install -y \
    sqlite \
&& rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app
RUN npm install --production && \
    npm cache clean --force

# Apply all patches in app
RUN npm run postinstall

## Build docker image
# docker build -t hdthuan/crypto-bot-pre-build:latest -f Dockerfile .
## Public to docker hub
# docker push hdthuan/crypto-bot-pre-build:latest
