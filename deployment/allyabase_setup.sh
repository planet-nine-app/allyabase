#!/bin/bash

set -e

# Use /var/lib for persistent storage on Ubuntu instead of /tmp
# /var/lib is the standard location for application state data that persists across reboots
defaultDir="/var/lib"
buildDir="${1:-$defaultDir}"
[[ $buildDir != /* ]]&& buildDir="${PWD%/}/$buildDir"
buildDir="${buildDir#./}/allyabase"
ecosystem_config='ecosystem.config.js'
services=(
    'addie'
    'aretha'
    'bdo'
    'continuebee'
    'dolores'
    'eumachia'
    'fount'
    'joan'
    'julia'
    'minnie'
    'pref'
    'prof'
    'sanora'
)

setup_services() {
    mkdir "$buildDir"&& { cd "$buildDir"|| :; }

    for service in "${services[@]}"; do
        git clone "https://github.com/planet-nine-app/$service"

        printf '%s\n' "Installing '$service'..."
        npm install "$service/src/server/node"
    done
} # setup_services

setup_ecosystem() {
    if [[ ! -f "package.json" || ! -f "package-lock.json" ]]; then
        echo "Initializing npm in this directory..."
        npm init -y
    else
        echo "Both package.json and package-lock.json are already present. Skipping initialization."
    fi

    npm install pm2-runtime

    printf '%s\n' \
        'module.exports = {' \
        '  apps: [' >>"$ecosystem_config"

    for service in "${services[@]}"; do
        if [[ $service == 'addie' ]]; then
            env="{
                LOCALHOST: 'true',
                STRIPE_KEY: '<api key here>',
                STRIPE_PUBLISHING_KEY: '<publishing key here>',
                SQUARE_KEY: '<api key here>'
            }"
        else
            env="{ LOCALHOST: 'true' }"
        fi

        printf '%s\n' \
            "    {" \
            "      name: '$service'," \
            "      script: '$buildDir/$service/src/server/node/${service}.js'," \
            "      env: $env" \
            "    }," >>"$ecosystem_config"
    done

    printf '%s\n' '    ]' \
        '}' >>"$ecosystem_config"
} # setup_ecosystem

main() {
    setup_services
    setup_ecosystem
    
    ./node_modules/.bin/pm2-runtime start ecosystem.config.js
}; main
