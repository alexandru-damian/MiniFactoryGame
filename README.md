# MiniFactoryGame 

## About

TBD

# Installation 

## Requirements

The applications requires the following:
* nodejs >= 18.14.1
* browser (Chrome, Firefox, Edge, Opera etc)
* local server (Check bellow how to create a local host with [live-server](#live-server) node module)

## How to run

On the root folder of your workspace, install all the node dependencies that the project requires.

```
npm install
```

Once the pacakges have been installed run the following command:

```
npm run build
```

Note:  the build is done correctly if inside _/dist_ a directory called _scripts_ will be generated. 

The last thing to do is to crate a local host and open the index.html in the browser. 

## Live-server

To run a simple local host server will use the node package live-server.
```
npm install live-server
```
Note: If you want to install it globally use _-g_ parameter.

After its done, simply go in the _MiniFactoryGame/dist/_ and run from console: ```live-server```. 

Note:Default will run with 127.0.0.1 host address and port 8080.

