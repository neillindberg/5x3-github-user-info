const express = require('express');
const app = express();
const server = require('http').Server(app);
const fetch = require('node-fetch');
const httpCodes = require('http-codes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// https://api.github.com/users/<username>/followers

const getFollowersUrl = username => `https://api.github.com/users/${username}/followers`;

const fetchWithDepth = async (username, depth = 3) => {
    const url = getFollowersUrl(username);
    return await fetch(url)
        .then(fetchResponse => fetchResponse.json())
        .then(jsonResponse => {
            depth--;
            return {
                numFollowers: jsonResponse.length,
                firstFiveFollowers: jsonResponse && jsonResponse.slice(0, 5).map(({ login }) => {
                    return depth > 0 ? {[login]: fetchWithDepth(login, depth)} : login;
                }) || []
            };
        })
        .catch(err => {
            console.log('Error fetching: ', url);
            console.log(err);
        });
};
// Get first 5 followers, 3 levels deep...
app.post('/get-5x3-report', async (req, res) => {
    const initialUsername = req.body.username;
    if (!initialUsername) res.end();
    const report = await fetchWithDepth(initialUsername);
    res.json(report);
});

server.listen(80);