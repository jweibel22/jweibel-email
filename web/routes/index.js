var express = require('express');
var uuid = require('node-uuid');
var validation = require('../../validation');

module.exports = function(app, exchange) {

    function sleep(millis)
    {
        var date = new Date();
        var curDate = null;
        do { curDate = new Date(); }
        while(curDate-date < millis);
    }

    console.log("configuring routes")

/*
    app.get('/', function (req, res, next) {
          res.sendFile('index.html');
    });
*/

    app.post('/send', function (req, res, next) {
        console.log('email received: ' + req.body.subject);

        sleep(2000); //make sure people see the lovely spinner

        if (!validation.validateEmailAddress(req.body.from) || !validation.validateEmailAddress(req.body.to)) {
            res.status(400).send({message: "Invalid request, email adresses were not legal" });
        }

        //TODO: validate body. (size etc.)

        //throw new Error("asaasasd");

        var id = uuid.v1();
        //exchange.publish({ id: id, email: req.body }, { key: 'emails' });


        res.status(200).end();
    });


};

