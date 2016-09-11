angular.module('jweibel-email')
    .controller('HomeController', [ '$scope', '$http', 'emailService', 'alertService',
        function($scope, $http, emailService, alertService){

            $scope.isLoading = false;

            $scope.email = {
                from: 'jwe@danskecommodities',
                to: 'jweibel22@gmail.com',
                subject: 'Test',
                body: 'Endnu en test'
            };

            $scope.send = function() {
                emailService.send($scope.email);
            }

            //TODO: put these methods into a service or a directive
            $scope.$on("HttpError", function (event, title, message, rejection) {
                if (rejection.status == 404) {
                    alertService.add("error", "Server not responding");
                } else if (message == null) {
                    alertService.add("error", "Something went wrong");
                } else {
                    alertService.add("error", title, message);
                }
            });

            $scope.$on("HttpWarning", function (event, title, message, response) {
                alertService.add("warning", title, message);
            });

            $scope.$on('$locationChangeStart', function (event) {
                alertService.clearAll();
            });

            $scope.$on('loadingStarted', function (event) {
                $scope.isLoading = true;
            });

            $scope.$on('loadingFinished', function (event) {
                $scope.isLoading = false;
            });


        }]);