FROM resin/rpi-raspbian:wheezy-2015-03-25
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get update
RUN apt-get install -y build-essential nodejs mongodb
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "index.js"]
