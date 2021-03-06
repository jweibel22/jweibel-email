var Promise = require('promise');
var request = require('request');
var ServiceErrors = require('./../../core/src/serviceErrors')
var logger = require('logfmt');

//dispatches emails over HTTP. The send method will either fulfill its promise or reject it with ServiceUnavailable or BadRequest
function HttpEmailDispatcher(provider) {
    this.provider = provider;
}

function MapServiceError(response, error) {
    switch (response.statusCode) {
        case 400: //BAD REQUEST
        case 413: //PAYLOAD TOO LARGE
            return new ServiceErrors.BadRequest(error);
        default:
            return new ServiceErrors.ServiceUnavailable(error)
    }
}

function LogResponse(provider, response, error) {
    switch (response.statusCode) {
        case 400: //BAD REQUEST
        case 413: //PAYLOAD TOO LARGE
            logger.log({ type: 'error', msg: 'Received Bad Request from provider ' + provider.name + '. Please make sure that our validation rules are at least as strong as the rules of all email providers!'});
            break;
        case 401: //UNAUTHORIZED
            logger.log({ type: 'error', msg: 'No longer authorized with provider ' + provider.name}); //we need to get authorized or remove the provider from our service
            break;
        case 403: //FORBIDDEN
        case 404: //NOT FOUND
        case 405: //METHOD NOT ALLOWED
            logger.log({ type: 'error', msg: 'Request not allowed. Check that API from provider ' + provider.name + ' has not changed!'}); //we need to fix this or remove the provider from our service
            break;
        case 429: //TOO MANY REQUESTS
            logger.log({ type: 'error', msg: 'Too many requests to provider ' + provider.name + '. Is the rateLimit in our configuration correct?'}); //we need to get authorized or remove the provider from our service
            break;
        default:

    }
}

HttpEmailDispatcher.prototype.ping = function () {
    var self = this;

    return new Promise(function (fulfill, reject) {
        request.post(self.provider.pingRequest,
            function (error, response) {
                if (response && response.statusCode == self.provider.expectedPingStatus) {
                    fulfill();
                }
                else {
                    reject(new ServiceErrors.ServiceUnavailable(error));
                }
            }
        );
    });

}

HttpEmailDispatcher.prototype.send = function (email) {

    var self = this;

    return new Promise(function (fulfill, reject) {

        var req = self.provider.sendEmailRequest(email);
        req.time = true;

        request.post(req,
            function (error, response, body) {

                if (!response) {
                    reject(new ServiceErrors.ServiceUnavailable(error));
                }

                if (response.statusCode == 202 || response.statusCode == 200) {
                    fulfill({
                        elapsedTime: response.elapsedTime
                    });
                }
                else {
                    LogResponse(self.provider, response, error);
                    reject(MapServiceError(response, error));
                }
            }
        );
    });
};

module.exports = HttpEmailDispatcher