angular.module('jweibel-email')
    .factory('townCrier', function ($rootScope, toaster) {
        var service = {};

        var add = function (type, title, msg) {
            toaster.pop({
                type: type,
                title: title,
                body: msg
            });
        };

        service.initialize = function() {

            $rootScope.$on("HttpError", function (event, title, message, status) {
                if (status == 404) {
                    add("error", "Server not responding");
                } else if (message == null) {
                    add("error", "An error has occurred, please contact support");
                } else {
                    add("error", title, message);
                }
            });

            $rootScope.$on("HttpWarning", function (event, title, message) {
                add("warning", title, message);
            });
        };

        return service;
    });