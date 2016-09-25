var sendGrid = require('./sendGrid');
var mailGun = require('./mailGun');

module.exports = {
    providers: [ sendGrid, mailGun]
}
