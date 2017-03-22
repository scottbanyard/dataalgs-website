// This controller is purely to control the look of the navbar - i.e. whether to show Account / Log Out or Login / Register
angular.module('myApp').controller('navController', ($rootScope, $scope, $state, jwtHelper) => {

  $scope.loggedIn = false;

  $scope.checkLoggedIn = function () {
    // This is called on navbar initialisation
    var token = localStorage.getItem('token');
    // If there is a token and it hasn't expired, then set to logged in
    if (token && !jwtHelper.isTokenExpired(token)) {
      $scope.loggedIn = true;
    } else if (token) {
      // If there is a token but it has expired, remove from local storage
      localStorage.removeItem('token');
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
