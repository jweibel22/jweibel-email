var ServiceErrors = require('./serviceErrors')
var logger = require('logfmt');
var events = require('events');

var reasonableRequestInFlightDuration = 30000;

//Implements an email provider that is able to auto heal if it goes unavailable
function ResilientEmailProvider(priority, dispatcher) {

    var checkConnectionsInterval = 6 * 1000;
    var self = this;
    this.dispatcher = dispatcher;
    this.priority = priority;
    this.available = true;
    this.eventEmitter = new events.EventEmitter();

    function checkConnections() {

        if (!self.available) {
            dispatcher
                .ping()
                .then(function () { self.setAvailable(true); }, function (error) { self.setAvailable(false); });
        }

        setInterval(function () {
            checkConnections();
        }, checkConnectionsInterval);
    }
}

ResilientEmailProvider.prototype.on = function(event, listener) {
    return this.eventEmitter.on(event, listener);
}

ResilientEmailProvider.prototype.setAvailable = function(available) {

    if (this.available != available) {

        this.available = available;

        logger.log({type: 'info', msg: 'service ' + this.dispatcher.name + ' is ' + (available ? "Up" : "Down")}); //so we can later gather statistics from the log

        if (!available) {
            this.eventEmitter.emit('unavailable');
        }
        else if (available) {
            this.eventEmitter.emit('available');
        }
    }
    else {
        this.available = available;
    }

}

ResilientEmailProvider.prototype.isAvailable = function() {
    return this.available;
}

ResilientEmailProvider.prototype.getPriority = function() {
    return this.priority;
}

ResilientEmailProvider.prototype.send = function(email) {

    var self = this;

    return new Promise(function (fulfill, reject) {

    self.dispatcher
        .send(email)
        .then(function(stats) {

            if (stats.elapsedTime > reasonableRequestInFlightDuration) {
                logger.log({ type: 'warn', msg: 'provider ' + self.dispatcher.name + ' is slow. Consider changing priorities?'});
                self.setAvailable(false); //be nice, by setting it to unavailable for a while
            }
            else {
                self.setAvailable(true);
            }
            fulfill();
        },
        function(error) {

            if (error instanceof ServiceErrors.BadRequest) {

            }
            else if (error instanceof ServiceErrors.ServiceUnavailable) {
                self.setAvailable(false);
            }
            else {
                logger.log({ type: 'error', msg: 'unexpected error', error: error });
            }

            reject(error);
        });

})
};


module.exports = ResilientEmailProvider;
