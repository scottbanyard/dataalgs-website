angular.module('myApp')
.controller('contentController',
    ($scope, contentService, $state, $stateParams) => {
        function getComments(){
            contentService.getComments({ pageID: $state.params.id })
                          .then((res) => {
                              var response = angular.fromJson(res).data;
                              if (response.success){
                                  $scope.comments = response.rows;
                              }
                              else
                                  $scope.comments = [];
                              }
                          );
        }
        getComments();
        $scope.isEditing = false;
        $scope.makeComment = function(){
            if( "undefined" !== typeof $scope.newComment ){
                contentService.addComment({ token:localStorage.getItem('token'),
                                            comment: $scope.newComment,
                                            time: new Date().getTime(),
                                            pageID: $state.params.id});
                getComments();
            }
        }

        contentService.getPage({token:localStorage.getItem('token'),
                                  pageID: $state.params.id}
                              ).then((res) => {
                                  var response = angular.fromJson(res).data;
                                  if (response.success){
                                      $scope.pageInfo = response;
                                      var content = $scope.pageInfo.htmlContent;
                                  }
                                  else
                                      // Don't have the access rights to view page or it doesn't exist, take back to home page.
                                      $state.go('homePage');
                                  }
                              );
    });

 // input boxes content
 // htmlContent
