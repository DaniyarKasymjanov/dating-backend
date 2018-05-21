const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const dating = require('./dating.js');
const cookieParser = require('cookie-parser');
const fs = require('fs');
app.use(bodyParser.raw({ type: '*/*' }))
app.use(cookieParser())
app.use(express.static('images'))



app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/session', async (req, res) => {
    let sessionID = req.cookies.session
    console.log(sessionID);
    const session = await dating.getSession(sessionID);
    if (session) {
        const user = await dating.getUser(session.username);
        return res.send(JSON.stringify({ success: true, sessionID, user }));
    }
    res.send(JSON.stringify({ success: false }))
});

app.post('/verifyUsername', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    console.log("par",parsedBody);
    dating.verifyUsername(parsedBody).then((result) => {
        console.log("res",result)
        if (result) {
            res.send(JSON.stringify({ success: false }))
        }
        else {
            res.send(JSON.stringify({ success: true }))
        }
    })
        .catch(err => {
            console.log(err);

        });

});

app.post('/register', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    //console.log(parsedBody);
    //add user session
    const sessionID = await dating.addSession(parsedBody.username);
    res.cookie('session', sessionID);
    console.log(sessionID)
    //register user
    parsedBody.accountCreationTime = Date.now();
    parsedBody.likes = []
    dating.registerUser(parsedBody).then(() =>
        res.send(JSON.stringify({ success: true })))
        .catch(err => {
            console.log(err);
            res.send(JSON.stringify({ success: false }))
        });
});

app.post('/login', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    //console.log(parsedBody);
    const sessionID = await dating.addSession(parsedBody.username);
    res.cookie('session', sessionID);
    dating.loginUser(parsedBody).then((result) => {
        console.log(result)
        if (result) {
            res.send(JSON.stringify({ success: true, username: result }))
        }
        else {
            res.send(JSON.stringify({ success: false }))
        }
    })
        .catch(err => {
            console.log(err);

        });

});

app.get('/main', (req, res) => {
    let minDate = (Date.now() - 86400000)
    //console.log(minDate);
    dating.newAccounts(minDate).then((result) => {
        console.log(result);
        res.send(JSON.stringify({result, success: true}))
    })
    .catch(err => {
        console.log(err);
    });
});

app.get('/favorites', (req, res) => {
    let sessionID = req.cookies.session
    //console.log(sessionID)
    dating.getLikedUsers(sessionID).then(result => {
        if(result) {
            res.send(JSON.stringify({success: true, result}))
        }
        return JSON.stringify({success: false});
    });
});

app.get('/getProfile', (req, res) => {
    let sessionID = req.cookies.session
    let username = req.query.username
    dating.checkLiked(sessionID, username).then((result) => {
        if (result) {
            dating.userProfile({username}).then((result) => {
                console.log(result)
                if (result) {
                    res.send(JSON.stringify({ result, liked: true }))
                }
                else {
                    res.send(JSON.stringify({ success: false }))
                }
            })
        }
        else {
            dating.userProfile({username}).then((result) => {
                console.log(result)
                if (result) {
                    res.send(JSON.stringify({ result, liked: false }))
                }
                else {
                    res.send(JSON.stringify({ success: false }))
                }
            })
        }
    })
        .catch(err => {
            console.log(err);

        });
});

app.post('/checkAnswers', (req,res) => {
    let parsedBody = JSON.parse(req.body.toString());
    let username = parsedBody.username;
    let ansArr = parsedBody.answer
    dating.chechAnswers(username, ansArr).then(result => {
        res.send(JSON.stringify({success: result}));
    })
    .catch(err => {
        console.log(err);

    });
});

app.post('/like', (req, res) => {
    let sessionID = req.cookies.session
    console.log(sessionID)
    let parsedBody = JSON.parse(req.body.toString());
    dating.addLike(sessionID, parsedBody.username).then((result) => {
        console.log(result)
        res.send(JSON.stringify({ success: true }))
    })
        .catch(err => {
            console.log(err);

        });
});

app.post('/search', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    try {
        const result = await dating.search(parsedBody);
        console.log(result)
        res.send(JSON.stringify({ success: true, result }));
    } catch (err) {
        console.log(err)
    }

})

app.post('/uploadExtraImages', (req, res) => {
    let extension = req.query.extension;
    let randomFileName = Math.random().toString(36).substring(7);
    console.log(`items/${randomFileName}.${extension}`);
    fs.writeFileSync(`images/${randomFileName}.${extension}`, req.body);
    res.send(JSON.stringify({ success: true, imageName: `${randomFileName}.${extension}` }));
});

app.post('/uploadProfileImg', (req, res) => {
    let extension = req.query.extension;
    let randomFileName = Math.random().toString(36).substring(7);
    console.log(`items/${randomFileName}.${extension}`);
    fs.writeFileSync(`images/${randomFileName}.${extension}`, req.body);
    res.send(JSON.stringify({ success: true, imageName: `${randomFileName}.${extension}` }));
});

app.post('/uploadBackgroundImg', (req, res) => {
    let extension = req.query.extension;
    let randomFileName = Math.random().toString(36).substring(7);
    console.log(`items/${randomFileName}.${extension}`);
    fs.writeFileSync(`images/${randomFileName}.${extension}`, req.body);
    res.send(JSON.stringify({ success: true, imageName: `${randomFileName}.${extension}` }));
});

app.post('/getChat', (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    dating.getChat(parsedBody.senderName, parsedBody.receiverName)
    .then(chat => {
        return res.send(JSON.stringify({ success: true, chat }));
    })
});

io.on('connection', (socket) => {
    console.log('a user connected to chat');
    socket.on('join', (res) => {
        socket.chatID = res.chatID;
        socket.join(res.chatID);
    })
    socket.on('send_msg', (res) => {
        dating.addMessage(socket.chatID, res);
        socket.emit('receive_msg', { message: res.message });
    });
    socket.on('disconnect', (reason) => {
        console.log('disconnected: ', reason);
        socket.leave(socket.chatID)
      });    
});

http.listen(4000, function () {
    console.log('listening on *:4000');
});
