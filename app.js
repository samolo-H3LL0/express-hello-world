const express = require('express');
const axios = require('axios');
const  { validateUrl } = require('youtube-validate');
const fileupload = require("express-fileupload");
const { encode, decodeToString } = require('base-unicode');
const path = require('path');
const mysql = require('mysql');
const res = require('express/lib/response');
const { decode } = require('punycode');
const app = express();

const key = process.env.KEY

require('dotenv').config()

var connection = mysql.createPool({
    host: 'remotemysql.com',
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});



app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
app.use(fileupload());


app.get('/', (req, res) => {
    res.render(__dirname + '/views/index.ejs')
})

app.get('/interaction', (req, res) => {
    connection.query('SELECT * FROM facts_interaction WHERE 1', function (error, results, fields) {
        if (error) throw error;
        var html = '';  
        for (var i = 0; i < results.length; i++) {  
            html+=`
            <div id="special">
            <img src="http://localhost:3000/thumbnails/${results[i].image}" alt="lol">
            <h2>${results[i].title}</h2>
            <p>${results[i].fact}</p>
            </div>
            `;
        }
        connection.query('SELECT * FROM videos_interaction WHERE 1', async function (error, results){
            if (error) throw error;
            var html2 = '';  
            for (var i = 0; i < results.length; i++) {  
                html2+=`
                <div>
                ${results[i].url}
                </div>
                `;
            }
            res.render(__dirname + '/views/interaction/interaction.ejs', {interaction: html, videos: html2})
        })
        
    })
})

app.get('/admin_interaction', (req, res) => {
    if(req.query.err === '1') {
        res.render(__dirname + '/views/interaction/admin_interaction.ejs', {warning: 'Please, enter a valid key!'})
    } else {
        res.render(__dirname + '/views/interaction/admin_interaction.ejs', {warning: ' '})
    }
})

/*
app.get('/panel_interaction', (req, res) => {
    if(req.query.k === process.env.KEY) {
        res.render(__dirname + '/views/interaction/panel_interaction.ejs', { warning: '  ' })
    } else {
        res.redirect('/admin_interaction?err=1')
    }
    
})
*/

app.post('/login', function(req, res){
    const keyProvided = req.body.login;
    if(keyProvided === process.env.KEY) {
        res.render(__dirname + '/views/interaction/panel_interaction.ejs', { warning: '  ' })
    } else {
        res.redirect('/admin_interaction?err=1')
    }
})

app.post("/upload", function(req, res){
    let file;
    if(!req.files)
    {
        return;
    }

    file = req.files.image; 
    
    const filePath = path.join(__dirname, '/assets', 'thumbnails', `${file.name}`)
    file.mv(filePath, function(err) {
        if(err) {
            console.log(err);
        } else { 
            console.log("uploaded");
        }
      });
    file.mv(filePath, function (err) {
        if (err) return res.status(500).send(err); // ?
        connection.query(
            'INSERT INTO `facts_interaction`(`id`, `image`, `title`, `fact`) VALUES (null, "' +  req.files.image.name + '", "' + req.body.title + '",' + '"' + req.body.content + '")', [req.files.image.name], (err, rows) => {     
            if (!err) {
                res.render(__dirname + '/views/interaction/video/panel_interaction.ejs', {warning: '  '})

            } else {
                console.log(err);
            }
      
        })
    }); 
    console.log(req.files.image.name)
    console.log(req.body.title);
    console.log(req.body.content);
});


app.post("/upload_video", function(req, res){
    const keyProvided = process.env.KEY;
    validateUrl(req.body.url)
    .then(results => {
        connection.query('INSERT INTO `videos_interaction`(`id`, `url`) VALUES (null, \'<iframe width="560" height="315" src="https://www.youtube.com/embed/' + results + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\')', (err, rows) => {     
            if (!err) {
                res.render(__dirname + '/views/interaction/video/panel_video_interaction.ejs', {warning: '  '})
            }
        })
    }).catch(e => {
        console.log(e)
        res.render(__dirname + '/views/interaction/video/panel_video_interaction.ejs', {warning: 'Please, enter a valid video ID!'})

    })
    /*
    
    }) */
});

/*
app.get('/panel_video_interaction', (req, res) => {
    if(req.query.k === process.env.KEY) {
        res.render(__dirname + '/views/interaction/video/panel_video_interaction.ejs', {warning: ' '})
    } else if (req.query.k === process.env.KEY && req.query.e === '1') {
        res.render(__dirname + '/views/interaction/video/panel_video_interaction.ejs', {warning: 'Please enter a valid video ID!'})
    }
    
})
*/

app.get('/admin_video_interaction', (req, res) => {
    if(req.query.err === '1') {
        res.render(__dirname + '/views/interaction/video/admin_video_interaction.ejs', {warning: 'Please, enter a valid key!'})
    } else {
        res.render(__dirname + '/views/interaction/video/admin_video_interaction.ejs', {warning: ' '})
    }
})


app.post('/login_video', function(req, res){
    const keyProvided = req.body.login;
    if(keyProvided === process.env.KEY) {
        res.render(__dirname + '/views/interaction/video/panel_video_interaction.ejs', { warning: '  ' })
    } else {
        res.redirect('/admin_video_interaction?err=1')
    }
})

app.get('/login', (req, res) => {
    res.redirect('/admin_interaction?err=1')
})
