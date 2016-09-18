var jackrabbit = require('jackrabbit');
var logger = require('logfmt');
var Promise = require('promise');
var config = require('../config')
var request = require('request');
var uuid = require('node-uuid');
var EmailProviderProxy = require('./emailProviderProxy');
var sendGrid = require('./emailProviders/sendGrid');
var EmailDispatcherMock = require('../tests/mocks/emailDispatcherMock');

logger.log({ type: 'info', msg: 'worker starting up', service: 'rabbitmq' });

var provider = {
    name: "AvailableProvider",
    maxRatePerSecond: 10,
    priority: 0,
    dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 0}); })
}

var dispatcher = new EmailProviderProxy([sendGrid]);

var maxNumberOfParallelInFlightEmails = 5; //TODO: make this configurable or deduct it from the properties of the email providers?

var email = {
    from: "jwe@danskecommodities.com",
    to: "jweibel22@gmail.com",
    subject: "Tester",
    body: "En test mere"
}

var rabbit = jackrabbit(config.rabbitUrl)
    .on('connected', function() {
        logger.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });

        var exchange = rabbit.default();
        var queue = exchange.queue({name: config.queueName, durable: true, prefetch: maxNumberOfParallelInFlightEmails });
        queue.consume(onMessage, { noAck: false });

//        for (var i=0;i<1;i++) {
//            exchange.publish({ id: uuid.v4(), email: email}, {key: 'emails' });
//        }

    })
    .on('error', function(err) {
        logger.log({ type: 'error', msg: err, service: 'rabbitmq' });
        //TODO: what to do?
    })
    .on('disconnected', function() {
        logger.log({ type: 'error', msg: 'disconnected', service: 'rabbitmq' });
        shutdown(); //TODO: Try to re-establish connection
    });

var onMessage = function(msg, ack, nack) {

    try {
        logger.log({ type: 'info', msg: 'handling email', queue: config.queueName, id: msg.id });
        dispatcher.send(msg.email).then(onSuccess, onError);
    }
    catch(e) {
        logger.log({ type: 'info', msg: e, status: 'failure', id: msg.id });
        nack();
    }

    function onSuccess() {
        logger.log({ type: 'info', msg: 'handler completed', status: 'success', id: msg.id});
        ack();
    }

    function onError(error) {

        if (error instanceof ServiceErrors.BadRequest) {
            ack(); //we need to ack this email, we're simply unable to dispatch it :-(
        }
        else {
            logger.log({ type: 'info', msg: 'handler completed', status: 'failure', id: msg.id });
            nack();  //reject so that the email is returned to the rabbitmq queue
            //TODO: we need to pause consuming messages until the email providers are back online
        }
    }
};



