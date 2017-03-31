var app = angular.module('myApp', ['ui.router', 'angular-jwt', 'ngSanitize']);

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
          url: '/content/:id',
          templateUrl: 'ng-partials/partial-content.html',
          controller: 'contentController',
          data: { pageTitle: "Content", auth: false }
      })
      .state('dashboardPage', {
          url: '/dashboard',
          templateUrl: 'ng-partials/partial-dashboard.html',
          controller: 'dashboardController',
          data: { pageTitle: "Dashboard", auth: true }
      })
      .state('canvasPage', {
          url: '/canvas',
          templateUrl: 'ng-partials/partial-canvas.html',
          controller: 'canvasController',
          data: { pageTitle: "Canvas", auth: true }
      })
      .state('createPage', {
          url: '/create/:id',
          templateUrl: 'ng-partials/partial-create.html',
          controller: 'createController',
          data: { pageTitle: "Page Creation", auth: true }
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
