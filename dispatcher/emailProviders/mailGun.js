var HttpEmailDispatcher = require('../httpEmailDispatcher');

module.exports = {

    name: "MailGun",
    maxRatePerSecond: 10,
    priority: 1,
    dispatcher:  new HttpEmailDispatcher({
        pingRequest: { //sending an actual test email will give a more precise ping result
            url: 'https://api.mailgun.net/v3/sandbox5a8dfb9b58034c7a8d085da905640309.mailgun.org/messages',
            headers: {},
            body: {},
            expectedStatus: 405
        },
        sendEmailRequest: function(email) {
            return {
            url: 'https://api:key-137c58a92eb2a1f65603636c512ca08a@api.mailgun.net/v3/sandbox5a8dfb9b58034c7a8d085da905640309.mailgun.org/messages',
            time: true,
            formData: {
                from: email.from,
                to: email.to,
                subject: email.subject,
                text: email.body
            }
        }}
    })
};



