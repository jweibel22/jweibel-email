var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var RateLimiter = require('../src/rateLimiter');
var EmailProviderProxy = require('../src/emailProviderProxy');
var EmailDispatcherMock = require('./mocks/emailDispatcherMock');
var ResilientEmailDispatcher = require('../src/resilientEmailProvider');

var email = {};

describe('Rate limit', function() {
    it('rate limitting works', function() {

        var numIterations = 5;

        this.timeout((numIterations+1)*1000);

        var provider = new RateLimiter(1, new ResilientEmailDispatcher(0, new EmailDispatcherMock("Provider", function (fulfill, reject) { fulfill({ elapsedTime: 0}); })));

        var uut = new EmailProviderProxy([provider]);
        uut.initialize();

        var start = process.hrtime();

        var p = uut.send(email);
        for (var i=0; i<numIterations-1; i++) {
            p = p.then(function() { return uut.send(email); });
        }
        p = p.then(function() {
            var secondsElapsed = process.hrtime(start)[0];
            return secondsElapsed; });

        return expect(p).to.eventually.be.above(numIterations-2);
    });
});
