const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const dating = require('./dating.js');
const cookieParser = require('cookie-parser');
const fs = require('fs');
app.use(bodyParser.raw({ type: '*/*', limit: '50mb' }))
app.use(cookieParser())
app.use(express.static('images'))



app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/session', async (req, res) => {
    let sessionID = req.cookies.session
    console.log('---------SESSION-------------');
    console.log(sessionID);
    const session = await dating.getSession(sessionID);
    console.log(session)
    if (session) {
        const user = await dating.getUser(session.username);
        return res.send(JSON.stringify({ success: true, sessionID, user }));
    }
    res.send(JSON.stringify({ success: false }))
});

app.post('/verifyUsername', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    console.log("verify username parsedbody",parsedBody);
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
    console.log('register parsed', parsedBody);
    //add user session
    const sessionID = await dating.addSession(parsedBody.username);
    res.cookie('session', sessionID);
    console.log('sessionID', sessionID)
    //register user
    parsedBody.accountCreationTime = Date.now();
    parsedBody.likes = []
    dating.registerUser(parsedBody).then((result) =>
        res.send(JSON.stringify({ success: true, username: result })))
        .catch(err => {
            console.log(err);
            res.send(JSON.stringify({ success: false }))
        });
});

app.post('/login', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    //console.log(parsedBody);
    dating.loginUser(parsedBody).then(async (result) => {
        console.log('hgfdsfghjhgfds', result)
        if (result) {
            const sessionID = await dating.addSession(parsedBody.username);
            console.log('sessionID', sessionID)
            res.cookie('session', sessionID);
            res.send(JSON.stringify({ success: true, result }))
        }
        else {
            res.send(JSON.stringify({ success: false }))
        }
    })
        .catch(err => {
            console.log(err);
            res.send(JSON.stringify({ success: false }))
        });

});

app.get('/logout', (req, res) => {
    let sessionID = req.cookies.session
    dating.logoutUser(sessionID).then((result) => {
        res.send(JSON.stringify({success: true}))
    })
})

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

app.get('/chatProfileImage', (req, res) => {
    const username = req.query.username;
    dating.getProfileImage(username).then(result => {
        res.send(JSON.stringify({sucess: true, result}))
    })
})

app.get('/spotlight', (req, res) => {
    let sessionID = req.cookies.session;
    dating.getSpotlight(sessionID).then((result) => {
        res.send(JSON.stringify({success: true, result}))
    })
})

app.post('/editProfile', (req, res) => {
    let sessionID = req.cookies.session;
    let parsedBody = JSON.parse(req.body.toString());
    dating.editProfile(sessionID, parsedBody).then(result => {
        res.send(JSON.stringify({success: true}))
    })
})

app.post('/updateQuestions', (req, res) => {
    let sessionID = req.cookies.session;
    let parsedBody = JSON.parse(req.body.toString());
    dating.updateQuestions(sessionID, parsedBody).then (result => {
        res.send(JSON.stringify({success: true}))
    })
})

app.post('/checkAnswers', (req,res) => {
    let sessionID = req.cookies.session
    let parsedBody = JSON.parse(req.body.toString());
    let username = parsedBody.username;
    let ansArr = parsedBody.answer
    dating.checkAnswers(sessionID, username, ansArr).then(result => {
        res.send(JSON.stringify({success: result}));
    })
    .catch(err => {
        console.log(err);

    });
});

app.post('/like', (req, res) => {
    let sessionID = req.cookies.session
    console.log("SESSIONID",sessionID)
    let parsedBody = JSON.parse(req.body.toString());
    console.log("PARSEBODY USERNAME",parsedBody.username)
    dating.addLike(sessionID, parsedBody.username).then((result) => {
        res.send(JSON.stringify({ success: true /*insert data here*/ }))
    })
        .catch(err => {
            console.log(err);

        });
});

app.post('/unlike', (req, res) => {
    let sessionID = req.cookies.session
    //console.log(sessionID)
    let parsedBody = JSON.parse(req.body.toString());
    dating.removeLike(sessionID, parsedBody.username).then((result) => {
        //console.log(result)
        res.send(JSON.stringify({ success: true }))
    })
        .catch(err => {
            console.log(err);

        });
});

app.post('/search', async (req, res) => {
    let parsedBody = JSON.parse(req.body.toString());
    try {
        let searchObj = {searchInput: parsedBody.searchInput};
        let fields = Object.keys(parsedBody.fields)
        .filter(key => parsedBody.fields[key] !== '');
        if(fields.length > 0) searchObj.fields = fields.reduce((acc, currKey) => ({ ...acc, [currKey]: parsedBody.fields[currKey] }), {});
        if(Object.values(parsedBody.age).some(val => val !== '')) searchObj.age = parsedBody.age;
        const result = await dating.search(searchObj);
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

app.post('/uploadBackgroundImage', (req, res) => {
    let extension = req.query.extension;
    let randomFileName = Math.random().toString(36).substring(7);
    console.log(`items/${randomFileName}.${extension}`);
    fs.writeFileSync(`images/${randomFileName}.${extension}`, req.body);
    res.send(JSON.stringify({ success: true, imageName: `${randomFileName}.${extension}` }));
});

app.get('/getChats', (req, res) => {
    let sessionID = req.cookies.session
    dating.getChats(sessionID)
    .then(chats => {
        if(chats) return res.send(JSON.stringify({ success: true, chats }));
        return res.send(JSON.stringify({ success: false }));
    })
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
        console.log(res)
        socket.chatID = res.chatID;
        socket.join(res.chatID);
    })
    socket.on('send_msg', (res) => {
        console.log(res, socket.chatID)
        dating.addMessage(socket.chatID, res);
        // socket.emit('receive_msg', res);
        io.in(socket.chatID).emit('receive_msg', res);
    });
    socket.on('disconnect', (reason) => {
        console.log('disconnected: ', reason);
        socket.leave(socket.chatID)
      });    
});

http.listen(4000, function () {
    console.log('listening on *:4000');
});
