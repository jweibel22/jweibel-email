var HttpEmailDispatcher = require('../dispatcher/httpEmailDispatcher');

//Note: My MailGun account is in sandbox mode, which means that only verified receiver and sender email addresses can be used
module.exports = {

    name: "MailGun",
    maxRatePerSecond: 10,
    priority: 1,
    dispatcher:  new HttpEmailDispatcher({
        name: "MailGun",
        pingRequest: { //sending an actual test email will give a more precise ping result
            url: 'https://api.mailgun.net/v3/sandbox5a8dfb9b58034c7a8d085da905640309.mailgun.org/messages',
        },
        expectedPingStatus: 405,
        sendEmailRequest: function(email) {
            return {
            url: 'https://api:key-137c58a92eb2a1f65603636c512ca08a@api.mailgun.net/v3/sandbox5a8dfb9b58034c7a8d085da905640309.mailgun.org/messages',
            formData: {
                from: email.from,
                to: email.to,
                subject: email.subject,
                text: email.body
            }
        }}
    }),
    validate: function(email) {
        var result = [];

        //TODO: investigate the MailGun API documentation

        return result;
    }
};



