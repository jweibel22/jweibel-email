var Promise = require('promise');

function EmailDispatcherMock(name, f) {
    this.f = f;
    this.name = name;
    var self = this;
}

EmailDispatcherMock.prototype.send = function (email) {
    return new Promise(this.f);
}

EmailDispatcherMock.prototype.ping = function () {
    return new Promise(this.f);
};

module.exports = EmailDispatcherMock;