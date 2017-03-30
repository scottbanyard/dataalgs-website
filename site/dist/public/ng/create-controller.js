angular.module('myApp').controller('createController', ($rootScope, $scope, contentService) => {

  // https://github.com/inacho/bootstrap-markdown-editor for api
  $('#myEditor').markdownEditor({
    // Activate the preview:
    preview: true,
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

});
