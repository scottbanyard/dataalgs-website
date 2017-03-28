angular.module('myApp')
.controller('canvasController',
    ( $scope ) => {


        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        canvas.addEventListener("click", drawShape, false);

        $scope.title = "Canvas controller";
        $scope.colour = {red:122,green:122,blue:122};
        $scope.cssColour = 'rgb(122,122,122)';
        $scope.shape = 'Circle';

    function getMousePosition(event){
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((event.clientX-rect.left)
                        /(rect.right-rect.left)*canvas.width),
            y: Math.round((event.clientY-rect.top)
                        /(rect.bottom-rect.top)*canvas.height)
        }
    }

    function drawShape(event)
    {
        var coords = getMousePosition(event);
        context.beginPath();

        if($scope.shape == 'Circle')
            context.arc(coords.x, coords.y, 15, 0, 2*Math.PI);
        else if($scope.shape == 'Square'){
            context.rect(coords.x-7, coords.y-7, 15, 15);
        }
        context.strokeStyle=$scope.cssColour;
        context.stroke();
        context.closePath();
    }

    $scope.setColourValue = function(){
        var red = $scope.colour.red.toString();
        var green = $scope.colour.green.toString();
        var blue = $scope.colour.blue.toString();
        var col = ['rgb(',')'].join([red,green,blue].join(','));
        $scope.cssColour = col;
    }

});
