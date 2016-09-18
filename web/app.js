var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jackrabbit = require('jackrabbit');
var log = require('logfmt');
var config = require('./../config');
var util = require('util');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var rabbit = jackrabbit(config.rabbitUrl)
    .on('connected', function() {
        log.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });
        var exchange = rabbit.default();
        exchange.queue({name: config.queueName, durable: true, prefetch: 5 });
        mapRoutes(app, exchange);
    })
    .on('error', function(err) {
        log.log({ type: 'error', msg: err, service: 'rabbitmq' });
        //TODO: what to do?
    })
    .on('disconnected', function() {
        log.log({ type: 'error', msg: 'disconnected', service: 'rabbitmq' });
        //TODO: what to do?
    });

function mapRoutes(app, exchange) {

require('./routes/index')(app, exchange);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);

        if (req.method == 'GET') {
            res.send(util.format('<html> <body><h1>%s</h1><h2>%s</h2><pre>%s</pre></body></html>',  err.message, err.status, err.stack));
        }
        else {
        }
        res.send(JSON.stringify(err, ["message", "stack", "status"]));
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);

    if (req.method == 'GET') {
        res.send(util.format('<html> <body><h1>%s</h1></body></html>',  err.message));
    }
    else {
        res.send(JSON.stringify(err, ["message"]));
    }
});
};

module.exports = app;
