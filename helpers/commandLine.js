const Tello = require("../Tello");

function commandLine(){
    // init drone and start
    let drone = new Tello();
    drone.startCLI();
  
    // IMPORTANT close socket connection upon exception
    process.on('uncaughtException', () => {
      drone.command_socket.close();
    });
}

module.exports = commandLine;