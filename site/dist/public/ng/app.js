var app = angular.module('myApp', ['ui.router', 'angular-jwt']);

app.config(function ($stateProvider, $urlRouterProvider) {
  // If incorrectly type in a URL, takes you to homepage
  $urlRouterProvider.otherwise('/');

  // For every page we make we declare its URL, view, controller and page title
  $stateProvider
      .state('homePage', {
          url: '/',
          templateUrl: 'ng-partials/partial-home.html',
          controller: 'homeController',
          data: { pageTitle: "Home", auth: false }
      })
      .state('loginPage', {
          url: '/login',
          templateUrl: 'ng-partials/partial-login.html',
          controller: 'authController',
          data: { pageTitle: "Login", auth: false }
      })
      .state('registerPage', {
          url: '/register',
          templateUrl: 'ng-partials/partial-register.html',
          controller: 'authController',
          data: { pageTitle: "Register", auth: false }
      })
      .state('aboutPage', {
          url: '/about',
          templateUrl: 'ng-partials/partial-about.html',
          controller: 'homeController',
          data: { pageTitle: "About Us", auth: false }
      })
      .state('contentPage', {
          url: '/content',
          templateUrl: 'ng-partials/partial-content.html',
          controller: 'contentController',
          data: { pageTitle: "Content", auth: false }
      })
      .state('pagesPage', {
          url: '/mypages',
          templateUrl: 'ng-partials/partial-mypages.html',
          controller: 'pagesController',
          data: { pageTitle: "My Pages", auth: true }
      })
      .state('accountPage', {
          url: '/account',
          templateUrl: 'ng-partials/partial-account.html',
          controller: 'accountController',
          data: { pageTitle: "My Account", auth: true }
      })
});

// Update global rootScope to contain state so can get pageTitle
app.run([ '$rootScope', '$state', '$stateParams', '$timeout', 'jwtHelper',
function ($rootScope, $state, $stateParams, $timeout, jwtHelper) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;

  // Listens for route change - if needs auth and no token provided, re-direct to login page
  $rootScope.$on('$stateChangeStart',
  function(event, toState, toParams, fromState, fromParams) {
    var token = localStorage.getItem('token');
    if (toState.data.auth && !token || toState.data.auth && jwtHelper.isTokenExpired(token)) {
      $timeout(function() {
        $state.go('loginPage');
      });
    }
  })
}]);
