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
mainWindow.on('loaded', function () {
  new setupWindow().setVariables().checkConnection().testNotify();
})

let DEV = false;
if((typeof nw.App.fullArgv.forEach) === 'function') {
  nw.App.fullArgv.forEach(function (elem) {
    if(elem === '--debug') { DEV = true; }
  })
}

class setupWindow {

  constructor() {
    this.win = mainWindow;
    let win = this.win;

    let selfClass = this;

    win.on('close', function () {
      selfClass.setInvisible();
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
      new notifyWindowGenerator(config.check.icon, config.check.header, config.check.text)
    });

    return this;
  }

  setVariables() {
    let win = this.win;
    let fieldsValues = setupWindow.setVal(config, 'config');
    if(DEV) process.stdout.write(`\n\nField names: ` + JSON.stringify(fieldsValues) + `\n\n`);

    if((typeof fieldsValues.forEach) === 'function') {

      fieldsValues.forEach(function (field) {

        win.window.$("#" + field.name)
          .on('change', function () {
            if(!win.window.$('.mdl-textfield').hasClass('is-invalid'))
              configFactoryClass.saveConfig();
          })
          .val(field.value).attr('required', 1)
          .parents('.mdl-textfield').addClass('is-dirty');
      })
    }

    return this;
  }

  static setVal(object, prefix = 'config', names = []) {
    let fields = Object.getOwnPropertyNames(object);
    fields.forEach(function (item) {

      if((typeof object[item]) === 'string') {
        let targetname = prefix + '_' + item;
        if(prefix !== 'config') {
          targetname = 'config_' + prefix + '_' + item;
        }
        names.push({name: targetname, value: object[item]})
      } else {
        setupWindow.setVal(object[item], item, names);
      }
    });

    return names;
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

    return this;
  }

  setVisible() {
    let win = this.win;
    win.setShowInTaskbar(true);
    win.show();

    return this;
  }

  setInvisible() {
    let win = this.win;
    win.setShowInTaskbar(false);
    win.hide();

    return this;
  }

}

class devOptions {

  constructor() {
    this.win = mainWindow;
    this.devInit();
    process.stdout.write('Process on' + `\n`);
    process.on('exit', function () {
      process.stdout.write(`\nProcess exit event\n`);
    });
    process.on('SIGINT', function () {
      process.stdout.write(`\nProcess SIGINT event\n`);
    });
    process.on('SIGTERM', function () {
      process.stdout.write(`\nProcess SIGTERM event\n`);
    });
    process.on('SIGHUP', function () {
      process.stdout.write(`\nProcess SIGHUP event\n`);
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
      let doWrite = false;
      let readedConfig = require(this.configFile);
      let defaultConfig = this.config;
      let configFields = Object.getOwnPropertyNames(defaultConfig);
      configFields.forEach(function (field) {
        if((typeof readedConfig[field]) === 'undefined') {
          readedConfig[field] = defaultConfig[field];
          doWrite = true;
        }
      });
      this.config = readedConfig;
      if(doWrite) this.writeFile(readedConfig);
      if(DEV) process.stdout.write("App config fields is " + JSON.stringify(this.config) + `\n`);

    } else {
      this.writeFile(this.config);
      new setupWindow().setVisible();
    }

    return this;
  }

  writeFile(config = {}) {
    if(Object.getOwnPropertyNames(config).length <= 0) config = this.config;

    let fs = require('fs');
    let file = this.configFile;
    fs.writeFileSync(this.configFile, JSON.stringify(config), (err) => {
      if(err) throw err;
      if(DEV) process.stdout.write('file saved to ' + this.configFile);
    });

    if((typeof mainWindow.window.document.querySelector) === 'function') {
      let snackbar = mainWindow.window.document.querySelector("#snackbar-main");
      if(snackbar) {
        mainWindow.window.document.querySelector("#snackbar-main").MaterialSnackbar.showSnackbar({
          message: "Config saved",
          timeout: 2000
        });
      }
    }
    this.config = config;

    return true;
  }

  saveConfig() {
    let newConfig = config;
    let $ = mainWindow.window.$;
    $('input, select, textarea').each(function (index, object) {
      let id = $(object).attr('id');
      let value = $(object).val();
      let split = id.split('_').splice(1);
      configFactory.setValues(split, value, false, newConfig);

    });
    config = newConfig;

    if(DEV) process.stdout.write("New config is " + JSON.stringify(config) + `\n`);
    new setupWindow().checkConnection();
    this.writeFile(config);
  }

  static setValues(array, val, to = false, object = {}) {

    array.forEach(function (el, i, arr) {
      if(i+1 === arr.length) {
        if(!to) {
          object[el] = val
        } else {
          if(object.hasOwnProperty(to)) { object[to][el] = val; } else { object[to] = {}; object[to][el] = val; }
        }
      } else {
        configFactory.setValues(arr.splice(1), val, el, object)
      }
    });

    return object;
  }

  static defaultConfig() {
    return {
      protocol: 'http',
      server: 'localhost',
      port: '8080',
      events: ["marker"],
      check: {
        icon: "notifications_active",
        header: "Hello, world!",
        text: "Here is a text with <a href=\"https://google.com\">link</a>, which will open in a system default browser"
      }
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
    this.connect();
    return this;
  }

  /**
   * Connect to websocket
   */
  connect() {
    if(DEV) process.stdout.write(`Connection started\n`);
    let io = require('socket.io-client');

    let address = config.protocol + "://" + config.server + ':' + config.port;
    let socket = io.connect(address);
    let patch = require('socketio-wildcard')(io.Manager);
    patch(socket);

    socket.on('*', function (e) {
      if(DEV) process.stdout.write('Wildcard event JSON: ' + JSON.stringify(e) + `\n`);

    }).on('connect', function () {
      if(DEV) process.stdout.write(`Socket connected to ` + address + `\n`);
      systemTray.icon = 'img/ic_notifications_black_24dp/web/ic_notifications_black_24dp_1x.png'

    }).on('connect_failed', function () {
      if(DEV) process.stdout.write(`Connection to ` + address + ` failed\n`);
      systemTray.icon = 'img/ic_notifications_off_black_24dp/web/ic_notifications_off_black_24dp_1x.png'

    }).on('disconnect', function () {
      if(DEV) process.stdout.write(`Disconnect from ` + address + ` \n`);
      systemTray.icon = 'img/ic_notifications_off_black_24dp/web/ic_notifications_off_black_24dp_1x.png'
    });

    this.receive(socket);
  }

  /**
   * Add listener to socket
   *
   * @param socket
   */
  receive(socket) {
    config.events.forEach(function (el) {
      socket.on(el, function (data) {
        if(DEV) {
          let d = new Date();
          process.stdout.write('New message received on ' + el + ' in ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ": " + JSON.stringify(data) + `\n`);
          new notifyWindowGenerator(data.icon || false, data.header || "Notify from " + config.server, data.message || "(empty)", data.timeout || 15000)
        }
      });
    })
  }
}

if(DEV) { new devOptions(); }

new socketClient();

let existNotificationWindow = false;

/**
 * Generate notification window
 */
class notifyWindowGenerator {

  constructor (icon = config.check.icon, title = config.check.header, text = config.check.text, timeout = 15000) {

    nw.Screen.Init();
    nw.Window.open('notification.html', {
      resizable: false,
      show: false,
      new_instance: false,
      width: 400,
      height: 100,
      show_in_taskbar: true,
      visible_on_all_workspaces: true,
      transparent: false,
      frame: false,
      x: nw.Screen.screens[0].work_area.width - 400,
      y: 60,
      always_on_top: true
    }, function (win) {

      notifyWindowGenerator.open(win);
      win.on('loaded', function () {

        if((typeof existNotificationWindow.y) !== 'undefined' && (typeof existNotificationWindow.height) !== 'undefined') {
          win.y = existNotificationWindow.y + existNotificationWindow.height + 20;
        }
        existNotificationWindow = win;

        if(parseInt(timeout) > 0) {
          existNotificationWindow.window.setTimeout(function () {
            notifyWindowGenerator.close(win);
            existNotificationWindow = false;
          }, parseInt(timeout));
        }
        new notifyGenerator(win, icon, title, text);
      });
    });
  }

  static open(window) {
    window.show();
  }

  static close(window) {
    existNotificationWindow = false;
    window.close();
  }
}

/**
 * Generate a Html elements for notification window
 */
class notifyGenerator {

  constructor (window, icon = false, title, text) {
    let domWindow = window.window;
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
    });
    $("#closeButton").on('click', function () {
      notifyWindowGenerator.close(window);
    })
    let body = $('body');
    if(body.height() > window.height) window.height = (body.height + 5);
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
