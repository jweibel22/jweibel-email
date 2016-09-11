var jackrabbit = require('jackrabbit');
var logger = require('logfmt');
var Promise = require('promise');
var config = require('../config')
var request = require('request');

logger.log({ type: 'info', msg: 'worker starting up', service: 'rabbitmq' });

var rabbit = jackrabbit(config.rabbitUrl)
    .on('connected', function() {
        logger.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });

        var exchange = rabbit.default();
        var queue = exchange.queue({name: config.queueName, durable: true, prefetch: 5 });
        queue.consume(onMessage, { noAck: false });
    })
    .on('error', function(err) {
        logger.log({ type: 'error', msg: err, service: 'rabbitmq' });
        //TODO: what to do?
    })
    .on('disconnected', function() {
        logger.log({ type: 'error', msg: 'disconnected', service: 'rabbitmq' });
        shutdown(); //TODO: Try to re-establish connection
    });

var onMessage = function(msg, ack) {

    logger.log({ type: 'info', msg: 'handling email', queue: config.queueName, id: msg.id });
    processEmail(msg.Id, msg.email).then(onSuccess, onError);

    function onSuccess() {
        logger.log({ type: 'info', msg: 'handler completed', status: 'success', id: msg.id});
        ack();
    }

    function onError() {
        logger.log({ type: 'info', msg: 'handler completed', status: 'failure', id: msg.id });
        //TODO: we need to pause consuming messages until the email providers are back online
    }
};

process.on('SIGTERM', shutdown);

var processEmail = function(id, email) {
    return new Promise(function (fulfill, reject) {

        //TODO: this belongs in Mapper module
        var dto = {
            personalizations: [
                {
                    to: [
                        {
                            email: email.to
                        }
                    ],
                    subject: email.subject
                }
            ],
            from: {
                email: email.from
            },
            content: [
                {
                    type: "text/plain",
                    value: email.body
                }
            ]
        };

        request.post({
                json: dto,
                url: 'https://api.sendgrid.com/v3/mail/send',
                headers: {'Authorization': "Bearer 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"}
            },
            function (error, response, body) {
                if (!error && response.statusCode == 202) {
                    console.log('email was sent');
                    fulfill();
                }
                else {
                    console.log("Error " + response.statusCode);
                    console.log('email was not sent');
                    reject(error);
                }
            }
        );
    });
};

function shutdown() {
    logger.log({ type: 'info', msg: 'shutting down' });
    process.exit();
}

