(function () {

    angular.module('maritimeweb.s-124')
        .controller("S124MapController", S124MapController);

    S124MapController.$inject = ['$scope', 'S124Service', '$window', 'growl', '$log', 'NotifyService'];

    function S124MapController($scope, S124Service, $window, growl, $log, NotifyService) {
        var vm = this;
        vm.messages = [];
        vm.services = [];

        NotifyService.subscribe($scope, 'S-124-Services-Loaded', function (e, services) {
            vm.services = services;
       });

        NotifyService.subscribe($scope, 'S-124-Messages-Loaded', function (e, messages) {
            vm.messages = messages;
        });
    }
})();
