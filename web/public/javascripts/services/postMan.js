angular.module('jweibel-email')
    .factory('postMan', ['$http', function($http){

        function sleep(millis)
        {
            var date = new Date();
            var curDate = null;
            do { curDate = new Date(); }
            while(curDate-date < millis);
        }

        var service = { };

        service.send = function(email) {
            sleep(2000); //make sure people see that lovely spinner
            return $http.post('/send', email);
        };

    return service;
}]);

