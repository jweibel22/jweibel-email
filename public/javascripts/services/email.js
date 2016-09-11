angular.module('jweibel-email')
    .factory('emailService', ['$http', function($http){

    var o = {

    };

    o.send = function(email) {
        return $http.post('/send', email);
    };

    return o;
}]);

