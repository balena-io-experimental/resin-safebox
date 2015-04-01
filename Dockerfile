FROM resin/rpi-raspbian:wheezy-2015-03-25
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y build-essential nodejs git
RUN bash deps.sh
RUN npm install
EXPOSE 8080
CMD /etc/init.d/mongod start && node index.js
