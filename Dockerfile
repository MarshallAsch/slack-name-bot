FROM node:10

LABEL maintainer="Marshall Asch <maasch@rogers.com>"


WORKDIR /usr/src/app

# Start but just installing the dependancies
COPY package.json ./
RUN npm install

# import all the application source code
COPY ./src ./src
COPY ./run.sh ./


EXPOSE 5000

VOLUME /usr/src/app/config


ARG DB_PORT=27017
ARG DB_HOST=127.0.0.1
ARG DB_USER=root
ARG DB_PASS=root

CMD ./run.sh
