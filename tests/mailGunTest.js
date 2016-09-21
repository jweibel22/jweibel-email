var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var mailGun = require('./mailGun');
var ServiceErrors = require('../dispatcher/serviceErrors')

chai.use(chaiAsPromised);
var expect = chai.expect;

var email = {
    from: "jwe@danskecommodities.com",
    to: "jweibel22@gmail.com",
    subject: "Tester",
    body: "/&%¤#¤%&/?+"
};

describe('Testing Send', function() {
    it('should succeed', function () {
        //TODO: fetch email from inbox and assert on content?
        return expect(mailGun.dispatcher.send(email)).to.eventually.be.fulfilled;
    });
    it('when unauthorized service is unavailable', function () {
        var decorated = mailGun.dispatcher.provider.sendEmailRequest;
        mailGun.dispatcher.provider.sendEmailRequest = function(email) {
            var result = decorated(email);
            result.headers = {'Authorization': "Bearer XXXX"};
            return result;
        };
        return expect(mailGun.dispatcher.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
});