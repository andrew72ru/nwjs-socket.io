/**
 * Created by andrew on 19.01.17.
 *
 * @link https://github.com/nwjs/nw.js
 *
 */
'use strict';

const opn = require('opn');

let fs = require('fs');
let mainWindow = nw.Window.get();

let DEV = false;
if((typeof nw.App.fullArgv.forEach) === 'function') {
  nw.App.fullArgv.forEach(function (elem) {
    if(elem === '--debug') { DEV = true; }
  })
}
let connected = false;

class setupWindow {

  constructor() {
    this.win = mainWindow;
    let win = this.win;

    let selfClass = this;

    win.on('close', function () {
      selfClass.setInvisible();
    }).on('loaded', function () {
      selfClass.checkConnection();
      selfClass.setVariables();
      selfClass.testNotify();
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

    return this;
  }

  testNotify() {
    $("#notifyCheck").on('click', function () {
      new notifyWindowGenerator('notifications_active', 'Notification title', `Here is a text with <a href="https://google.com">link</a>`)
    });
  }

  setVariables() {

    let fields = configFactory.fieldList();
    let fieldNames = Object.getOwnPropertyNames(fields);
    fieldNames.forEach(function (el, i) {
      let target = $("#" + fields[el]);
      target.val(config[el]).parents('.mdl-textfield').addClass('is-dirty');
      target.on('change', function () {
        configFactoryClass.saveConfig();
      })
    });
  }

  checkConnection() {
    let statusField = $('#statusField');
    let address = config.protocol + "://" + config.server + ':' + config.port;
    statusField.text('Socket on ' + address + ' disconnected').removeClass('mdl-color-text--green').addClass('mdl-color-text--red');

    let socket = require('socket.io-client')(address);

    socket.on('connect', function () {
      statusField.text('Socket on ' + address + ' connected').removeClass('mdl-color-text--red').addClass('mdl-color-text--green');
    }).on('connect_failed', function () {
      statusField.text('Failed to connect socket on ' + address + '').removeClass('mdl-color-text--green').addClass('mdl-color-text--red');
    }).on('disconnect', function () {
      statusField.text('Disconnected from socket on ' + address + '').removeClass('mdl-color-text--green').addClass('mdl-color-text--red');
    }).on('event', function (data) {
      console.log(data);
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

class devOptions {

  constructor() {
    this.win = mainWindow;
    this.devInit();
    process.stdout.write('Process on' + `\n`);
    process.on('exit', function () {
      process.stdout.write('Process exit event' + `\n`);
    });
    process.on('SIGINT', function () {
      process.stdout.write('Process SIGINT event' + `\n`);
    });
    process.on('SIGTERM', function () {
      process.stdout.write('Process SIGTERM event' + `\n`);
    });
    process.on('SIGHUP', function () {
      process.stdout.write('Process SIGHUP event' + `\n`);
    });
  }

  devInit() {
    let win = this.win;
    let selfClass = this;

    win.on('loaded', function () {
      if(win) {
        // win.showDevTools();
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
    let os = require('os');
    let elemId = 'size-helper-elemet';
    let existElement = document.querySelector('#' + elemId);
    if(existElement) {
      document.querySelector('#' + elemId).remove();
    }

    let sizeHelper = document.createElement('div');
    sizeHelper.setAttribute('id', elemId);
    sizeHelper.style.position = 'absolute';
    sizeHelper.style.bottom = '0';
    sizeHelper.style.right = '0';
    sizeHelper.style.fontSize = 'x-small';
    sizeHelper.style.color = '#666';

    let win = this.win;
    let sizeText = document.createTextNode('x: ' + win.x + ', y: ' + win.y + ' (' + os.platform() + ')');
    sizeHelper.appendChild(sizeText);
    if(document.body) {
      document.body.appendChild(sizeHelper);
    }
    return sizeHelper;
  }
}

class configFactory {

  constructor (file = 'config.json') {
    this.config = configFactory.defaultConfig();
    let path = require('path');
    this.configFile = nw.App.dataPath + path.sep + file;
    if(fs.existsSync(this.configFile)) {
      this.config = require(this.configFile);
    } else {
      this.writeFile(this.config);
      new setupWindow().setVisible();
    }

    return this;
  }

  writeFile(config = {}) {
    let fs = require('fs');
    let file = this.configFile;
    fs.writeFileSync(this.configFile, JSON.stringify(config), (err) => {
      if(err) throw err;
      if(DEV) console.log('file saved to ' + this.configFile);
    });

    return true;
  }

  saveConfig() {
    let newConfig = {};
    let fields = configFactory.fieldList();
    let fieldNames = Object.getOwnPropertyNames(fields);
    fieldNames.forEach(function (field) {
      let target = $("#" + fields[field]);
      newConfig[field] = target.val();
    });
    this.writeFile(newConfig);
    config = newConfig;

    new setupWindow().checkConnection();
  }

  static fieldList() {
    return {
      protocol: 'serverProrocol',
      server: 'serverAddress',
      port: 'serverPort'
    };
  }

  static defaultConfig() {
    return {
      protocol: 'http',
      server: 'localhost',
      port: '8080',
    };
  }
}

let configFactoryClass = new configFactory();
let config = configFactoryClass.config;

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

    let testNotify = new nw.MenuItem({
      type: "normal",
      label: "Test notification",
      click: function () {
        new notifyWindowGenerator();
      }
    });

    let exitItem = new nw.MenuItem({
      type: 'normal',
      label: 'Quit from Notifier',
      click: function () {
        nw.App.quit();
      }
    });

    traymenu.append(new nw.MenuItem({ type: 'normal', label: "NOTIFIER MENU", enabled: false }));
    traymenu.append(new nw.MenuItem({ type: 'separator' }));
    traymenu.append(windowShowItem);
    traymenu.append(testNotify);
    traymenu.append(new nw.MenuItem({ type: 'separator' }));
    traymenu.append(exitItem);
    this.tray.menu = traymenu;
  }
}

let systemTray = new appMenu().tray;

class socketClient {

  /**
   * Set up variables:
   * timeoutId - identifier of timer to hide window
   * setupClass - class with window functions
   * win - window
   */
  constructor() {
    this.timeoutId = undefined;
    this.connect();
    return this;
  }

  /**
   * Connect to websocket
   */
  connect() {
    if(DEV) console.log('connection started');
    let io = require('socket.io-client');
    let address = config.protocol + "://" + config.server + ':' + config.port;
    let socket = io.connect(address);
    socket.on('connect', function () {
      systemTray.icon = 'img/ic_notifications_black_24dp/web/ic_notifications_black_24dp_1x.png'
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
        console.log('New message received on ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
        console.log('received data: ' + JSON.stringify(data));
      }
      new notifyWindowGenerator(data.icon || false, data.header || "Notify from " + config.server, data.message || "(empty)", data.timeout || 1500)
    });
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
      node.innerHTML = '';
      if(hide) {
        selfClass.setupClass.setInvisible();
      }
    }, time);

    return this.timeoutId;
  }
}

if(DEV) { new devOptions(); }

new setupWindow();
new socketClient();

/**
 * Generate notification window
 */
class notifyWindowGenerator {

  constructor (icon = false, title = 'Notify Title', text = 'Notification text', timeout = 15000) {
    nw.Screen.Init();
    nw.Window.open('notification.html', {
      resizable: false,
      show: false,
      new_instance: false,
      id: 'notificationWindow',
      width: 400,
      height: 100,
      show_in_taskbar: true,
      visible_on_all_workspaces: true,
      frame: false,
      toolbar: false
    }, function (win) {
      win.width = 400;
      win.height = 100;
      win.x = nw.Screen.screens[0].work_area.width - win.width;
      win.y = nw.Screen.screens[0].work_area.x + nw.Screen.screens[0].work_area.y;
      win.show();

      win.on('loaded', function () {
        if(parseInt(timeout) > 0) {
          win.window.setTimeout(function () {
            win.window.close();
          }, parseInt(timeout));
        }
        new notifyGenerator(win, icon, title, text);
      });
    });
  }
}

/**
 * Generate a Html elements for notification window
 */
class notifyGenerator {

  constructor (window, icon = false, title, text) {
    let domWindow = window.window;
    let console = domWindow.console;
    let $ = domWindow.$;

    let messageBody = $(".message-body");
    if(icon) {
      messageBody.find('.icon-place #notify-icon').text(icon);
    }
    messageBody.find('.text-place').html("<h1>" + title + "</h1><p>" + text + "</p>");
    messageBody.find('a').on('click', function (e) {
      e.preventDefault();
      let link = this;
      nw.Shell.openExternal($(link).attr('href'));
    })
  }
}

/*
 if(DEV) {
 let path = './';
 let fs = require('fs');
 let reloadWatcher=fs.watch(path, function() {
 location.reload();
 reloadWatcher.close();
 });
 }
 // */
