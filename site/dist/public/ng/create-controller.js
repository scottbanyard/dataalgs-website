angular.module('myApp').controller('createController', ($rootScope, $scope, contentService, $state) => {
  $scope.page = {};
  // https://github.com/inacho/bootstrap-markdown-editor for api
  $('#myEditor').markdownEditor({
    // Activate the preview:
    preview: true,
    code: true,
    // This callback is called when the user click on the preview button:
    onPreview: function (content, callback) {

      contentService.previewHTML({content: content}).then((res) => {
        var response = angular.fromJson(res).data;
        if (response.success) {
          callback(response.html);
        }
      });
    }
  });

  function loadMarkdown() {
    contentService.getPage({token:localStorage.getItem('token'),
                              pageID: $state.params.id}
                          ).then((res) => {
                              var response = angular.fromJson(res).data;
                              if (response.success){
                                  $scope.pageInfo = response;
                                  $scope.page.Title = angular.copy($scope.pageInfo.page.Title);
                                  $scope.page.PrivateView = angular.copy($scope.pageInfo.page.PrivateView);
                                  $scope.page.PrivateEdit = angular.copy($scope.pageInfo.page.PrivateEdit);
                                  $scope.page.LastEdit = angular.copy($scope.pageInfo.page.LastEdit);
                                  $('#myEditor').markdownEditor('setContent', $scope.pageInfo.page.Content); // Sets the content of the editor
                              }
                              else {
                                  $state.go('homePage');
                              }
                            }, (err) => {
                                  // Don't have the access rights to view page or it doesn't exist, take back to home page. (POST will return 403)
                                  $state.go('homePage');
                            });
  }

  // Use page ID 0 for new page - if it's not 0, then load markdown of page to edit
  if ($state.params.id != "new-page") {
    loadMarkdown();
  }

  $scope.savePage = function () {
    if ($scope.pageInfo != undefined) {
      contentService.savePage({ token: localStorage.getItem('token'),
                                Title: $scope.page.Title,
                                Content: $("#myEditor").val(),
                                PrivateView: $scope.page.PrivateView,
                                PrivateEdit: $scope.page.PrivateEdit,
                                LastEdit: new Date().getTime(),
                                pageID: $state.params.id
                                }).then((res) => {
                                  swal({
                                    html: true,
                                    title: "<b>Success!</b>",
                                    text: "You have successfully updated your page.",
                                    type: "success"
                                    },
                                    function(){
                                      swal.close();
                                  });
      });

    } else {
      console.log("new page");
      contentService.savePage({ token: localStorage.getItem('token'),
                                Title: $scope.page.Title,
                                Content: $("#myEditor").val(),
                                PrivateView: $scope.page.PrivateView,
                                PrivateEdit: $scope.page.PrivateEdit,
                                LastEdit: new Date().getTime(),
                                pageID: null
                                }).then((res) => {
                                  swal({
                                    html: true,
                                    title: "<b>Success!</b>",
                                    text: "You have successfully created a new page.",
                                    type: "success"
                                    },
                                    function(){
                                      swal.close();
                                  });
      });
    }
  }
});
