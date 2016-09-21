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

var configureRoutes = require('./routes/index');
var configureErrorRoutes = require('./routes/error');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var rabbit = jackrabbit(config.rabbitUrl)
    .on('connected', function() {

        log.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });
        var exchange = rabbit.default();
        exchange.queue({name: config.queueName, durable: true, prefetch: 5 });

        configureRoutes(app, exchange);
        configureErrorRoutes(app);
    })
    .on('error', function(err) {
        log.log({ type: 'error', msg: err, service: 'rabbitmq' });
        //TODO: what to do?
    })
    .on('disconnected', function() {
        log.log({ type: 'error', msg: 'disconnected', service: 'rabbitmq' });
        //TODO: what to do?
    });

module.exports = app;
