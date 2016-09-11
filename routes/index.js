var express = require('express');
var uuid = require('node-uuid');

module.exports = function(app, queue) {

    function pausecomp(millis)
    {
        var date = new Date();
        var curDate = null;
        do { curDate = new Date(); }
        while(curDate-date < millis);
    }



    console.log("configuring routes")

    /* GET home page. */
    app.get('/', function (req, res, next) {
        console.log('root called');
        res.render('index', {title: 'Express'});
    });


    app.post('/send', function (req, res, next) {
        console.log('email received: ' + req.body.subject);

        pausecomp(2000);

        var id = uuid.v1();
        queue.publish({ id: id, email: req.body }, { key: 'emails' });

        //return Promise.resolve(id);

        //res.status(500).send({Message: 'Unable to send the email'});
        res.status(200).send();
    });


};

