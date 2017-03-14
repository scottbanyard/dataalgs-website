var app = angular.module('myApp', ['ui.router']);

app.config(function ($stateProvider, $urlRouterProvider) {
  // If incorrectly type in a URL, takes you to homepage
  $urlRouterProvider.otherwise('/');

  // For every page we make we declare its URL, view, controller and page title
  $stateProvider
      .state('homePage', {
          url: '/',
          templateUrl: 'ng-partials/partial-home.xhtml',
          controller: 'homeController',
          data: { pageTitle: "Home" }
      })
      .state('loginPage', {
          url: '/login',
          templateUrl: 'ng-partials/partial-login.xhtml',
          controller: 'authController',
          data: { pageTitle: "Login" }
      })
      .state('registerPage', {
          url: '/register',
          templateUrl: 'ng-partials/partial-register.xhtml',
          controller: 'authController',
          data: { pageTitle: "Login" }
      })
});

// Update global rootScope to contain state so can get pageTitle
app.run([ '$rootScope', '$state', '$stateParams',
function ($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
