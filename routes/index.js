var express = require('express');
var request = require('request');

module.exports = function(app) {

    function pausecomp(millis)
    {
        var date = new Date();
        var curDate = null;
        do { curDate = new Date(); }
        while(curDate-date < millis);
    }

    function dispatch(req) {

        var dto = {
            personalizations: [
                {
                    to: [
                        {
                            email: req.body.to
                        }
                    ],
                    subject: req.body.subject
                }
            ],
            from: {
                email: req.body.from
            },
            content: [
                {
                    type: "text/plain",
                    value: req.body.body
                }
            ]
        };

        request.post({
                json: dto,
                url: 'https://api.sendgrid.com/v3/mail/send',
                headers: {'Authorization': "Bearer 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"}
            },
            function (error, response, body) {
                if (!error && response.statusCode == 202) {
                    console.log('email was sent');
                    //io.sockets.emit('status', 'Email was sent');
                    //res.status(200).send();
                }
                else {
                    console.log("Error " + response.statusCode);
                    console.log('email was not sent');

                    //io.sockets.emit('status', 'Email was not sent');
                    //res.status(500).send();
                }
            }
        );
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
        res.status(500).send({Message: 'Unable to send the email'});
    });


};

