var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var sendGrid = require('./sendGrid');
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
        return expect(sendGrid.dispatcher.send(email)).to.eventually.be.fulfilled;
    });
    it('when unauthorized service is unavailable', function () {
        var decorated = sendGrid.dispatcher.provider.sendEmailRequest;
        sendGrid.dispatcher.provider.sendEmailRequest = function(email) {
            var result = decorated(email);
            result.headers = {'Authorization': "Bearer XXXX"};
            return result;
        };
        return expect(sendGrid.dispatcher.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
    it('empty subject gives BadRequest', function () {
        email.subject = "";
        return expect(sendGrid.dispatcher.send(email)).to.eventually.be.rejectedWith(ServiceErrors.BadRequest);
    });
});