var all = require('../emailProviders/src/all');

function validateEmailAddress(address)
{
    //copy-paste from here: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(address);
}

function weibelValidate(email) {

    var result = [];

    if (!validateEmailAddress(email.from)) {
        result.push("'From' address is not valid")
    }

    if (!validateEmailAddress(email.to)) {
        result.push("'To' address is not valid")
    }

    if (email.body.length > 10000) {
        result.push("Email is too long")
    }

    if (email.subject.length > 200) {
        result.push("Subject is too long")
    }

    return result;
};

module.exports = {

    validate: function(email) {

        validationErrors = weibelValidate(email);

        var i = 0;
        while(validationErrors.length == 0 && i < all.providers.length) {
            validationErrors = all.providers[i++].validate(email);
        }

        return validationErrors;
    }

};