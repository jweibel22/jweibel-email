module.exports = function(app) {

    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

// error handlers

// development error handler
// will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);

            if (req.method == 'GET') {
                res.send(util.format('<html> <body><h1>%s</h1><h2>%s</h2><pre>%s</pre></body></html>', err.message, err.status, err.stack));
            }
            else {
            }
            res.send(JSON.stringify(err, ["message", "stack", "status"]));
        });
    }

// production error handler
// no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);

        if (req.method == 'GET') {
            res.send(util.format('<html> <body><h1>%s</h1></body></html>', err.message));
        }
        else {
            res.send(JSON.stringify(err, ["message"]));
        }
    });
};