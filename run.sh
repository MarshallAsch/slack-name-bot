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

    echo "SLACK_ACCESS_TOKEN=$SLACK_ACCESS_TOKEN" > config/.env
    echo "SLACK_SIGNING_SECRET=$SLACK_SIGNING_SECRET" >> config/.env
fi



# start the server
node src/index.js
