FROM node:22.2.0

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y git

RUN git clone https://www.github.com/planet-nine-app/julia.git julia
RUN git clone https://www.github.com/planet-nine-app/continuebee.git continuebee
RUN git clone https://www.github.com/planet-nine-app/joan.git joan
RUN git clone https://www.github.com/planet-nine-app/pref.git pref
RUN git clone https://www.github.com/planet-nine-app/bdo.git bdo
RUN git clone https://www.github.com/planet-nine-app/fount.git fount
RUN git clone https://www.github.com/planet-nine-app/addie.git addie

EXPOSE 2999
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003
EXPOSE 3004
EXPOSE 3005

RUN npm install -g nodemon

WORKDIR /usr/src/app/julia/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

WORKDIR /usr/src/app/continuebee/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

WORKDIR /usr/src/app/joan/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

WORKDIR /usr/src/app/pref/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

WORKDIR /usr/src/app/bdo/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

WORKDIR /usr/src/app/fount/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

WORKDIR /usr/src/app/addie/src/server/node
RUN npm install
CMD ["nohup", "nodemon", "server.js"]

