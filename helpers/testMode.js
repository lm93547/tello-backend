const { chalkGreen } = require("../chalk/chalkGreen");

function testMode(app, ioServer){
    app.post('/reset-server', (request, response)=>{
      console.log("Post hit", response.statusCode)
      return response.statusCode
    })
  
    ioServer.listen(6767, () => {
      console.log(chalkGreen('listening on *:6767'));
    });
}

module.exports = testMode