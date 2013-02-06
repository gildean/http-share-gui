var app = module.exports = require('appjs');
var path = require('path');
var fs = require('fs');

process.title = 'Http-Share-Gui'

app.serveFilesFrom(__dirname + '/content');

var menubar = app.createMenu([{
  label:'&File',
  submenu:[
    {
      label:'E&xit',
      action: function(){
        window.close();
      }
    }
  ]
},{
  label:'&Window',
  submenu:[
    {
      label:'Fullscreen',
      action:function(item) {
        window.frame.fullscreen();
      }
    },
    {
      label:'Minimize',
      action:function(){
        window.frame.minimize();
      }
    },
    {
      label:'Maximize',
      action:function(){
        window.frame.maximize();
      }
    },{
      label:''//separator
    },{
      label:'Restore',
      action:function(){
        window.frame.restore();
      }
    }
  ]
}]);

menubar.on('select',function(item){

});

var trayMenu = app.createMenu([{
  label:'Show',
  action:function(){
    window.frame.show();
  },
},{
  label:'Minimize',
  action:function(){
    window.frame.hide();
  }
},{
  label:'Exit',
  action:function(){
    window.close();
  }
}]);

var statusIcon = app.createStatusIcon({
  icon:'./data/content/icons/32.png',
  tooltip:'HTTP-Share',
  menu:trayMenu
});

var window = app.createWindow({
  width  : 615,
  height : 497,
  alpha  : true,
  icons  : __dirname + '/content/icons'
});

window.on('create', function(){
  window.frame.show();
  window.frame.center();
  window.frame.opacity=0.95;
  window.frame.showChrome=0;
  window.frame.setMenuBar(menubar);
});


var httpServer;
var share = null;

window.on('ready', function(){
  window.process = process;
  window.module = module;

  var document = window.document;
  var $ = this.$;
  var startvalue = $('#startvalue');
  var starticon = $('#running');
  var titlebar = $('#titlebar');
  var dirbutton = $('#dirbutton');
  var closebutton = $('#closebutton');
  var minbutton = $('#minbutton');
  var dirlabel = $('#dirlabel');
  var authbutton = $('#authbutton');
  var authselect = $('#authselect');
  var authnotice = $('#authnotice');
  var sslbutton = $('#sslbutton');
  var sslbuttons = $('.sslbuttons');
  var sslselect = $('#sslselect');
  var sslnotice = $('#sslnotice');
  var keynotice = $('#keynotice');
  var certnotice = $('#certnotice');
  var sslicon = $('#sslicon');
  var loggingbutton = $('#loggingbutton');
  var logfilebutton = $('#logfilebutton');
  var loggingnotice = $('#loggingnotice');
  var logfilenotice = $('#logfilenotice');
  var loggingicon = $('#loggingicon');
  var authicon = $('#authicon');
  var portInput = $('#portinput');
  var dirlistbutton = $('#nodirlistbutton');
  var dirlist = $('#dirlist');
  var dirlisticon = $('#dirlisticon');
  var startbutton = $('#startbutton');
  var username = $('#username');
  var password = $('#password');
  var main = $('#main');
  var key = $('#key');
  var cert = $('#cert');
  var defaultDir = process.cwd();
  var logfile = defaultDir + '/logs/log.log';
  var dir = defaultDir;
  var secure = {};

  dirlabel.text(defaultDir);
  $('.auth').prop('disabled', true);

  function openFileDialog(type, title, notice, cb) {
    if (!share) {
      window.frame.openDialog({
          type : type,
          title : title,
          multiSelect: false,
          dirSelect : false
      }, function(err, files) {
        if (!err) {
          files.forEach(function (filePath) {
            cb(null, filePath);
            notice.text(filePath);
          });
        } else {
          cb(err, null);
        }
      });
    } else {
      return false;
    }
  }

  cert.click(function (e) {
    e.preventDefault();
    openFileDialog('open', 'Select certificate .pem', certnotice, function (err, filePath) {
      if (!err) {
        secure.cert = filePath
      }
    });
  });

  key.click(function (e) {
    e.preventDefault();
    openFileDialog('open', 'Select Private Key .pem', keynotice, function (err, filePath) {
      if (!err) {
        secure.key = filePath;
      }
    });
  });

  minbutton.click(function () {
    window.frame.minimize();
  });

  closebutton.click(function () {
    window.close();
  });

  function switchEnabled(el) {
    el.fadeOut(200, function () {
      if ($(this).text() === 'Enabled') {
          $(this).text('Disabled').fadeIn(200);
      } else {
          $(this).text('Enabled').fadeIn(200);
      }
    });
  }

  main.on('click', '.tile', executeAction);

  function executeAction(event) {
    var button = $(event.target).closest('.tile').prop('id');
    var actions = {

      'sslbutton' : function () {
        switchEnabled(sslnotice);
        sslbuttons.toggleClass('bg-color-greenDark');
        sslicon.toggleClass('icon-broadcast').toggleClass('icon-cube');
        sslbutton.toggleClass('bg-color-greenDark');
        sslselect.toggleClass('bg-color-green');
      },

      'loggingbutton' : function () {
        if (loggingnotice.text() === 'Disabled') {
          openFileDialog('save', 'Select log file', logfilenotice, function (err, filePath) {
            if (!err) {
              logfile = filePath;
              loggingicon.toggleClass('icon-none').toggleClass('icon-printer');
              loggingbutton.toggleClass('bg-color-greenDark');
              switchEnabled(loggingnotice);
            }
          });
        } else {
          logfilenotice.text('n/a');
          loggingicon.toggleClass('icon-none').toggleClass('icon-printer');
          loggingbutton.toggleClass('bg-color-greenDark');
          switchEnabled(loggingnotice);
        }
      },

      'dirbutton' : function () {
        window.frame.openDialog({
              type : 'open',
              title : 'Select Shared Directory',
              multiSelect: false,
              dirSelect : true
          }, function(err, files) {
            if (!err) {
              files.forEach(function(filePath) {
                dir = filePath;
              });
              dirlabel.text(dir);
            }
        });
      },

      'nodirlistbutton' : function () {
        dirlistbutton.toggleClass('bg-color-orange');
        dirlisticon.toggleClass('icon-list').toggleClass('icon-checkbox-unchecked');
        switchEnabled(dirlist);
      },

      'authbutton' : function () {
        authbutton.toggleClass('bg-color-orange');
        authselect.toggleClass('bg-color-yellow');
        authicon.toggleClass('icon-unlocked').toggleClass('icon-locked');
        switchEnabled(authnotice);
        if ($('.auth').prop('disabled')) {
          $('.auth').prop('required', true);
          $('.auth').prop('disabled', false);
        } else {
          $('.auth').prop('required', false);
          $('.auth').prop('disabled', true);
        }
      },

      'startbutton' : function () {
        if (!share && portInput.val() !== '' && dir !== '') {
          var secured = (sslnotice.text() === 'Enabled') ? secure : false;
          var directory = (fs.existsSync(dir)) ? (fs.statSync(dir).isDirectory()) ? dir : path.dirname(dir) : defaultDir;
          var port = parseInt(portInput.val());
          var logs = (loggingnotice.text() === 'Enabled') ? logfile : false;
          var authed =  (authnotice.text() === 'Enabled' && password.val() !== '' && username.val() !== '') ? username.val() + ':' + password.val() : null;
          var dirlists = (dirlist.text() === 'Disabled') ? true : false;
          if (!isNaN(port) && port > 0) {
            creatingServer(secured, port, dir, authed, dirlists, logs);
          }
        } else if (share) {
          stopServer();
          starticon.toggleClass('icon-start').toggleClass('icon-stop');
          startbutton.toggleClass('bg-color-red').toggleClass('bg-color-blueDark');
          startvalue.text('Start');
        }
      }

    };

    var buttonClick = actions[button];
    if (button === 'startbutton' || !share && typeof(buttonClick) === 'function') {
      buttonClick();
    }

  }

  titlebar.on('mousedown', function (event) {
    window.frame.drag();
  });

  function F12 (e) {
    return e.keyIdentifier === 'F12';
  }

  function Command_Option_J (e) {
    return e.keyCode === 74 && e.metaKey && e.altKey;
  }

  function creatingServer(secured, port, dir, auth, dirslists, logs) {
    httpServer = require('./server')(secured, port, dir, auth, dirslists, logs);
    httpServer.on('listening', function () {
      starticon.toggleClass('icon-start').toggleClass('icon-stop');
      startvalue.fadeOut(200, function () {
        $(this).text('Stop').fadeIn(200);
        startbutton.toggleClass('bg-color-red').toggleClass('bg-color-blueDark');
      });
      share = true;
    });
  }

  window.addEventListener('keydown', function(e){
    if (F12(e) || Command_Option_J(e)) {
      window.frame.openDevTools();
    }
  });

});

function stopServer() {
  if (httpServer && share) {
    share = null;
    httpServer.close();
  }
}

window.on('close', function(){
  stopServer();
  process.exit();
});
