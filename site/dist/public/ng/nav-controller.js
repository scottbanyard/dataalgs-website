// This controller is purely to control the look of the navbar - i.e. whether to show Account / Log Out or Login / Register
angular.module('myApp').controller('navController', ($rootScope, $scope, $state) => {

  $scope.loggedIn = false;

  $scope.checkLoggedIn = function () {
    // This is called on navbar initialisation
    if (localStorage.getItem('token')) {
      $scope.loggedIn = true;
    }
  }

  $scope.logOut = function () {
    // Deal with cookies here i.e. discard / destroy them or whatever you do
    $scope.loggedIn = false;
    localStorage.removeItem('token');
  }

  // Listening for a message from the authController to say the user has logged in
  $rootScope.$on("userLoggedIn", function () {
    $scope.loggedIn = true;
  });
});
