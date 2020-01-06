#!/bin/bash

# Create the config file if it does not yet exist
if [ ! -f "config/.env" ]; then
    echo "config/.env does not exist. Creating"


    if [ -z "$SLACK_ACCESS_TOKEN" ]
    then
        echo "Must set the SLACK_ACCESS_TOKEN variable"
        exit 1
    fi


    if [ -z "$SLACK_SIGNING_SECRET" ]
    then
        echo "Must set the SLACK_SIGNING_SECRET variable"
        exit 1
    fi

    # database config

    if [ -z "$DATABASE" ]
    then
        echo "Must set the DATABASE variable"
        exit 1
    fi


    echo "SLACK_ACCESS_TOKEN=$SLACK_ACCESS_TOKEN" > config/.env
    echo "SLACK_SIGNING_SECRET=$SLACK_SIGNING_SECRET" >> config/.env
    echo "DATABASE=$DATABASE" >> config/.env
    echo "DB_PORT=$DB_PORT" >> config/.env
    echo "DB_HOST=$DB_HOST" >> config/.env
    echo "DB_USER=$DB_USER" >> config/.env
    echo "DB_PASS=$DB_PASS" >> config/.env
    echo "ADMIN_CHANNEL_ID=$ADMIN_CHANNEL_ID" >> config/.env

fi



# start the server
node src/index.js
