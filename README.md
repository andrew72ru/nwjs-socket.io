[Nwjs](https://nwjs.io) application to receive massage from websocket

# Warning!

Application is under development and not working properly, do not use it.

## Roadmap

- [x] Styles for main window (main window is a setup window);
- [x] setup window, style it;
- [x] and save settings in local storage;
- [x] external config file (for server address, settings, etc.);
- [x] tray icon and menu for setup application;
- [ ] create and style the notification window;
- [ ] show window by event;
- [x] "check notify" button. **DO NOT** send any signals to server, just open window and write text to then;

## Socket.io server side

*package.json*

```json
{
  "name": "socket.io-nodejs-server",
  "version": "0.0.1",
  "dependencies": {
    "socket.io": "^1.7.2",
    "socket.io-client": "^1.7.2",
    "winston": "^2.3.0"
  }
}
```

*app.js*

```js
var server     = require('http').createServer(),
    io         = require('socket.io')(server),
    logger     = require('winston'),
    port       = 8080;

// Logger config
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true, timestamp: true });
logger.info('SocketIO > listening on port ' + port);

io.on('connection', function (socket){
    var nb = 0;

    logger.info('SocketIO > Connected socket ' + socket.id);

    socket.on('broadcast', function (message) {
        ++nb;
        logger.info('ElephantIO broadcast > ' + JSON.stringify(message));
        socket.broadcast.emit('marker', message);
    });

    socket.on('disconnect', function () {
        logger.info('SocketIO : Received ' + nb + ' messages');
        logger.info('SocketIO > Disconnected socket ' + socket.id);
    });
});

server.listen(port);
```

To run server just create two files (`package.json` and `app.js`) in any directory, open terminal, `cd` to you directory and type:

```shell
npm install
node app.js
```

## Php server side

*elephant.php*

```php
#!/usr/bin/env php
<?php

require (__DIR__) . '/vendor/autoload.php';

use ElephantIO\Client;
use ElephantIO\Engine\SocketIO\Version1X;

$client = new Client(new Version1X('http://localhost:8080'));

$client->initialize();
$client->emit('broadcast', ['message' => array_key_exists(1, $argv) ? $argv[1] : 'Test message']);
$client->close();


```

In work directory:

```shell
composer require wisembly/elephant.io
./elephant.php 'You message'
```



## Links (libs are using in project)

- Nwjs - https://nwjs.io
- Socket.io http://socket.io
- Material Design Lite – https://getmdl.io
- Material Design Icons – https://material.io/icons/

and for server side

- 
- (php client for socket.io) Elephant.io - http://elephant.io
