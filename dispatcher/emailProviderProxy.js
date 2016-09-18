var ServiceErrors = require('./serviceErrors')
var logger = require('logfmt');

var reasonableRequestInFlightDuration = 30000;
var warnTolerance = 1;
var errorTolerance = 0;

//delegates email dispatching to a set of providers. Handles fail-over automatically and applies the circuit breaker pattern
function EmailProviderProxy(providers) {

    var checkConnectionsInterval = 6*1000;
    var self = this;
    this.providers = providers;

    for(var i=0;i<providers.length; i++) {
        var provider = providers[i];

        provider.available = true; //TODO: adding new properties/methods to external objects, good idea, no???

        provider.setAvailable = function(available) {
            this.available = available;
            logger.log({ type: 'info', msg: 'service ' + this.name + ' is ' + (available ? "Up" : "Down")}); //so we can later gather statistics from the log

            if (!available) {
                var numberOfAvailable = self.providers.filter(function (p) { return p.available; }).length;

                if (numberOfAvailable <= errorTolerance) {
                    logger.log({ type: 'error', msg: 'less than ' + (errorTolerance+1) + ' providers are available'});
                }
                else if (numberOfAvailable <= warnTolerance) {
                    logger.log({ type: 'warn', msg: 'less than ' + (warnTolerance+1) + ' providers are available'});
                }
            }
        }
    }

    function setTokens() {
        for(var i=0;i<providers.length; i++) {
            providers[i].tokens = providers[i].maxRatePerSecond/2; //ensure that at any given moment no more than maxRatePerSecond requests has been issued during the last 1000 ms
        }
    }

    function checkConnections() {
        for(var i=0; i<providers.length; i++) {
            var provider = providers[i];

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
            throw Error("No available providers");
        }
        else {
            return availableProviders[0]; //no load balancing supported, just find the first available
        }
    };


    var provider = getEmailProvider(); //TODO: throw exception or reject promise??

    return new Promise(function (fulfill, reject) {

        function sendWhenReady() {

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
