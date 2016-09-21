angular.module('jweibel-email')
    .controller('HomeCtrl', [ '$scope', '$http', 'postMan', 'toaster',
        function($scope, $http, postMan, toaster){

            $scope.isLoading = false;

            $scope.email = {
                from: '',
                to: '',
                subject: '',
                body: ''
            };

            $scope.send = function() {
                postMan.send($scope.email).then(function(response) {
                    toaster.pop({
                        type: "info",
                        title: "Info",
                        body: "Email was sent"
                    });
                });
            };

            $scope.$on('loadingStarted', function (event) {
                $scope.isLoading = true;
            });

            $scope.$on('loadingFinished', function (event) {
                $scope.isLoading = false;
            });
        }]);