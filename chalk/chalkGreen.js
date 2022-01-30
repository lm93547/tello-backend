const chalk = require('chalk');

function chalkGreen(string){
    return chalk.white.bgGreen.bold(string)
}

module.exports = {
    chalkGreen
}