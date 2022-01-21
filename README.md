## TELLO Control and Video Node JS Backend System 

Tello Node JS backend uses websockets, an express server, ffmpeg, please ensure you have all the dependencies before installing and running this project. 

#### Tech stack used
- Node JS
- Websockets
- Express
- Lodash
- FFMpeg
- JSPlayer
- Mocha (For Tests)

Run `npm install`
Arguments for run:
`node ./index.js --cli` or `node ./index.js -cli-tool` for the command line tool

`node ./index.js --browser` or `node ./index.js -browser-tool` for the video and browser player which is the tello front end [here](https://github.com/lm93547/tello-frontend) and can be found at [http://localhost:4000](http://localhost:4000)

To run tests run `npm run test`

##### TODO
Expand test coverage to cover more than just the websocket connection
Make the CLI tool better

## TELLO CLI Interface 

The CLI Interface also uses a websocket server but requires the user to send commands as specified in the [Tello SDK Docs](https://dl-cdn.ryzerobotics.com/downloads/Tello/Tello%20SDK%202.0%20User%20Guide.pdf)

#### Tech stack used
- Node JS
- Websockets
- Commander (For cli arguments)

##### TODO
- Refactor this so the commands are normalised
- Add a option to select a distance value
- Make the CLI better
- Expand Test coverage




