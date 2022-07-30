const chalk = require('chalk');
const dgram = require('dgram');
const fs = require('fs');
const helpers = require('./helpers');
const { Server } = require("socket.io");
const stream = require("./stream");
const { throttle } = require('lodash');
// WebSocket for broadcasting stream to connected clients
const WebSocket = require('ws');
// To keep things simple we read the index.html page and send it to the client

function browserController(ioServer, http){
    // HTTP and streaming ports
    const HTTP_PORT = 3000;
    const STREAM_PORT = 3001
    
    // Tello's ID and Port
    const TELLO_IP = '192.168.10.1'
    const TELLO_PORT = 8889
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
    

    
    droneState.on(
      'message',
      throttle(state => {
        const formattedState = helpers.parseState(state.toString());
        io.sockets.emit('dronestate', formattedState);
      }, 100)
    );
  
    drone.on('message', message => {
      console.log(`🤖 : ${message}`);
      const formattedState = message.toString()
      io.sockets.emit('droneresponse', formattedState);
    });
  
    // These send commands could be smarter by waiting for the SDK to respond with 'ok' and handling errors
    // Send command
    drone.send("command", TELLO_PORT, TELLO_IP, helpers.handleError);
    
    // Send streamon
    drone.send("streamon", TELLO_PORT, TELLO_IP, helpers.handleError);
    
    const io = new Server(ioServer, {
        cors: {
        origin: "http://localhost:3003",
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
            drone.send(command, 0, command.length, TELLO_PORT, TELLO_IP, helpers.handleError);
        });
        socket.emit('status', 'CONNECTED');
    });
  
  
    
    /*
      5. Begin the ffmpeg stream. You must have Tello connected first
    */
    
    // Delay for 3 seconds before we start ffmpeg
  
  
    // ioServer.post('/reset-server', (request, response)=>{
    //   console.log("sent a reset command")
    // })
    stream(ioServer)
    
    ioServer.listen(6767, () => {
      console.log(chalk.white.bgGreen.bold('listening on *:6767'));
    });
}

module.exports = browserController;