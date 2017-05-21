angular.module('myApp')
.controller('canvasController',
    ( $scope, contentService ) => {
        // Main drawing canvas
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        // Colour picker, implemented by drawing an image on the
        var colourCanvas = document.getElementById('grad');
        var colourContext = colourCanvas.getContext('2d');

        // Filled whenever there is text input
        var openInput;

        var colImg = new Image();
        colImg.onload = () => {
            // colourCanvas.width = colImg.width;
            // colourCanvas.height = colImg.height;
            colourContext.drawImage(colImg, 0, 0, colourCanvas.width, colourCanvas.height);
        }
        colImg.src = "imgs/colours.png";

        // The actually selected colour that will be used when drawing the shapes
        colourCanvas.onclick = (event) => {
            $scope.$apply(() => {
                var col = currentColour(event);
                $scope.cssColour = rgbCSS(col);
                $scope.colour = rgb(col);
            })
        };
        // Used as a label so that the user can see more easily what they are choosing
        colourCanvas.onmousemove = (event) => {
            $scope.$apply(() => $scope.selected = rgbCSS(currentColour(event)));
        };
        // Keeps track of the shapes on the canvas
        var canvasState = new CanvasState(canvas.width,canvas.height);

        $scope.title = "Canvas Controller";
        $scope.colour = {red : 122, green:122, blue:122};
        $scope.cssColour = "rgb(122,122,122)";
        $scope.selected = "white";
        $scope.shape = 'Circle';
        //Modified from a stackoverflow response. Adjusts the information about the clicked point into the canvas frame of reference
        function getMousePosition(thisCanvas,event)
        {
            var rect = thisCanvas.getBoundingClientRect();
            return {
                x: 0.5+Math.round((event.clientX-rect.left)
                            /(rect.right-rect.left)*thisCanvas.width),
                y: 0.5+Math.round((event.clientY-rect.top)
                            /(rect.bottom-rect.top)*thisCanvas.height)
            }
        }
        function dealWithText(shape,x){
            /* Shifts the rendered text in line with the textbox. Constants
               need to change if the number of pixels in the image or the font
               size changes*/
            shape.centre.y+=22;
            shape.centre.x+=7;
            shape.contents = x.target.value;
            shape.font   = "16pt Arial"
            shape.offset = parseInt(shape.font);
            shape.width  = context.measureText(x.target.value).width;
            canvasState.addShape(shape);
            openInput.destroy();
            openInput = undefined;
            canvasState.redrawAll(context);
        }
        // Based on the selection of shape, and the colour, adds a new shape to the CanvasState and orders a redraw.
        function newShape(event)
        {
            var coords = getMousePosition(canvas, event);
            var shape = { kind:angular.copy($scope.shape),
                          centre:coords,
                          colour:angular.copy($scope.colour)};
            if($scope.shape == 'Circle'){
                shape.radius = 25;
                canvasState.addShape(shape);
            }
            else if($scope.shape == 'Rectangle'){
                shape.width = 50;
                shape.height = 50;
                canvasState.addShape(shape);
            }
            else if($scope.shape == 'Text'){
                if("undefined" != typeof openInput){
                    openInput.destroy();
                    canvasState.redrawAll(context);
                }
                openInput = new CanvasInput({
                    canvas : canvas,
                    x : coords.x,
                    y : coords.y,
                    fontSize : 20,
                    onsubmit : dealWithText.bind(null, shape)
                });
                openInput.focus();
                return;
            }
            canvasState.redrawAll(context);
        }

        // Draws a single chape onto the canvas
        function drawShape(shape)
        {
            context.strokeStyle=toCSSColour(shape.colour);
            context.beginPath();
            var coords = shape.centre;
            if(shape.kind == 'Circle'){
                context.arc(coords.x, coords.y, shape.radius, 0, 2*Math.PI);
            }
            else if(shape.kind == 'Rectangle'){
                context.rect(coords.x-Math.round(shape.width/2),
                             coords.y-Math.round(shape.height/2),
                             shape.width, shape.height);
            }
            else if(shape.kind == 'Text'){
                context.font = shape.font;
                context.textAlign='left';
                context.fillText(shape.contents,coords.x,coords.y);
                context.rect(coords.x,
                             coords.y - shape.offset,
                             shape.width,
                             parseInt(context.font));
            }

            context.stroke();
            context.closePath();
        }

        // Returns the colour under the mouse when on the colour palette
        function currentColour(event){
            var coords = getMousePosition(colourCanvas,event);
            return colourContext.getImageData(coords.x, coords.y, 1, 1).data;
        }
        // Translates the raw colour data retrieved from the mouse into a red,green,blue format
        function rgb(data)
        {
            return {red : data[0], green :data[1], blue : data[2]};
        }
        // Translates from raw data into css
        function rgbCSS(data)
        {
            return ['rgb(',')'].join(data.slice(0,3).join(','));
        }
        /* Functions dealing with dragging shapes or drawing arrows */
        var hasHappened = false;
        var clk;
        canvas.onmousedown = (event) => {
            var startEvent = event;
            clk = setTimeout(() => {
                hasHappened = true;
                canvasState.setSelectedShape(getMousePosition(canvas, startEvent));
            },200);
        };
        canvas.onmousemove = (event) => {
            if( hasHappened ){
                canvasState.moveShape(getMousePosition(canvas, event));
                canvasState.redrawAll(context);
            }
        }
        canvas.onmouseup = (event) =>{
            clearTimeout(clk);
            canvasState.deselectShape()
            if( !hasHappened ){
                isClick = true;
                newShape(event);
            }
            else{
                  canvasState.redrawAll(context);
            }
            hasHappened = false;
        };

        $scope.downloadCanvasImage = function () {
              var hiddenLink = document.createElement('a');
              hiddenLink.download = "Image.png"
              hiddenLink.href = canvas.toDataURL();
              hiddenLink.click();
        }

        $scope.saveCanvasImage = function () {
            // console.log(JSON.stringify(canvasState));
            // $scope.name = "new canvas";
            if ($scope.name == "" || $scope.name == undefined) {
              swal({
                html: true,
                title: "<b>Oops!</b>",
                text: "Please make sure you give your image a name in the text box above.",
                type: "warning"
                },
                function(){
                  swal.close();
              });
            } else {
              var width = canvas.width;
              var height = canvas.height;
              var dimensions = {width, height};
              contentService.saveCanvasImage({ token: localStorage.getItem('token'),
                                               name: $scope.name,
                                               shapes: JSON.stringify(canvasState),
                                               dimensions: JSON.stringify(dimensions)}).then((res) => {
                var response = angular.fromJson(res).data;
                if (response.success) {
                  swal({
                    html: true,
                    title: "<b>Success!</b>",
                    text: "You have successfully saved your image as <b> " + $scope.name + "</b>.",
                    type: "success"
                    },
                    function(){
                      swal.close();
                  });
                } else {
                  if (response.canvas_exists) {
                    swal({
                      title: "Overwrite?",
                      text: "There already exists an image you have created with this name!",
                      type: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#DD6B55",
                      confirmButtonText: "Yes, overwrite it!",
                      closeOnConfirm: false
                    },
                    // Callback for confirming delete account
                      function(){
                        contentService.updateCanvasImage({token: localStorage.getItem('token'), name: $scope.name, shapes: JSON.stringify(canvasState), dimensions: JSON.stringify(dimensions)}).then((res) => {
                          var response = angular.fromJson(res).data;
                          if (response.success) {
                            swal({
                              html: true,
                              title: "<b>Success!</b>",
                              text: "You have successfully overwrited your image as <b> " + $scope.name + "</b>.",
                              type: "success"
                              },
                              function(){
                                swal.close();
                            });
                          }
                        });
                    });
                  } else {
                    swal({
                      title: "Error!",
                      text: response.error,
                      type: "error"
                      },
                      function(){
                        swal.close();
                    });
                    console.log(response.error);
                  }
                }
              });
            }
        }

        $scope.getCanvasImage = () => {
          $scope.canvasID = 4;
          contentService.getCanvasImage({ token: localStorage.getItem('token'), canvasID: $scope.canvasID }).then((res) => {
            var response = angular.fromJson(res).data;
            if (response.success) {
              console.log(response.canvas.Shapes);
            }
          });
        }

        $scope.getAllMyCanvases = () => {
          contentService.getAllMyCanvases({token: localStorage.getItem('token')}).then((res) => {
            var response = angular.fromJson(res).data;
            if (response.success) {
              console.log(response.canvases);
            }
          });
            console.log(JSON.stringify(canvasState));
        }

});
