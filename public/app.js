(function($){
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
    },

    // Client connected
    onConnected : function() {
      // Cache a copy of the client's socket.IO session ID on the App
      App.mySocketId = IO.socket.socket.sessionid;
    },

  }


  var App = {
    // Keeps track of Socket.io room
    gameId: 0,

    // Player or Host?
    myRole: '',

    // Object identifier unique to each player
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
      App.$doc.on('click', '#createGameBtn', //Go to Instruction Page);
      App.$doc.on('click', '#startGameBtn', //Go to Game Page);

      // For Player
      App.$doc.on('click', '#joinGameBtn', //Go to Join Page);
      App.$doc.on('click', '#readyBtn', //Emit ready - add to player cnt);
      App.$doc.on('click', '#submitAnswerBtn', //Check answer and if correct move on; if not show tryAgain);
    },





  }





}($));
