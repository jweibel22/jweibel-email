var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var sinon = require('sinon');

chai.use(chaiAsPromised);

var expect = chai.expect;
var should = chai.should();

var ServiceErrors = require('../dispatcher/serviceErrors')
var EmailProviderProxy = require('../dispatcher/emailProviderProxy');
var EmailDispatcherMock = require('./mocks/emailDispatcherMock');

var availableProvider = {
    name: "AvailableProvider",
    maxRatePerSecond: 10,
    priority: 0,
    dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 0}); })
};

var unavailableProvider = {
    name: "UnavailableProvider",
    maxRatePerSecond: 10,
    priority: 0,
    dispatcher: new EmailDispatcherMock(function (fulfill, reject) { reject(new ServiceErrors.ServiceUnavailable()); })
};

var badRequestProvider = {
    name: "BadRequestProvider",
    maxRatePerSecond: 10,
    priority: 0,
    dispatcher: new EmailDispatcherMock(function (fulfill, reject) { reject(new ServiceErrors.BadRequest()); })
};

var email = {};

describe('Availability', function() {
    it('should succeed when provider is available', function() {
        var uut = new EmailProviderProxy([availableProvider]);
        return expect(uut.send(email)).to.eventually.be.fulfilled;
    });
    it('should succeed if a low priority unavailable provider exists', function() {
        unavailableProvider.priority = 1;
        availableProvider.priority = 0;
        var uut = new EmailProviderProxy([availableProvider, unavailableProvider]);
        return expect(uut.send(email)).to.eventually.be.fulfilled;
    });
    it('should fail when provider is unavailable', function() {
        var uut = new EmailProviderProxy([unavailableProvider]);
        return expect(uut.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
    it('should fail when no providers exist', function() {
        var uut = new EmailProviderProxy([]);
        var fn = function () { uut.send(email); }
        expect(fn).to.throw(Error)
    });
});

describe('Fail-over', function() {
    it('first call fails on fail-over', function() {
        unavailableProvider.priority = 0;
        availableProvider.priority = 1;
        var uut = new EmailProviderProxy([availableProvider, unavailableProvider]);
        return expect(uut.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
    it('second call succeeds on fail-over', function() {
        unavailableProvider.priority = 0;
        availableProvider.priority = 1;
        var uut = new EmailProviderProxy([availableProvider, unavailableProvider]);
        var firstCall = uut.send(email);
        var secondCall = firstCall.then(function() {},  function(error) { return uut.send(email); });
        return Promise.all([firstCall.should.eventually.be.rejected, secondCall.should.eventually.be.fulfilled]);
    });
    it('no fail-over on malformed email', function() {
        badRequestProvider.priority = 0;
        availableProvider.priority = 1;
        var uut = new EmailProviderProxy([badRequestProvider, availableProvider]);
        var firstCall = uut.send(email);
        var secondCall = firstCall.then(function() {},  function(error) { return uut.send(email); });
        return Promise.all([firstCall.should.eventually.be.rejectedWith(ServiceErrors.BadRequest),
                            secondCall.should.eventually.be.rejectedWith(ServiceErrors.BadRequest)]);
    });
    it('fail-over on slow provider', function() {
        var slow = {
            name: "Slow",
            maxRatePerSecond: 10,
            priority: 0,
            dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 100000}); })
        };
        var fast = {
            name: "Fast",
            maxRatePerSecond: 10,
            priority: 1,
            dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 0}); })
        };
        var slowDispatch = sinon.spy(slow.dispatcher, 'send');
        var fastDispatch = sinon.spy(fast.dispatcher, 'send');
        var uut = new EmailProviderProxy([slow, fast]);
        return expect(uut.send(email)
            .then(function() { return uut.send(email);})
            .then(function() {
                sinon.assert.calledOnce(slowDispatch);
                sinon.assert.calledOnce(fastDispatch);
            }))
            .to.eventually.be.fulfilled;
    });
});

describe('Testing validation', function() {

    //empty email
    //missing email adresses
    //invalid email addresses
});

describe('Prioritization', function() {
    it('providers are prioritized', function() {
        var high = {
            name: "HighPriority",
            maxRatePerSecond: 10,
            priority: 0,
            dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 0}); })
        };
        var low = {
            name: "LowPriority",
            maxRatePerSecond: 10,
            priority: 1,
            dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 0}); })
        };
        var highDispatch = sinon.spy(high.dispatcher, 'send');
        var lowDispatch = sinon.spy(low.dispatcher, 'send');
        var uut = new EmailProviderProxy([low, high]);
        return expect(uut.send(email)
            .then(function() {
                sinon.assert.calledOnce(highDispatch);
                sinon.assert.notCalled(lowDispatch); }))
            .to.eventually.be.fulfilled;
    });
});

describe('Rate limit', function() {
    it('rate limitting works', function() {

        var numIterations = 5;

        this.timeout((numIterations+1)*1000);

        var provider = {
            name: "Provider",
            maxRatePerSecond: 1,
            priority: 0,
            dispatcher: new EmailDispatcherMock(function (fulfill, reject) { fulfill({ elapsedTime: 0}); })
        };

        var uut = new EmailProviderProxy([provider]);

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


