/**
 * Created by andrew on 19.01.17.
 *
 * @link https://github.com/nwjs/nw.js
 *
 */

// var gui = require('nw.gui');
// var menu = new gui.Menu();

const DEV = true;

nw.Screen.Init();

  var win = nw.Window.get();
if(!DEV)
  win.showDevTools();

var sizeHelper = document.createElement('div');
sizeHelper.style.position = 'absolute';
sizeHelper.style.bottom = '0';
sizeHelper.style.right = '0';
sizeHelper.style.fontSize = 'x-small';
sizeHelper.style.color = '#666';

win.x = nw.Screen.screens[0].work_area.width - nw.Window.get().width;
win.y = nw.Screen.screens[0].work_area.x + nw.Screen.screens[0].work_area.y;

var sizeText = document.createTextNode(null);

win.on('loaded', function () {
  document.body.appendChild(sizeHelper);
});

win.on('move', function (x, y) {
  sizeHelper.innerHTML = '';
  sizeText = document.createTextNode('x: ' + win.x + ", y: " + win.y);
  sizeHelper.appendChild(sizeText);
});

var tray = new nw.Tray({ icon: 'img/icon.png' });
var traymenu = new nw.Menu();
traymenu.append(new nw.MenuItem({ type: 'checkbox', label: 'box1' }));
tray.menu = traymenu;

var os = require('os');
document.title = 'Our computer is: ' + os.platform();

win.show();

var io = require('socket.io-client');

var socket = io.connect('http://localhost:8080');
socket.on('marker', function (data) {
  console.log('received data: ');
  console.log(data);
  console.log('end of recieved data: ');

  var d = new Date();
  document.title = 'New message received on ' + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

  win.show();

  var elem = document.getElementById('logger');
  var eventElem = document.createElement('li');
  var cssClass = document.createAttribute('class');
  cssClass.value = 'mdl-list__item';

  var content = document.createTextNode(data.message);
  eventElem.appendChild(content);
  elem.appendChild(eventElem);

  setTimeout(function () {
    win.hide();
    elem.removeChild(eventElem);
  }, 5000)
});

/*
var path = './';
var fs = require('fs');
var reloadWatcher=fs.watch(path, function() {
  location.reload();
  reloadWatcher.close();
});
*/

