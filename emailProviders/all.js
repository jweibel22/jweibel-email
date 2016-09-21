var sendGrid = require('../emailProviders/sendGrid');
var mailGun = require('../emailProviders/mailGun');

module.exports = {
    providers: [ sendGrid, mailGun]
}
