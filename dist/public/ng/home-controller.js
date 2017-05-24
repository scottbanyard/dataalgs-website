angular.module('myApp').controller('homeController', ($scope, contentService, $state, $stateParams) =>{
    /* Functionality to retrieve all of the public pages */
  $scope.getPages = () => {
    contentService.getAllPublicPages().then((res) => {
      if (res.success) {
        $scope.pages = res.pages;
      } else {
        console.log(res.error);
      }
    });
  }
  /* Goes to a particular content page */
  $scope.selectedPublicPage = (id) => $state.go('contentPage', {id: id});

  /* Upon load, actually retreives all of the pages */
  $scope.getPages();
});
