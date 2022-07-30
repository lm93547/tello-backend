// Import necessary modules for the project
const Tello = require('./Tello');
var inquirer = require('inquirer');
// const program = new Command();
// program.version('0.0.1');
// A basic http server that we'll access to view the stream
const http = require('http');
// We'll spawn ffmpeg as a separate process
const spawn = require('child_process').spawn;

// For sending SDK commands to Tello
const express = require('express');
const app = express();
const ioServer = http.createServer(app);

const testMode = require('./helpers/testMode');
const commandLine = require('./helpers/commandLine');
const browserController = require('./helpers/browserController');

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
        if (answers['Tool Type'] === "Do you want to control the drone using commands?") {
            commandLine();
        }
        if (answers['Tool Type'] === "Do you want to control the drone using the browser?") {
            browserController(ioServer, http);
        }
        if (answers['Tool Type'] === "Test mode") {
            testMode(app, ioServer);
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            // Prompt couldn't be rendered in the current environment
        } else {
            // Something else went wrong
        }
    });