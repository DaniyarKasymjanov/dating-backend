const uri = "mongodb+srv://daniyar:111@cluster0-b2k8j.mongodb.net/dating";
const MongoClient = require('mongodb').MongoClient;
const connect = MongoClient.connect(uri, { useNewUrlParser: true });
const db = connect.then(client => client.db('dating'));
const users = db.then(dbo => dbo.collection("users"))


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

module.exports = { registerUser, loginUser, userProfile }