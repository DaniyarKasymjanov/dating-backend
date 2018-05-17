const uri = "mongodb+srv://daniyar:111@cluster0-b2k8j.mongodb.net/dating";
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const connect = MongoClient.connect(uri, { useNewUrlParser: true });
const db = connect.then(client => client.db('dating'));
const users = db.then(dbo => dbo.collection('users'));
const sessions = db.then(dbo => dbo.collection('sessions'));


function registerUser(userObj) {
    //console.log(userObj)
    return users.then(usersCollection => { 
        return usersCollection
        .insertOne(userObj)
        .then(res => 
            {
                console.log('user added', res)
            })
        })
}

function loginUser(loginObj) {
    return users.then(usersCollection => {
        //console.log(loginObj);
        return usersCollection
        .findOne(loginObj)
        .then(res => 
            {
                console.log('looking for user', res)
                return res
            })
        })
}

function userProfile(profileObj) {
    return users.then(usersCollection => {
        //console.log(loginObj);
        return usersCollection
        .findOne(profileObj)
        .then(res => 
            {
                console.log('looking for profile', res)
                return res
            })
        })
}

function getSession(sessionID) {
    return sessions.then(sessionsCollection => {
        return sessionsCollection
        .findOne({ _id: ObjectId(sessionID) })
        .catch(err => console.log(err))
    })
}

function getUser(username) {
    return users.then(userCollection => {
        return userCollection
        .findOne({ username })
    })
}

function addSession(username) {
    return sessions.then(sessionsCollection => {
        return sessionsCollection
        .insertOne({ username, createdAt: new Date() })
        .then(res => res.insertedId.valueOf())
        .catch(err => console.log(err))
    })
}

module.exports = {
    registerUser,
    loginUser,
    userProfile,
    getSession,
    getUser,
    addSession
};