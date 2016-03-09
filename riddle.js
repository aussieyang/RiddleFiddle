var io;
var gameSocket;


// Export module initialising game

exports.initGame = function(request, response){
    io = request;
    gameSocket = response;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);

    // Player events
    gameSocket.on('playerJoinGame', playerJoinGame);
};


//===================
// Host functions
//===================

// Triggered by clicking Create
function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};


//===================
// Player functions
//===================

function playerJoinGame(data) {
    // A reference to the player's Socket.IO socket object
    var socket = this;
    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];
    debugger
    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = socket.id;
        // Join the room
        socket.join(data.gameId);
        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}
