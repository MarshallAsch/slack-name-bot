FROM node:10

LABEL maintainer="Marshall Asch <maasch@rogers.com>"


WORKDIR /usr/src/app

# Start but just installing the dependancies
COPY package*.json ./
RUN npm install

# import all the application source code
COPY . .


EXPOSE 5000

VOLUME /usr/src/app/config

CMD ./run.sh
