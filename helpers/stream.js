// We'll spawn ffmpeg as a separate process
const spawn = require('child_process').spawn;
const { chalkRed } = require('../chalk/chalkRed');

function shutdownServer(ioServer){
    ioServer.close()
    console.log(chalkRed("closed app"))
    process.exit(1);
}

function stream(ioServer){
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
        // streamer.stderr.pipe(process.stderr);
        streamer.on("exit", function(code){
            console.log(`${chalkRed("FFmpeg failure code")}`, code);
            streamer.kill("SIGINT")
            shutdownServer(ioServer);
        });
}

module.exports = stream