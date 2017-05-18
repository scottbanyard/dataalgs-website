angular.module('myApp')
.controller('canvasController',
    ( $scope ) => {
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
        var canvasState = new CanvasState();

        $scope.title = "Canvas controller";
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
            redrawAll();
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
                    redrawAll();
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
            redrawAll();
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

        // Retrieves all shapes from the canvasState and redraws them
        function redrawAll(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvasState.getShapes().map(drawShape);
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
                redrawAll();
            }
        }
        canvas.onmouseup = (event) =>{
            clearTimeout(clk);
            canvasState.deselectShape()
            if( !hasHappened ){
                isClick = true;
                newShape(event);
            }
            else
                redrawAll();
            hasHappened = false;
        };
});
