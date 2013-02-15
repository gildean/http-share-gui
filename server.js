module.exports = function (secure, port, path, auth, nodirlists, logs) {
    var connect = require('connect'),
        app = connect(),
        fs = require('fs'),
        usr, Server, options;
    if (secure && secure.key && secure.cert) {
        options = {
            key: fs.readFileSync(secure.key),
            cert: fs.readFileSync(secure.cert)
        };
        Server = require('https').createServer(options, app).listen(port);
    } else {
        Server = require('http').createServer(app).listen(port);
    }

    // we need to wait for one tick before emitting events, so that the Server is actually returned first
    if (auth) {
        usr = auth.split(':');
        app.use(connect.basicAuth(usr[0], usr[1]));
        process.nextTick(function () {
            Server.emit('authed');
        });
    }
    
    if (logs) {
        var logFile = fs.createWriteStream(logs, { flags: 'a' });
        app.use(connect.logger({stream: logFile}));
    }

    // static middleware handles reqs (also for favicons)first, the favicon-middleware is a fallback
     app.use(connect.static(path))
        .use(connect.favicon(__dirname + '/content/favicon.ico'));
    
    // the directorylistings are created unless explicitly disabled
    if (!nodirlists) {
        app.use(connect.directory(path));
    } else {
        process.nextTick(function () {
            Server.emit('nodirlists');
        });
    }
    
    // a fallback response for everything that falls through
    app.use(function (req, res) {
        res.writeHead(418, {'Content-Type': 'text/html'});
        res.end('<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8">\n    <title>http-share</title>\n  </head>\n    <body>\n    <h1 style="font-size:1100%;color:#696969;position:fixed;bottom:0;left:0;padding:0;margin:0">☕<i style="font:italic 42% Georgia, Times, serif;">On a coffeebreak...</i></h1>\n  </body>\n</html>\n');
    });
    return Server;
};
