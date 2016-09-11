angular.module('jweibel-email')
    .factory('alertService', function ($rootScope, toaster) {
    var alertService = {};

    alertService.add = function (type, title, msg) {
        toaster.pop({
            type: type,
            title: title,
            body: msg
        });
    };

    alertService.clearAll = function () {
        toaster.clear();
    };

    return alertService;
});