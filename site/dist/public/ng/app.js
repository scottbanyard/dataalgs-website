var app = angular.module('myApp', ['ui.router']);

app.config(function ($stateProvider, $urlRouterProvider) {
  // If incorrectly type in a URL, takes you to homepage
  $urlRouterProvider.otherwise('/');

  // For every page we make we declare its URL, view, controller and page title
  $stateProvider
      .state('homePage', {
          url: '/',
          templateUrl: 'ng-partials/partial-home.html',
          controller: 'homeController',
          data: { pageTitle: "Home" }
      })
      .state('loginPage', {
          url: '/login',
          templateUrl: 'ng-partials/partial-login.html',
          controller: 'authController',
          data: { pageTitle: "Login" }
      })
      .state('registerPage', {
          url: '/register',
          templateUrl: 'ng-partials/partial-register.html',
          controller: 'authController',
          data: { pageTitle: "Register" }
      })
      .state('aboutPage', {
          url: '/about',
          templateUrl: 'ng-partials/partial-about.html',
          controller: 'homeController',
          data: { pageTitle: "About Us" }
      })
      .state('contentPage', {
          url: '/content',
          templateUrl: 'ng-partials/partial-content.html',
          controller: 'contentController',
          data: { pageTitle: "Content" }
      })
});

// Update global rootScope to contain state so can get pageTitle
app.run([ '$rootScope', '$state', '$stateParams',
function ($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
