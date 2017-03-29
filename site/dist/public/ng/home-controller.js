angular.module('myApp').controller('homeController', function($scope, contentService) {
  $scope.getPages = function () {
    contentService.getAllPublicPages().then(function (res) {
      if (res.success) {
        $scope.pages = res.pages;
      } else {
        console.log(res.error);
      }
    });
  }
  $scope.getPages();

});
