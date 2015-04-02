FROM resin/rpi-raspbian:jessie
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y build-essential nodejs mongodb
COPY . .
RUN npm install
EXPOSE 8080
CMD service mongod start && node index.js
