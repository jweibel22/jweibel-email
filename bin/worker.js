var logger = require('logfmt');
var app = require('../dispatcher/app');

process.on('SIGTERM', shutdown);

function shutdown() {
    logger.log({ type: 'info', msg: 'shutting down' });
    process.exit();
}
