var jackrabbit = require('jackrabbit');
var logger = require('logfmt');
var config = require('../config')
var EmailProviderProxy = require('./emailProviderProxy');
var all = require('../emailProviders/all');
var emailMessageHandlerFactory = require('./emailMessageHandler');

logger.log({ type: 'info', msg: 'worker starting up', service: 'rabbitmq' });

var maxNumberOfParallelInFlightEmails = 5; //TODO: make this configurable or deduct it from the properties of the email providers?

function startProcessing(queue) {
    var dispatcher = new EmailProviderProxy(all.providers);
    var messageHandler = emailMessageHandlerFactory(dispatcher);

    dispatcher
        .on('connected', function() {
            queue.consume(messageHandler.onMessage, { noAck: false });
            logger.log({ type: 'info', msg: 'consuming started' });
        })
        .on('disconnected', function() {
            queue.cancel();
            logger.log({ type: 'info', msg: 'consuming cancelled' });
        });

    dispatcher.initialize();
}

function shutdown() {
    logger.log({ type: 'info', msg: 'shutting down' });
    process.exit();
}

var rabbit = jackrabbit(config.rabbitUrl)
    .on('connected', function() {
        logger.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });
        var exchange = rabbit.default();
        var queue = exchange.queue({name: config.queueName, durable: true, prefetch: maxNumberOfParallelInFlightEmails });
        startProcessing(queue);
    })
    .on('error', function(err) {
        logger.log({ type: 'error', msg: err, service: 'rabbitmq' });
        //TODO: what to do?
    })
    .on('disconnected', function() {
        logger.log({ type: 'error', msg: 'disconnected', service: 'rabbitmq' });
        shutdown(); //TODO: Try to re-establish connection
    });

