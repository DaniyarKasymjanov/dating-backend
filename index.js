const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const dating = require('./dating.js');
const cookieParser = require('cookie-parser');
app.use(bodyParser.raw({ type: '*/*' }))
app.use(cookieParser())


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/session', async (req, res) => { 
    let sessionID = req.cookies.session
    console.log(sessionID);
    const session = await dating.getSession(sessionID);
    if(session) {
        const user = await dating.getUser(session.username);
        return res.send(JSON.stringify({ success: true, sessionID, user }));
    }
    res.send(JSON.stringify({ success: false }))
})

app.post('/verifyUsername', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    //console.log(parsedBody);
    dating.verifyUsername(parsedBody).then((result) => {
        //console.log(result)
        if (result) {
            res.send(JSON.stringify({ success: true }))
        }
        else {
            res.send(JSON.stringify({ success: false }))
        }})
        .catch(err => {
            console.log(err);

        });

})

app.post('/register', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    //console.log(parsedBody);
    //add user session
    const sessionID = await dating.addSession(parsedBody.username);
    res.cookie('session', sessionID);
    //register user
    parsedBody.accountCreationTime = Date.now();
    dating.registerUser(parsedBody).then(() =>
        res.send(JSON.stringify({ success: true })))
        .catch(err => {
            console.log(err);
            res.send(JSON.stringify({ success: false }))
        });
})

app.post('/login', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    //console.log(parsedBody);
    const sessionID = await dating.addSession(parsedBody.username);
    res.cookie('session', sessionID);
    dating.loginUser(parsedBody).then((result) => {
        console.log(result)
        if (result) {
            res.send(JSON.stringify({ success: true }))
        }
        else {
            res.send(JSON.stringify({ success: false }))
        }})
        .catch(err => {
            console.log(err);

        });

})

 app.post('/getProfile', (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    dating.userProfile(parsedBody).then((result) => {
        console.log(result)
        if (result) {
            res.send(JSON.stringify({ result }))
        }
        else {
            res.send(JSON.stringify({ success: false }))
        }})
        .catch(err => {
            console.log(err);

        });
})

app.post('/search', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    try {
        const result = await dating.search(parsedBody);
        console.log(result)
        res.send(JSON.stringify({success: true, result}));
    } catch (err) {
        console.log(err)
    }
    
})
// io.on('connection', function (socket) {
//     console.log('a user connected');
//     socket.on('send_msg', function (msg) {
//         console.log(msg);
//         socket.broadcast.emit('receive_msg', 'hey there');
//     });
// });

http.listen(4000, function () {
    console.log('listening on *:4000');
});

// async function registerUser(userObj) {
//     try {
//         const usersCollection = await users;
//         const res = await usersCollection.insertOne(userObj);
//         console.log('user added');
//     } catch (err) {
//         console.log(err);
//     }
// }

// app.get('/session', (req, res) => { 
//     let sessionID = req.cookies.session
//     console.log(sessionInfo[sessionID])
//     if (!sessionInfo[sessionID]) {
//         sessionID = Math.floor(Math.random() * 100000000)
//         sessionInfo[sessionID] = {cartItems: [], name: '', email: '' };
//         res.cookie('session', sessionID, { expires: new Date(Date.now() + (1000 * 60 * 60 * 24)) });
//     }
//     // res.send(JSON.stringify({ success: true, sessionID, name: sessionInfo[sessionID].name, email: sessionInfo[sessionID].email, cartItems: sessionInfo[sessionID].cartItems }))
//     res.send(JSON.stringify({ success: true, sessionID, ...sessionInfo[sessionID] }))
//})