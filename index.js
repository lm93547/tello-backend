// Import necessary modules for the project
const Tello = require('./Tello');
var inquirer = require('inquirer');
const chalk = require('chalk');
// const program = new Command();
// program.version('0.0.1');
// A basic http server that we'll access to view the stream
const http = require('http');

// To keep things simple we read the index.html page and send it to the client
const fs = require('fs');

// WebSocket for broadcasting stream to connected clients
const WebSocket = require('ws');

// We'll spawn ffmpeg as a separate process
const spawn = require('child_process').spawn;

// For sending SDK commands to Tello
const dgram = require('dgram');
const express = require('express');
const app = express();
const ioServer = http.createServer(app);
const { Server } = require("socket.io");
const { throttle } = require('lodash');
const { chalkRed } = require('./chalk/chalkRed');
const { chalkGreen } = require('./chalk/chalkGreen');

function videoAndCommands(){
  // HTTP and streaming ports
  const HTTP_PORT = 3000;
  const STREAM_PORT = 3001
  
  // Tello's ID and Port
  const TELLO_IP = '192.168.10.1'
  const TELLO_PORT = 8889
  
  function handleError(err) {
    if (err) {
      console.log('ERROR');
      console.log(err);
    }
  }
  /*
    1. Create the web server accessed at (for the basic front end)
    http://localhost:3000/index.html
  */
  server = http.createServer(function(request, response) {
  
    // Log that an http connection has come through
    console.log(
      'HTTP Connection on ' + HTTP_PORT + ' from: ' + 
      request.socket.remoteAddress + ':' +
      request.socket.remotePort
    );
  
    // Read file from the local directory and serve to user
    // in this case it will be index.html
    fs.readFile(__dirname + '/www/' + request.url, function (err,data) {
      if (err) {
        response.writeHead(404);
        response.end(JSON.stringify(err));
        return;
      }
      response.writeHead(200);
      response.end(data);
    });
  
  }).listen(HTTP_PORT); // Listen on port 3000
  /*
    2. Create the stream server where the video stream will be sent
  */
  const streamServer = http.createServer(function(request, response) {
  
    // Log that a stream connection has come through
    console.log(
      'Stream Connection on ' + STREAM_PORT + ' from: ' + 
      request.socket.remoteAddress + ':' +
      request.socket.remotePort
    );  
    // When data comes from the stream (FFmpeg) we'll pass this to the web socket
    request.on('data', function(data) {
      // Now that we have data let's pass it to the web socket server
      webSocketServer.broadcast(data);
    });
  
  }).listen(STREAM_PORT); // Listen for streams on port 3001
  
  /*
    3. Begin web socket server
  */
  const webSocketServer = new WebSocket.Server({
    server: streamServer
  });
  
  // Broadcast the stream via websocket to connected clients
  webSocketServer.broadcast = function(data) {
    webSocketServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };
  
  /* 
    4. Send the command and streamon SDK commands to begin the Tello video stream.
    YOU MUST POWER UP AND CONNECT TO TELL BEFORE RUNNING THIS SCRIPT
  */
  const drone = dgram.createSocket('udp4');
  drone.bind(TELLO_PORT);
  const droneState = dgram.createSocket('udp4');
  droneState.bind(8890);
  
  function parseState(state) {
    return state
      .split(';')
      .map(x => x.split(':'))
      .reduce((data, [key, value]) => {
        data[key] = value;
        return data;
      }, {});
  }
  
  droneState.on(
    'message',
    throttle(state => {
      const formattedState = parseState(state.toString());
      io.sockets.emit('dronestate', formattedState);
    }, 100)
  );

  drone.on('message', message => {
    console.log(`???? : ${message}`);
    const formattedState = message.toString()
    io.sockets.emit('droneresponse', formattedState);
  });

  // These send commands could be smarter by waiting for the SDK to respond with 'ok' and handling errors
  // Send command
  drone.send("command", TELLO_PORT, TELLO_IP, handleError);
  
  // Send streamon
  drone.send("streamon", TELLO_PORT, TELLO_IP, handleError);
  
  const io = new Server(ioServer, {
    cors: {
      origin: "http://localhost:4000",
      // or with an array of origins
      // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
      credentials: true,
      methods: ['GET', "POST"]
    }
  });
  
  io.on('connection', (socket) => {
    socket.on('command', command => {
        console.log('command Sent from browser');
        console.log(command);
        if(command === 'streamon'){
          stream();
        }
        drone.send(command, 0, command.length, TELLO_PORT, TELLO_IP, handleError);
    });
    socket.emit('status', 'CONNECTED');
  });


  
  /*
    5. Begin the ffmpeg stream. You must have Tello connected first
  */
  
  // Delay for 3 seconds before we start ffmpeg
  function stream(){
    setTimeout(function() {
      var args = [
        "-i", "udp://0.0.0.0:11111",
        "-r", "30",
        "-s", "1280x720",
        "-codec:v", "mpeg1video",
        "-b", "5000k",
        "-f", "mpegts",
        "http://127.0.0.1:3001/stream"
      ];
    
      // Spawn an ffmpeg instance
      var streamer = spawn('ffmpeg', args);
      // Uncomment if you want to see ffmpeg stream info
      //streamer.stderr.pipe(process.stderr);
      streamer.on("exit", function(code){
          console.log(`${chalkRed("FFmpeg failure code")}`, code);
          streamer.kill("SIGINT")
          shutdownServer();
      });
    }, 3000);
  }

  // ioServer.post('/reset-server', (request, response)=>{
  //   console.log("sent a reset command")
  // })
  stream()
  
  ioServer.listen(6767, () => {
    console.log(chalk.white.bgGreen.bold('listening on *:6767'));
  });
}

function testMode(){
  app.post('/reset-server', (request, response)=>{
    console.log("Post hit", response.statusCode)
    return response.statusCode
  })

  ioServer.listen(6767, () => {
    console.log(chalkGreen('listening on *:6767'));
  });
}

function shutdownServer(){
  ioServer.close()
  console.log(chalkRed("closed app"))
  process.exit(1);
}

function commandLine(){
  // init drone and start
  let drone = new Tello();
  drone.startCLI();

  // IMPORTANT close socket connection upon exception
  process.on('uncaughtException', () => {
    drone.command_socket.close();
  });
}

// program
//   .option('-cli-tool, --cli', 'Control the drone using the CLI')
//   .option('-browser-tool, --browser', 'Control the drone using the browser at http://localhost:4000/')

// program.parse(process.argv);

// const options = program.opts();
// if (options.cli){
//   commandLine()
// }
// if (options.browser){
//   videoAndCommands()
// }
inquirer
  .prompt([
    /* Pass your questions in here */
    {
      type: 'list',
      name: 'Tool Type',
      choices: [
        "Do you want to control the drone using commands?",
        "Do you want to control the drone using the browser?",
        "Test mode"
      ]
    }
  ])
  .then((answers) => {
    // Use user feedback for... whatever!!
    if(answers['Tool Type'] === "Do you want to control the drone using commands?"){
      commandLine();
    }
    if(answers['Tool Type'] === "Do you want to control the drone using the browser?"){
      videoAndCommands();
    }
    if(answers['Tool Type'] === "Test mode"){
      testMode();
    }
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });