angular.module('jweibel-email').config([
    '$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push(function($rootScope, $q) {
            return {
                'response': function(response) {
                    if (response.data.Success == false) {
                        $rootScope.$broadcast("HttpWarning", "Warning", response.data.message);
                    }
                    return response;
                },
                'responseError': function(rejection) {
                    $rootScope.$broadcast("HttpError", "Error", rejection.data.message, rejection.status);
                    return $q.reject(rejection);
                }
            };
        });
    }
]);

// Spinner
angular.module('jweibel-email').config([
    '$httpProvider', function($httpProvider) {

        $httpProvider.interceptors.push(function($rootScope, $q) {
            var numLoadings = 0;
            return {
                'request': function(request) {
                    if (numLoadings++ == 0) {
                        $rootScope.$broadcast("loadingStarted", request);
                    }
                    return request;
                },
                'response': function(response) {
                    if ((--numLoadings) === 0) {
                        $rootScope.$broadcast("loadingFinished", response);
                    }
                    return response;
                },
                'responseError': function(response) {
                    if ((--numLoadings) === 0) {
                        $rootScope.$broadcast("loadingFinished", response);
                    }
                    return $q.reject(response);
                }
            };
        });
    }
]);