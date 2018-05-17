const uri = "mongodb+srv://daniyar:111@cluster0-b2k8j.mongodb.net/dating";
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;
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
    return users.then(usersCollection => {
        return usersCollection
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

function getBirthday(age) {
    const now = new Date();
    return new Date(now.setFullYear( now.getFullYear() - age));
}

//needs parameter of the form {from: 20, to: 40}
function searchAge(age) {
    const gteBirthday = getBirthday(age.to);
    const lteBirthday = getBirthday(age.from);
    return users.then(usersCollection => {
        return usersCollection
        .find({
            birthday: { $gte: gteBirthday, $lte: lteBirthday }
        })
        .toArray()
    })
}

//needs parameter of the form {gender: 'Male', city: 'Paris'}
function searchFields(fields) {
    return users.then(usersCollection => {
        return usersCollection
        .find({
            $and: Object.keys(fields).map(key => ({ [key]: fields[key] })),
        })
        .toArray()
    })
}

//used by searchInputs
function searchInput(input) {
    return users.then(usersCollection => {
        return usersCollection
        .find({
            $or: ['city', 'interests', 'about', 'lookingFor'].map(key => ({
                [key]: { $regex: new RegExp(input, 'gi') }
                }))
        })
        .toArray()
    })
}

function flatten(arr) {
    return arr.reduce((acc,curr) => {
        return [...acc, ...curr];
    }, []);
}

//needs parameter of the form ['cinema', 'hockey']
async function searchInputs(inputs) {
    let results = inputs.map(input => searchInput(input));
    results = await Promise.all(results);
    results = results.filter(arr => arr.length > 0);
    results = flatten(results);
    if (inputs.length > 1) return getDuplicates(results);
    return results;
}

function getDuplicates(arr) {
    let hashMap = {};
    let filteredResults = [];
    arr.forEach(obj => {
        const stringified = JSON.stringify(obj);
        if(hashMap[stringified] === 1) {
            filteredResults.push(obj)
            hashMap[stringified] += 1;
        } else {
            hashMap[stringified] = 1;
        }
    })
    return filteredResults;
}

async function search(searchObj) {
    let searchPromises = [];
    let dupCount = -1;
    if(searchObj.age) {
        searchPromises = searchPromises.concat(searchAge(searchObj.age));
        dupCount++;
    }
    if(searchObj.searchInput) {
        searchPromises = searchPromises.concat(searchInputs(searchObj.searchInput));
        dupCount++;
    }
    if(searchObj.fields) {
        searchPromises = searchPromises.concat(searchFields(searchObj.fields));
        dupCount++;
    }
    let searchResults = await Promise.all(searchPromises);
    searchResults = flatten(searchResults);
    if(dupCount >= 1) return getDuplicates(searchResults);
    return searchResults;
}


module.exports = {
    registerUser,
    loginUser,
    userProfile,
    getSession,
    getUser,
    addSession,
    search,
};