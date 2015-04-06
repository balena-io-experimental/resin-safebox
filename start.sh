rm /datadb/mongod.lock
/usr/bin/mongod --dbpath /datadb --repair
/usr/bin/mongod --dbpath /datadb --fork --logpath mongod.log && node index.js