var ServiceErrors = require('./serviceErrors')
var logger = require('logfmt');
var events = require('events');

var reasonableRequestInFlightDuration = 30000;
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
    var checkConnectionsInterval = 6*1000;

    for(var i=0;i<this.providers.length; i++) {
        var provider = this.providers[i];

        //TODO: adding new properties/methods to external objects, good idea, no???
        provider.setAvailable = function(available) {

            if (this.available != available) {
                logger.log({type: 'info', msg: 'service ' + this.name + ' is ' + (available ? "Up" : "Down")}); //so we can later gather statistics from the log
            }
            this.available = available;

            if (!available) {
                var numberOfAvailable = self.providers.filter(function (p) { return p.available; }).length;

                if (numberOfAvailable <= errorTolerance) {
                    logger.log({ type: 'error', msg: 'less than ' + (errorTolerance+1) + ' providers are available'});
                }
                else if (numberOfAvailable <= warnTolerance) {
                    logger.log({ type: 'warn', msg: 'less than ' + (warnTolerance+1) + ' providers are available'});
                }
            }

            refreshAvailable();
        }

        provider.setAvailable(true);
    }

    function refreshAvailable() {
        var isAvailable = self.providers.filter(function (p) { return p.available; }).length > 0;

        if (!self.available && isAvailable) {
            self.eventEmitter.emit('connected');
        }
        else if (self.available && !isAvailable) {
            self.eventEmitter.emit('disconnected');
        }

        self.available = isAvailable;
    }

    function setTokens() {
        for(var i=0;i<self.providers.length; i++) {
            self.providers[i].tokens = self.providers[i].maxRatePerSecond/2; //ensure that at any given moment no more than maxRatePerSecond requests has been issued during the last 1000 ms
        }
    }

    function checkConnections() {
        for(var i=0; i<self.providers.length; i++) {
            var provider = self.providers[i];

            if (!provider.available) {
                provider.dispatcher.ping().then(function() { provider.setAvailable(true); }, function() { provider.setAvailable(false); })
            }
        }
    }

    setTokens();

    setInterval(function(){ checkConnections(); }, checkConnectionsInterval);
    setInterval(function(){ setTokens(); }, 1000);
}

EmailProviderProxy.prototype.send = function(email) {

    var self = this;

    function getEmailProvider() {

        var availableProviders = self
            .providers
            .sort(function(a,b) { return a.priority - b.priority;})
            .filter(function (p) { return p.available; });

        if (availableProviders.length == 0) {
            return null;
        }
        else {
            return availableProviders[0]; //no load balancing supported, just find the first available
        }
    };



    return new Promise(function (fulfill, reject) {

        function sendWhenReady() {

            var provider = getEmailProvider();

            if (provider == null) {
                reject(new ServiceErrors.ServiceUnavailable("No providers are available"));
                return;
            }

            if (provider.tokens <= 0) {
                setTimeout(sendWhenReady, 50);
            }
            else {

                provider.tokens -= 1;

                provider.dispatcher.send(email).then(function(stats) {

                    if (stats.elapsedTime > reasonableRequestInFlightDuration) {
                        logger.log({ type: 'warn', msg: 'provider ' + provider.name + ' is slow. Consider changing priorities?'});
                        provider.setAvailable(false); //be nice, by setting it to unavailable for a while
                        fulfill();
                    }
                    else {
                        provider.setAvailable(true);
                        fulfill();
                    }
                    },
                    function(error) {

                        if (error instanceof ServiceErrors.BadRequest) {

                        }
                        else if (error instanceof ServiceErrors.ServiceUnavailable) {
                            provider.setAvailable(false);
                        }
                        else {
                            logger.log({ type: 'error', msg: 'unexpected error', error: error });
                        }
                        reject(error);
                    });
            }
        };

        sendWhenReady();
    });


};

module.exports = EmailProviderProxy;
