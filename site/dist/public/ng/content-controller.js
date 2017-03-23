angular.module('myApp')
.controller('contentController',
    ($scope, contentService) => {
        function getComments(){
            contentService.getComments({ pageID:1 })
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

        $scope.makeComment = function(){
            if( "undefined" !== typeof $scope.newComment ){
                contentService.addComment({ token:localStorage.getItem('token'),
                                            comment: $scope.newComment,
                                            time: new Date().getTime(),
                                            pageID: 1 });
                getComments();
            }
        }
    });
