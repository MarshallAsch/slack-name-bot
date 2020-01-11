#!/bin/bash

# Create the config file if it does not yet exist
if [ ! -f "config/config.ini" ]; then
    echo "config/config.ini does not exist. Creating"

    if [ -z "$SLACK_SIGNING_SECRET" ]
    then
        echo "Must set the SLACK_SIGNING_SECRET variable"
        exit 1
    fi

    if [ -z "$SLACK_CLIENT_SECRET" ]
    then
        echo "Must set the SLACK_CLIENT_SECRET variable"
        exit 1
    fi

    if [ -z "$SLACK_CLIENT_ID" ]
    then
        echo "Must set the SLACK_CLIENT_ID variable"
        exit 1
    fi

    # database config
    if [ -z "$DATABASE" ]
    then
        echo "Must set the DATABASE variable"
        exit 1
    fi


    # generate config file
    eval "echo \"$(cat config.ini.tmp)\" > config/config.ini"

fi


# start the server
node src/index.js
