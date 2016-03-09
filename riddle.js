var io;
var gameSocket;


//Export module initialising game

exports.initGame = function(request, response){
    io = request;
    gameSocket = response;
    gameSocket.emit('connected', { message: "You are connected!" });

}
