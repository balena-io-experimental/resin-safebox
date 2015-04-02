# resin-safebox
An electronic safe-deposit box with 2FA, using [resin.io](http://resin.io) and Twilio's [Authy](http://www.authy.com).

This demo shows how to bring 2-factor authentication to the physical world using a Raspberry Pi. The software consists on a node.js server running on the Pi; we use resin's port forwarding to expose it to the web.
The usage is simple: a user logs in using email and a numeric code, and in this way closes the lock. To open it, the user must input the code and a token sent by Authy via SMS (or using the Authy mobile app).

The lock itself is a solenoid, connected with a driver circuit to one of the Pi's GPIOs.

Deployment using resin.io
-------------------------
You'll need an account and an application created on Authy.

First, create an account at resin.io and create an application. For more information on these steps check out resin's [Getting Started guide](http://docs.resin.io/#/pages/gettingStarted.md) (if you're using a Pi 2, as we did, the guide is [here](http://docs.resin.io/#/pages/gettingStarted-RPI2.md).

Once you've created the app and have the Pi running with resin's OS, all you have to do is add the resin remote to this repository and:
```
git push resin master
```
This will push the repo and build a Docker image using the project's [Dockerfile](../blob/master/Dockerfile). Your device will automatically download and run the code.

On the resin.io Dashboard, go to the application's Environment Variables tab and set the following environment variables:
```
AUTHY_API_KEY = (your Authy API key from [http://authy.com])
IS_PI = true
GPIO = 17 (or whichever GPIO you prefer for the solenoid)
```

Hardware
--------
We built the solenoid driver using a 2n2222 transistor, a few resistors, and a diode, all on a small protoboard. It's this little arachnid:

![Circuit on protoboard](../blob/master/doc/Protoboard.jpg)

The schematic looks like this:

![Circuit schematic](../blob/master/doc/Solenoid-driver.png)

The solenoid itself is a 5V model like [this one](http://www.olimex.cl/product_info.php?products_id=1186&product__name=Solenoide_5v_(peque%F1o)).
You could of course use another one, but you might have to adapt the driver circuit or even use a separate power source.

Trying the UI on a PC
---------------------
You can run this on your PC as any node.js program. Just install it using:
```
npm install
```
And run it with:
```
AUTHY_API_KEY=your-authy-api-key node index.js
```




