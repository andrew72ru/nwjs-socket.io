/**
 * Created by andrew on 19.01.17.
 *
 * @link https://github.com/nwjs/nw.js
 *
 */
"use strict";

const opn = require('opn');
let DEV = false;
if((typeof nw.App.fullArgv.forEach) === 'function') {
  nw.App.fullArgv.forEach(function (elem) {
    if(elem === '--debug') { DEV = true; }
  })
}
let connected = false;

process.stdout.write("Process on" + `\n`);

class devOptions {

  constructor() {
    this.win = new setupWindow().win;
    this.devInit();
  }

  devInit() {
    let win = this.win;
    let selfClass = this;

    win.on('loaded', function () {
      if(win) {
        win.showDevTools();
        selfClass.windowPositionString();
      }
    });

    win.on('move', function () {
      if(win) {
        selfClass.windowPositionString();
      }
    });

  }

  windowPositionString() {
    let os = require("os");
    let elemId = 'size-helper-elemet';
    let existElement = document.querySelector("#" + elemId);
    if(existElement) {
      document.querySelector("#" + elemId).remove();
    }

    let sizeHelper = document.createElement("div");
    sizeHelper.setAttribute('id', elemId);
    sizeHelper.style.position = "absolute";
    sizeHelper.style.bottom = "0";
    sizeHelper.style.right = "0";
    sizeHelper.style.fontSize = "x-small";
    sizeHelper.style.color = "#666";

    let win = this.win;
    let sizeText = document.createTextNode('x: ' + win.x + ", y: " + win.y + " (" + os.platform() + ")");
    sizeHelper.appendChild(sizeText);
    if(document.body) {
      document.body.appendChild(sizeHelper);
    }
    return sizeHelper;
  }
}

/**
 * Create menus
 */
class appMenu {

  constructor() {
    this.tray = new nw.Tray({
        icon: 'img/ic_notifications_off_black_24dp/web/ic_notifications_off_black_24dp_1x.png'
    });
    this.trayMenu();
  }

  trayMenu() {
    let traymenu = new nw.Menu();

    let windowShowItem = new nw.MenuItem({
      type: "normal",
      label: "Settings",
      click: function () {
        new setupWindow().setVisible();
      }
    });

    let exitItem = new nw.MenuItem({
      type: 'normal',
      label: 'Exit from Notificator',
      click: function () {
        nw.App.quit();
      }
    });

    traymenu.append(windowShowItem);
    traymenu.append(exitItem);
    this.tray.menu = traymenu;
  }
}

class socketClient {

  /**
   * Set up variables:
   * timeoutId - identifier of timer to hide window
   * setupClass - class with window functions
   * win - window
   */
  constructor() {
    this.timeoutId = undefined;
    this.setupClass = new setupWindow();
    this.win = this.setupClass.win;
  }

  /**
   * Connect to websocket
   */
  connect() {
    let io = require("socket.io-client");
    let socket = io.connect("http://localhost:8080");
    socket.on('connect', function () {
      connected = true;
      if(DEV) { console.log('Socket connected with id ' + socket.id); }
    });
    socket.on('connect_failed', function () {
    })

    this.receive(socket);
  }

  /**
   * Add listener to socket
   *
   * @param socket
   */
  receive(socket) {
    let selfClass = this;

    socket.on('marker', function (data) {
      if(DEV) {
        let d = new Date();
        console.log('New message received on ' + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds());
        console.log('received data: ' + JSON.stringify(data));
      }
      selfClass.showElem(data);
    });
  }

  /**
   * Set values from socket to elements, add there to window and show window
   *
   * @param data
   */
  showElem(data) {

    let elem = document.getElementById('logger');
    let header = document.createElement('h1');
    header.innerHTML = data.header || "";
    let content = document.createElement('p');
    content.innerHTML = data.message || "Empty message";

    let selfClass = this;
    this.setupClass.setVisible();
    selfClass.setupClass.setVisible();
    if((typeof elem.childNodes.forEach) === 'function') {

      elem.childNodes.forEach(function (sub, i) {

        if(elem.childNodes[i].className === 'text-place') {

          let textPlace = elem.childNodes[i];
          textPlace.innerHTML = "";

          textPlace.appendChild(header);
          textPlace.appendChild(content);

          selfClass.setupClass.linksListener();
          selfClass.setupTimeout(textPlace);
        }
      });
    }
  }

  /**
   * Set up timeout to close window. If timeout already exists, clear it;
   *
   * @param node
   * @param hide
   * @param time
   * @returns {number|*}
   */
  setupTimeout(node, hide = true, time = 5000) {
    let selfClass = this;

    if(this.timeoutId !== undefined) {
      selfClass.win.window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = selfClass.win.window.setTimeout(function () {
      node.innerHTML = "";
      if(hide) {
        selfClass.setupClass.setInvisible();
      }
    }, time);

    return this.timeoutId;
  }
}

class setupWindow {

  constructor() {
    this.win = nw.Window.get();
    let win = this.win;

    let selfClass = this;
    win.on('close', function () {
      selfClass.setInvisible();
    }).on('loaded', function () {
      this.setShowInTaskbar(true);
    });
    this.windowPosition();

    return this;
  }

  windowPosition() {
    nw.Screen.Init();
    let win = this.win;

    if(win.width > nw.Screen.screens[0].work_area.width) {
        win.width = nw.Screen.screens[0].work_area.width;
    }
  }

  /**
   * Add EventListener for all links
   */
  linksListener() {

    let links = this.win.window.document.getElementsByTagName('a');
    let linkNames = Object.getOwnPropertyNames(links);
    linkNames.forEach(function (el, i) {
      let link = links[i];
      link.addEventListener('click', function (ev) {
        ev.preventDefault();
        opn(link.getAttribute('href'));
      });
    });
  }

  setVisible() {
    let win = this.win;
    win.setShowInTaskbar(true);
    win.show();
  }

  setInvisible(time = 500) {
    let win = this.win;
    win.setShowInTaskbar(false);
    win.hide();
  }

}

// let gui = require('nw.gui');
// let menu = new gui.Menu();

if(DEV) { new devOptions(); }
new socketClient().connect();
new appMenu();
new setupWindow();

// /*
if(DEV) {
  let path = "./";
  let fs = require("fs");
  let reloadWatcher=fs.watch(path, function() {
    location.reload();
    reloadWatcher.close();
  });
}
// */
