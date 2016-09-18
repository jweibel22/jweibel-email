var HttpEmailDispatcher = require('../httpEmailDispatcher');

module.exports = {

    name: "SendGrid",
    maxRatePerSecond: 10,
    priority: 0,
    dispatcher:  new HttpEmailDispatcher({
        pingRequest: { //sending an actual test email will give a more precise ping result
            url: 'https://api.sendgrid.com/v3/mail/',
            headers: {},
            body: {},
            expectedStatus: 401
        },
        sendEmailRequest: function (email) {
            return {
            url: 'https://api.sendgrid.com/v3/mail/send',
            headers: {'Authorization': "Bearer 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"},
            time: true,
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
    })
};



