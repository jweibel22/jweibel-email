var Promise = require('promise');

//A decorator that enables rate limiting of an email provider
function RateLimiter(maxRatePerSecond, emailProvider) {
    var self = this;
    self.tokens = Math.ceil(maxRatePerSecond/2);
    self.emailProvider = emailProvider;
    setInterval(function(){ self.tokens = Math.ceil(maxRatePerSecond/2); }, 1000);
}

RateLimiter.prototype.on = function(event, listener) {
    return this.emailProvider.on(event, listener);
}

RateLimiter.prototype.isAvailable = function() {
    return this.emailProvider.isAvailable();
}

RateLimiter.prototype.getPriority = function() {
    return this.emailProvider.getPriority();
}

RateLimiter.prototype.send = function (email) {

    var self = this;

    return new Promise(function (fulfill, reject) {

        function sendWhenReady() {

            if (self.tokens <= 0) {
                setTimeout(sendWhenReady, 50);
            }
            else {
                self.tokens -= 1;
                self.emailProvider.send(email).then(fulfill, reject);
            }
        };

        sendWhenReady();
    });
};

module.exports = RateLimiter;