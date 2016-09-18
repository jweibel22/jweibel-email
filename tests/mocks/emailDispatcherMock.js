var Promise = require('promise');

function EmailDispatcherMock(f) {
    this.f = f;
}

EmailDispatcherMock.prototype.send = function (email) {
    return new Promise(this.f);
};

EmailDispatcherMock.prototype.ping = function () {
    return new Promise(this.f);
};

module.exports = EmailDispatcherMock;