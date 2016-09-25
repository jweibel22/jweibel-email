var ServiceErrors = require('./serviceErrors')
var logger = require('logfmt');
var events = require('events');


var warnTolerance = 1;
var errorTolerance = 0;

//delegates email dispatching to a set of providers. Handles fail-over automatically and applies the circuit breaker pattern
function EmailProviderProxy(providers) {
    this.providers = providers;
    this.available = false;
    this.eventEmitter = new events.EventEmitter();
}

EmailProviderProxy.prototype.on = function(event, listener) {
    return this.eventEmitter.on(event, listener);
}

EmailProviderProxy.prototype.initialize = function() {

    var self = this;

    for(var i=0;i<this.providers.length; i++) {
        var provider = this.providers[i];
        provider.on('unavailable', refreshAvailable).on('available', refreshAvailable);
    }

    function refreshAvailable() {

        var numberOfAvailable = self.providers.filter(function (p) { return p.isAvailable(); }).length;

        if (numberOfAvailable <= errorTolerance) {
            logger.log({ type: 'error', msg: 'less than ' + (errorTolerance+1) + ' providers are available'});
        }
        else if (numberOfAvailable <= warnTolerance) {
            logger.log({ type: 'warn', msg: 'less than ' + (warnTolerance+1) + ' providers are available'});
        }

        var isAvailable = numberOfAvailable > 0;

        if (!self.available && isAvailable) {
            self.eventEmitter.emit('connected');
        }
        else if (self.available && !isAvailable) {
            self.eventEmitter.emit('disconnected');
        }

        self.available = isAvailable;
    }

    refreshAvailable();
}

EmailProviderProxy.prototype.send = function(email) {

    var self = this;

    function getEmailProvider() {

        var availableProviders = self
            .providers
            .sort(function(a,b) { return a.priority - b.priority;})
            .filter(function (p) { return p.isAvailable(); });

        if (availableProviders.length == 0) {
            return null;
        }
        else {
            return availableProviders[0]; //no load balancing supported, just find the first available
        }
    };

    return new Promise(function (fulfill, reject) {

        var provider = getEmailProvider();

        if (provider == null) {
            reject(new ServiceErrors.ServiceUnavailable("No providers are available"));
            return;
        }

        provider.send(email).then(function(stats) {
                fulfill();
            },
            function(error) {
                reject(error);
            });
    });
};

module.exports = EmailProviderProxy;
