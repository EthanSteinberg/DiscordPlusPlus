// var DiscordClient = require('discord.io');
// var bot = new DiscordClient({
//     autorun: true,
//     email: "b3018730@trbvn.com",
//     password: "discordbotplusplus",
//     //OR
//     token: ""
// });

// bot.on('ready', function() {
//     console.log(bot.username + " - (" + bot.id + ")");
// });

// var pending_messages = [];

// bot.on('message', function(user, userID, channelID, message, rawEvent) {

// });
var fs = require('fs');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

var server = require('http').createServer(app);

var stars = JSON.parse(fs.readFileSync('stars.json', 'utf8'));

app.get('/star_data', function (req, res) {
    if (req.query.id == undefined) {
        res.json(stars);
    } else {
        res.json(stars[req.query.id] || {});
    }
});

app.post('/toggle_star', function (req, res) {
    var data = req.body;
    var message_stars = stars[data.destination] || {'': {text: data.text, author: data.author}};
    stars[data.destination] = message_stars;

    message_stars[data.sender] = !(message_stars[data.sender] || false);

    fs.writeFile('stars.json', JSON.stringify(stars));

    var badsockets = [];
    for (var i = 0; i < sockets.length; i++) {
        try {
            sockets[i].send(JSON.stringify({type: 'updateStars', data: stars}));
        } catch(err) {
            badsockets.push(sockets[i]);
        }
    }

    sockets = sockets.filter(function(a) {return badsockets.indexOf(a) === -1;});

    res.send('');
});

var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ server: server });

sockets = [];

wss.on('connection', function connection(ws) {
    sockets.push(ws);
    // you might use location.query.access_token to authenticate or share sessions
    // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    console.log('Got connection!');
});

server.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});