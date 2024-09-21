#!/bin/bash
nohup nodemon /usr/src/app/julia/src/server/node/server.js &
nohup nodemon /usr/src/app/continuebee/src/server/node/server.js &
nohup nodemon /usr/src/app/joan/src/server/node/server.js &
nohup nodemon /usr/src/app/pref/src/server/node/server.js &
nohup nodemon /usr/src/app/bdo/src/server/node/server.js &
nohup nodemon /usr/src/app/fount/src/server/node/server.js &
nohup nodemon /usr/src/app/addie/src/server/node/server.js &

# Keep the script running
tail -f /dev/null
