var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var sinon = require('sinon');

chai.use(chaiAsPromised);

var expect = chai.expect;
var should = chai.should();

var ServiceErrors = require('../src/serviceErrors')
var EmailProviderProxy = require('../src/emailProviderProxy');
var ResilientEmailDispatcher = require('../src/resilientEmailProvider');
var EmailDispatcherMock = require('./mocks/emailDispatcherMock');

var email = {};

describe('Availability', function() {
    var availableProvider, unavailableProvider;

    beforeEach(function() {
        availableProvider = new ResilientEmailDispatcher(0, new EmailDispatcherMock("AvailableProvider", function (fulfill, reject) { fulfill({ elapsedTime: 0}); }));
        unavailableProvider = new ResilientEmailDispatcher(0, new EmailDispatcherMock("UnavailableProvider", function (fulfill, reject) { reject(new ServiceErrors.ServiceUnavailable()); }));
    });

    it('should succeed when provider is available', function() {
        var uut = new EmailProviderProxy([availableProvider]);
        uut.initialize();
        return expect(uut.send(email)).to.eventually.be.fulfilled;
    });
    it('should succeed if a low priority unavailable provider exists', function() {
        unavailableProvider.priority = 1;
        availableProvider.priority = 0;
        var uut = new EmailProviderProxy([availableProvider, unavailableProvider]);
        uut.initialize();
        return expect(uut.send(email)).to.eventually.be.fulfilled;
    });
    it('should fail when provider is unavailable', function() {
        var uut = new EmailProviderProxy([unavailableProvider]);
        uut.initialize();
        return expect(uut.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
    it('should fail when no providers exist', function() {
        var uut = new EmailProviderProxy([]);
        uut.initialize();
        return expect(uut.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
});

describe('Fail-over', function() {

    var availableProvider, unavailableProvider, badRequestProvider;

    beforeEach(function() {
        availableProvider = new ResilientEmailDispatcher(0, new EmailDispatcherMock("AvailableProvider", function (fulfill, reject) { fulfill({ elapsedTime: 0}); }));
        unavailableProvider = new ResilientEmailDispatcher(0, new EmailDispatcherMock("UnavailableProvider", function (fulfill, reject) { reject(new ServiceErrors.ServiceUnavailable()); }));
        badRequestProvider = new ResilientEmailDispatcher(0, new EmailDispatcherMock("BadRequestProvider",function (fulfill, reject) { reject(new ServiceErrors.BadRequest()); }));
    });

    it('first call fails on fail-over', function() {
        unavailableProvider.priority = 0;
        availableProvider.priority = 1;
        var uut = new EmailProviderProxy([availableProvider, unavailableProvider]);
        uut.initialize();
        return expect(uut.send(email)).to.eventually.be.rejectedWith(ServiceErrors.ServiceUnavailable);
    });
    it('second call succeeds on fail-over', function() {
        unavailableProvider.priority = 0;
        availableProvider.priority = 1;
        var uut = new EmailProviderProxy([availableProvider, unavailableProvider]);
        uut.initialize();
        var firstCall = uut.send(email);
        var secondCall = firstCall.then(function() {},  function(error) { return uut.send(email); });
        return Promise.all([firstCall.should.eventually.be.rejected, secondCall.should.eventually.be.fulfilled]);
    });
    it('no fail-over on malformed email', function() {
        badRequestProvider.priority = 0;
        availableProvider.priority = 1;
        var uut = new EmailProviderProxy([badRequestProvider, availableProvider]);
        uut.initialize();
        var firstCall = uut.send(email);
        var secondCall = firstCall.then(function() {},  function(error) { return uut.send(email); });
        return Promise.all([firstCall.should.eventually.be.rejectedWith(ServiceErrors.BadRequest),
                            secondCall.should.eventually.be.rejectedWith(ServiceErrors.BadRequest)]);
    });
    it('fail-over on slow provider', function() {
        var slow = new ResilientEmailDispatcher(0, new EmailDispatcherMock("Slow", function (fulfill, reject) { fulfill({ elapsedTime: 100000}); }));
        var fast = new ResilientEmailDispatcher(1, new EmailDispatcherMock("Fast",function (fulfill, reject) { fulfill({ elapsedTime: 0}); }));
        var slowDispatch = sinon.spy(slow.dispatcher, 'send');
        var fastDispatch = sinon.spy(fast.dispatcher, 'send');
        var uut = new EmailProviderProxy([slow, fast]);
        uut.initialize();
        return expect(uut.send(email)
            .then(function() { return uut.send(email);})
            .then(function() {
                sinon.assert.calledOnce(slowDispatch);
                sinon.assert.calledOnce(fastDispatch);
            }))
            .to.eventually.be.fulfilled;
    });
});

describe('Prioritization', function() {
    it('providers are prioritized', function() {
        var high = new ResilientEmailDispatcher(0, new EmailDispatcherMock("HighPriority",function (fulfill, reject) { fulfill({ elapsedTime: 0}); }));
        var low = new ResilientEmailDispatcher(1, new EmailDispatcherMock("LowPriority",function (fulfill, reject) { fulfill({ elapsedTime: 0}); }));
        var highDispatch = sinon.spy(high.dispatcher, 'send');
        var lowDispatch = sinon.spy(low.dispatcher, 'send');
        var uut = new EmailProviderProxy([low, high]);
        uut.initialize();
        return expect(uut.send(email)
            .then(function() {
                sinon.assert.calledOnce(highDispatch);
                sinon.assert.notCalled(lowDispatch); }))
            .to.eventually.be.fulfilled;
    });
});



