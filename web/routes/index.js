var express = require('express');
var uuid = require('node-uuid');
var validation = require('../validation');

module.exports = function(app, exchange) {

    function sleep(millis)
    {
        var date = new Date();
        var curDate = null;
        do { curDate = new Date(); }
        while(curDate-date < millis);
    }

    app.post('/send', function (req, res, next) {

        sleep(2000); //make sure people see the lovely spinner

        var validationErrors = validation.validate(req.body);

        if (validationErrors.length > 0) {
            res.status(400).send({message: validationErrors.join(". ")});
        }
        else {
            //TODO: be aware, jackrabbit doesn't support publisher confirms, we should push for this feature to be added or switch to another framework..
            exchange.publish({ id: uuid.v4(), email: req.body }, { key: 'emails' });
            res.status(200).end();
        }
    });
};

