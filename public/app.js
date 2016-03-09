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
      App.$doc.on('click', '#startGameBtn' /*Go to Game Page*/);

      // For Player
      App.$doc.on('click', '#joinGameBtn', App.Player.onJoinClick);
      App.$doc.on('click', '#readyBtn', App.Player.onReadyClick);
      App.$doc.on('click', '#submitAnswerBtn' /*Check answer and if correct move on; if not show tryAgain*/);
    },


    // Namespacing Host Code
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

      displayInstructionView : function() {
        // Display Instruction template
        App.$gameBoard.html(App.$templateCreate);
        // Display the URL on screen
        $('#gameURL').text(window.location.href);
        // Display Game ID on screen
        $('#gameId').text(App.gameId);
      },

    },


    // Namespacing Player Code
    Player : {
      // Referencing Host's Socket ID
      hostSocketId: '',

      // Reference storing Player name
      myName: '',

      // Handler for clicking Join button
      onJoinClick: function () {
          // Display the Join Game view.
          App.$gameArea.html(App.$templateJoin);
      },

      // Handler for clicking Ready button
      onReadyClick: function() {
         // collect data to send to the server
         var data = {
             gameId : +($('#gameIdInput').val()),
             playerName : $('#playerNameInput').val() || 'anon'
         };
         // Send the gameId and playerName to the server
         IO.socket.emit('playerJoinGame', data);
         // Set the appropriate properties for the current player
         App.myRole = 'Player';
         App.Player.myName = data.playerName;
      },


    },



  };

  IO.init();
  App.init();



}($));
