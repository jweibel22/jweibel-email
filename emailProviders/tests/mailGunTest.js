var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var mailGun = require('../src/mailGun');
var ServiceErrors = require('../../core/src/serviceErrors')

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
        return expect(mailGun.provider.send(email)).to.eventually.be.fulfilled;
    });
    it('when unauthorized service is unavailable', function () {
        var decorated = mailGun.provider.emailProvider.dispatcher.provider.sendEmailRequest;
        mailGun.provider.emailProvider.dispatcher.provider.sendEmailRequest = function(email) {
            var result = decorated(email);
            result.headers = {'Authorization': "Bearer XXXX"};
            return result;
        };
        return expect(mailGun.provider.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
});