(function($){

  console.log('running');

  'use strict'

  // Namespacing the socket code under IO
  var IO = {

    // Connecting client to server at pageload
    init: function() {
      IO.socket = io.connect();
      IO.bindEvents();
    },

    // Socket listening for events
    bindEvents : function() {
      IO.socket.on('connected', IO.onConnected );
      IO.socket.on('newGameCreated', IO.onNewGameCreated );
      IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
      IO.socket.on('beginNewGame', IO.beginNewGame );
      IO.socket.on('newRiddleData', IO.onNewRiddleData);
      IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
      IO.socket.on('gameOver', IO.gameOver);
    },

    // Client connected
    onConnected : function() {
      // Cache a copy of the client's socket.IO session ID on the App
      App.mySocketId = IO.socket.io.engine.id;
      console.log(App.mySocketId);
    },

    // Call initialise game function for host
    onNewGameCreated : function(data) {
      App.Host.gameInit(data);
    },

    // Player joins behaviour
    playerJoinedRoom : function(data) {
      // Update waiting screen function called for Player and Host
      App[App.myRole].updateWaitingScreen(data);
    },

    // Call Countdown
    beginNewGame : function(data) {
      App[App.myRole].gameCountdown(data);
    },

    // Next Riddle Handler
    onNewRiddleData : function(data) {
      // Update the current round
      App.currentRound = data.round;
      // Change the word for the Host and Player
      App[App.myRole].newRiddle(data);
    },

    // Check answer handler
    hostCheckAnswer : function(data) {
      if(App.myRole === 'Host') {
          App.Host.checkAnswer(data);
      }
    },

    // Game over handler
    gameOver : function(data) {
      console.log(data);
      App[App.myRole].endGame(data);
    },


  }


  var App = {
    // Keeps track of Socket.io room
    gameId: 0,

    // Player or Host?
    myRole: '',

    // Object identifier unique to each player set in IO.init
    mySocketId: '',

    // Incrementing current round to match Riddle Object
    currentRound: 0,

    // Running on pageload
    init: function () {
      App.cacheElements();
      App.showSplash();
      App.bindEvents();

      // Initialize the fastclick library
      FastClick.attach(document.body);
    },

    // Referencing templates
    cacheElements: function () {
      App.$doc = $(document);

      App.$gameBoard = $('#gameBoard');
      App.$templateSplash = $('#splash-template').html();
      App.$templateCreate = $('#create-template').html();
      App.$templateJoin = $('#join-template').html();
      App.$templateGame = $('#game-template').html();
      App.$templateAnswer = $('#answer-template').html();
    },

    // Show initial splash
    showSplash: function() {
       App.$gameBoard.html(App.$templateSplash);
    },

    // Click handlers for buttons
    bindEvents: function () {
      // For Host
      App.$doc.on('click', '#createGameBtn', App.Host.onCreateClick);
      // App.$doc.on('click', '#startGameBtn' /*Go to Game Page*/);

      // For Player
      App.$doc.on('click', '#joinGameBtn', App.Player.onJoinClick);
      App.$doc.on('click', '#readyBtn', App.Player.onReadyClick);
      App.$doc.on('click', '#submitAnswerBtn', App.Player.onSubmitClick);
    },


    // =======================
    // Namespacing Host Code
    // =======================
    Host : {
      // Referencing Player data
      players : [],

      // Keeping track of number of players
      numPlayers: 0,

      // Reference to correct answer for the round
      currentCorrectAnswer: '',

      // Handler for Create button - actions performed on riddle.js
      onCreateClick: function () {
        IO.socket.emit('hostCreateNewGame');
      },

      // Sets up variables, calls function to display Instruction page
      gameInit: function (data) {
        App.gameId = data.gameId;
        App.mySocketId = data.mySocketId;
        App.myRole = 'Host';
        App.Host.numPlayersInRoom = 0;

        App.Host.displayInstructionView();
      },

      // Showing Instruction page and appending elements to DOM
      displayInstructionView : function() {
        // Display Instruction template
        App.$gameBoard.html(App.$templateCreate);
        // Display the URL on screen
        $('#gameURL').text(window.location.href);
        // Display Game ID on screen
        $('#gameId').text(App.gameId);
      },

      // Pushing 'player joined' msg to Intruction page
      updateWaitingScreen: function(data) {
          // Update host screen
          $('#playersWaiting')
              .append('<p/>')
              .text('Player ' + data.playerName + ' joined the game.');
              console.log(data.playerName);
          // Store the new player's data on the Host.
          App.Host.players.push(data);
          console.log(data);
          // Increment the number of players in the room
          App.Host.numPlayers += 1;
          // If four players have joined, start the game!
          if (App.Host.numPlayers === 4) {
              // Let the server know room full.
              IO.socket.emit('hostRoomFull',App.gameId);
          }
      },

      // Countdown begins when room is full
      gameCountdown : function() {
          // Prepare the game screen with new HTML
          App.$gameBoard.html(App.$templateGame);
          // Begin the on-screen countdown timer
          var $secondsLeft = $('#countdownTimer');
          App.countDown( $secondsLeft, 5, function(){
              console.log('Countdown finished');
              IO.socket.emit('countdownFinished', App.gameId);
          });
          // Set the Name section for each player.
          $('#player1Score').find('.playerName').text(App.Host.players[0].playerName + ': ');
          $('#player2Score').find('.playerName').text(App.Host.players[1].playerName + ': ');
          $('#player3Score').find('.playerName').text(App.Host.players[2].playerName + ': ');
          $('#player4Score').find('.playerName').text(App.Host.players[3].playerName + ': ');

          // Set the Score section on screen to 0 for each player.
          $('#player1Score').find('.score').attr('id', App.Host.players[0].mySocketId.replace(/^.#+/, ''));
          $('#player2Score').find('.score').attr('id', App.Host.players[1].mySocketId.replace(/^.#+/, ''));
          $('#player3Score').find('.score').attr('id', App.Host.players[2].mySocketId.replace(/^.#+/, ''));
          $('#player4Score').find('.score').attr('id', App.Host.players[3].mySocketId.replace(/^.#+/, ''));
      },

      // Behaviour for new round
      newRiddle : function(data) {
          console.log('newRiddle called');
          // Insert the new riddle data into the DOM
          $('#countdownTimer').text('Round ' + data.round);
          $('#gameRiddle').text(data.riddle);
          $('#gameQuestion').text(data.question);
          // Update the data for the current round
          App.Host.currentCorrectAnswer = data.answer;
          App.Host.currentRound = data.round;
      },

      // Checking answer against pool, RETURN HERE to search array of answers
      checkAnswer : function(data) {
        // Verify that the answer clicked is from the current round. Stops late entries.
        if (data.round == App.currentRound){
          // Reference for current player score
          var $pScore = $('#' + data.playerId);
          // Check if correct
          if( App.Host.currentCorrectAnswer == data.answer ) {
            // Increment the player's score
            $pScore.text(+$pScore.text() + 1);
            // Advance the round
            App.currentRound += 1;
            // Prepare data to send to the server
            var data = {
                gameId : App.gameId,
                round : +App.currentRound - 1
            }
            console.log(data);
            // Notify the server to start the next round.
            IO.socket.emit('hostNextRound', data);
            } else {
            // Emit to server
          }
        }
      },

      endGame : function(data) {
        var endGameScores = [];
        // Get data for players from screen
        var result = {'p1' : [$('#player1Score').find('.playerName').text(),
          +$('#player1Score').find('.score').text()],
        'p2' : [$('#player2Score').find('.playerName').text(),
          +$('#player2Score').find('.score').text()],
        'p3' : [$('#player3Score').find('.playerName').text(),
          +$('#player3Score').find('.score').text()],
        'p4' : [$('#player4Score').find('.playerName').text(),
          +$('#playey4Score').find('.score').text()]};
        // Find the winner
        endGameScores.push(result.p1[1]);
        endGameScores.push(result.p2[1]);
        endGameScores.push(result.p3[1]);
        endGameScores.push(result.p4[1]);
        // Find position of largest values (score)
        var indices = [];
        var maxScore = Math.max.apply(null, endGameScores);
        for (i=0; i<endGameScores.length; i++) {
            if (endGameScores[i] == maxScore) {
                indices.push(i);
            };
        };
        // Find corresponding winners and push into winners array
        var winners = [];
        for (i=0; i<indices.length; i++) {
            var key = 'p'+ (indices[i]+1);
            winners.push(result[key][0]);
        }
        // Display the winner (or winners)
        if(winners.length == 1) {
          $('#countdownTimer').text('Game Over');
          $('#gameRiddle').text('The Winner Is ...');
          $('#gameQuestion').text(winners[0].slice(0, -2) + '!');
        } else {
          $('#countdownTimer').text('Game Over');
          $('#gameRiddle').text('The Winners Are ...');
          $('#gameQuestion').empty();
          for (i=0; i<winners.length; i++) {
          $('#gameQuestion').append(winners[i].slice(0, -2) + ', ');
          };
        };

        // // Reset game data
        // App.Host.numPlayersInRoom = 0;
        // App.Host.isNewGame = true;
      },


    },

    // =======================
    // Namespacing Player Code
    // =======================
    Player : {
      // Referencing Host's Socket ID
      hostSocketId: '',

      // Reference storing Player name
      myName: '',

      // Handler for clicking Join button
      onJoinClick: function () {
          // Display the Join Game view.
          App.$gameBoard.html(App.$templateJoin);
      },

      // Handler for clicking Ready button
      onReadyClick: function() {
         // collect data to send to the server
         var data = {
             gameId : +($('#gameIdInput').val()),
             playerName : $('#playerNameInput').val() || 'anon',
         };
         // Send the gameId and playerName to the server
         IO.socket.emit('playerJoinGame', data);
         // Set the appropriate properties for the current player
         App.myRole = 'Player';
         App.Player.myName = data.playerName;

         console.log(App.Player.myName)
      },

      // Pushing 'waiting for host' msg to Join view
      updateWaitingScreen: function(data) {
        console.log(IO.socket.io.engine.id);
        console.log(data.mySocketId.replace(/^.#+/));
        if(IO.socket.io.engine.id == data.mySocketId.replace(/^.#+/, '')){
          App.myRole = 'Player';
          App.gameId = data.gameId;
          console.log(App.gameId);
          // Update host screen
          $('#waitMsg')
            .append('<p/>')
            .text('Waiting for Host to start game...');
        }
      },

      // Showing countdown on Player screen
      gameCountdown : function() {
          // Prepare the game screen with new HTML
          App.$gameBoard.html(App.$templateGame);
          // Hide Scoreboard
          $('.scores').css('display', 'none');
          // Begin the on-screen countdown timer
          var $secondsLeft = $('#countdownTimer');
          App.countDown( $secondsLeft, 5, function(){
          });
      },

      // Behaviour for new round
      newRiddle : function(data) {
          console.log('newRiddle called');
          // Prepare the game screen with new HTML
          App.$gameBoard.html(App.$templateAnswer);
          // Insert the round data into the DOM
          $('#roundCount').text('Round ' + data.round);
      },

      // Handler for clicking Submit
      onSubmitClick: function() {
          var answer = $('#answerInput').val(); // The answer word
          // Creating data obj to send to server
          var data = {
              gameId: App.gameId,
              playerId: App.mySocketId,
              answer: answer,
              round: App.currentRound,
          }
          IO.socket.emit('playerAnswer',data);
      },


    },

    // =======================
    // Helper Code
    // =======================
    countDown : function( $el, startTime, callback) {
      // Display the starting time on the screen.
      $el.text(startTime);
      // Start a 1 second timer
      var timer = setInterval(countItDown,1000);
      // Decrement the displayed timer value on each 'tick'
      function countItDown(){
        startTime -= 1
        $el.text(startTime);

        if( startTime <= 0 ){
          // Stop the timer and do the callback.
          clearInterval(timer);
          callback();
          return;
        }
      }
    },

  };

  IO.init();
  App.init();

}($));
