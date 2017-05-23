angular.module('myApp').factory('contentService', ($http, $q) => {

  var apiURL = 'api/';
  /*
    A standard POST request, deferring a promise, making appropriate request
    and handling errors generically
  */
  function standardPost(verb, request)
  {
      var deferred = $q.defer();

      $http.post(apiURL + verb, request)
      .then(deferred.resolve)
      .catch((err)=>{
          deferred.reject(err);
          console.log("Error on POST: " + JSON.stringify(err));
      })
      return deferred.promise;
  }
  /* The various APIs for content */
  return {
          getComments: standardPost.bind(null, "allComments")
        , getPage: standardPost.bind(null, "loadPage")
        , savePage: standardPost.bind(null, "savePage")
        , addComment: standardPost.bind(null,"makeComment")
        , getMyComments: standardPost.bind(null,"mycomments")
        , deleteComment: standardPost.bind(null,"deletecomment")
        , getMyPages: standardPost.bind(null,"mypages")
        , deletePage: standardPost.bind(null,"deletepage")
        , previewHTML: standardPost.bind(null,"previewHTML")
        , changeProfileIcon: standardPost.bind(null,"changeicon")
        , getProfileIcon: standardPost.bind(null,"geticon")
        , getCanvasImage: standardPost.bind(null,"getimage")
        , getAllMyCanvases: standardPost.bind(null,"getallimages")
        , rateComment: standardPost.bind(null,"ratecomment")
        , deleteCanvasImage: standardPost.bind(null, "deleteimage")
        /*
            Used to both save and overwrite, so can't use standardPost
        */
        , saveCanvasImage: (overwrite, request) => {
              var verb = overwrite ? "update" : "save";
              return standardPost(verb + "image", request);
          }
        /*
            Since getting public pages doesn't require being logged in, it uses
            a GET request
        */
        , getAllPublicPages: (request) => {
            var deferred = $q.defer();
            $http.get(apiURL + "getAllPublicPages")
                .then((result) => {
                    deferred.resolve(result.data);
                }, (error) => {
                    deferred.reject(error);
                    console.log(error)
            });
            return deferred.promise;
        }
    }
});
