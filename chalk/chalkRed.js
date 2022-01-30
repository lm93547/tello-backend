const chalk = require('chalk');

function chalkRed(string){
    return chalk.white.bgRed.bold(string)
}

module.exports = {
    chalkRed
}