var HttpEmailDispatcher = require('../dispatcher/httpEmailDispatcher');

module.exports = {

    name: "SendGrid",
    maxRatePerSecond: 10,
    priority: 0,
    dispatcher: new HttpEmailDispatcher({
        name: "SendGrid",
        pingRequest: { //sending an actual test email will give a more precise ping result
            url: 'https://api.sendgrid.com/v3/mail/',
            headers: {},
            json: {}
        },
        expectedPingStatus: 401,
        sendEmailRequest: function (email) {
            return {
            url: 'https://api.sendgrid.com/v3/mail/send',
            headers: {'Authorization': "Bearer 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"},
            json : {
                personalizations: [
                    {
                        to: [
                            {
                                email: email.to
                            }
                        ],
                        subject: email.subject
                    }
                ],
                from: {
                    email: email.from
                },
                content: [
                    {
                        type: "text/plain",
                        value: email.body
                    }
                ]
            }
        }}
    }),
    validate: function(email) {
        var result = [];

        if (email.subject.length == 0) {
            result.push("Subject is not optional")
        }

        if (email.body.length == 0) {
            result.push("Content is empty")
        }

        //TODO: add more SendGrid validation rules here

        return result;
    }
};



