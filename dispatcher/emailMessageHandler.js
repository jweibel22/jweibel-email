var logger = require('logfmt');

module.exports = function(dispatcher) {

    return {
        onMessage: function (msg, ack, nack) {

            try {
                logger.log({type: 'debug', msg: 'handling email', queue: config.queueName, id: msg.id});
                dispatcher.send(msg.email).then(onSuccess, onError);
            }
            catch (e) {
                logger.log({type: 'debug', msg: e, status: 'failure', id: msg.id});
                nack();
            }

            function onSuccess() {
                logger.log({type: 'debug', msg: 'handler completed', status: 'success', id: msg.id});
                ack();
            }

            function onError(error) {

                if (error instanceof ServiceErrors.BadRequest) {
                    ack(); //we need to ack this email, we're simply unable to dispatch it :-(
                    //TODO: forward these message to a poison queue for manual inspection/retry
                }
                else {
                    logger.log({type: 'error', msg: 'handler completed', status: 'failure', id: msg.id});
                    nack();  //reject so that the email is returned to the rabbitmq queue
                }
            }
        }
    }
};
