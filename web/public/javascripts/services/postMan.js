angular.module('jweibel-email')
    .factory('postMan', ['$http', function($http){

        var service = { };

        service.send = function(email) {
            return $http.post('/send', email);
        };

    return service;
}]);

