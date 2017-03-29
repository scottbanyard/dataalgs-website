angular.module('myApp')
.controller('canvasController',
    ( $scope ) => {
        var canvas = document.getElementById('canvas');
        canvas.onclick = newShape;

        $scope.title = "Canvas controller";
        $scope.colour = {red:122,green:122,blue:122};
        $scope.cssColour = toCSSColour($scope.colour);
        $scope.setColourValue = () => {
            $scope.cssColour = toCSSColour($scope.colour);
        }
        $scope.shape = 'Circle';

        function getMousePosition(event)
        {
            var rect = canvas.getBoundingClientRect();
            return {
                x: Math.round((event.clientX-rect.left)
                            /(rect.right-rect.left)*canvas.width),
                y: Math.round((event.clientY-rect.top)
                            /(rect.bottom-rect.top)*canvas.height)
            }
        }

        function newShape(event)
        {
            var rect = canvas.getBoundingClientRect();
            var coords = getMousePosition(event);
            var shape = { kind:angular.copy($scope.shape),
                          centre:coords,
                          colour:angular.copy($scope.colour)};
            if($scope.shape == 'Circle'){
                console.log(canvas.width);
                shape.radius = Math.round(canvas.width / 10);
                canvasState.addShape(shape);
            }
            else if($scope.shape == 'Rectangle'){
                shape.width = 15;
                shape.height = 15;
                canvasState.addShape(shape);
            }

            redrawAll();
        }

        function drawShape(shape)
        {
            context.strokeStyle=toCSSColour(shape.colour);
            context.beginPath();
            var coords = shape.centre;
            if(shape.kind == 'Circle'){
                context.arc(coords.x, coords.y, shape.radius, 0, 2*Math.PI);
            }
            else if(shape.kind == 'Rectangle'){
                context.rect(coords.x-7, coords.y-7, shape.width, shape.height);
            }

            context.stroke();
            context.closePath();
        }

        function redrawAll(){
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvasState.getShapes().map(drawShape);
        }

});
