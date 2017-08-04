/**
 * Created by imacbig04 on 4/28/17.
 */

var express = require('express');
var app = express();


var mysql = require('mysql');

// http://nodejs.org/docs/v0.6.5/api/fs.html#fs.writeFile
var fs = require('fs');

var connection = mysql.createConnection({
    multipleStatements: true,
    host: '127.0.0.1',
    user: 'AppUser',
    password: 'Special888%',
    database: 'whs'
});

var names = "";

/*
app.use(express.static('public'));
app.get('/index.htm', function (req, res) {
    res.sendFile( __dirname + "/" + "index.htm" );
});
*/


app.get('/search', function (req, res) {
    "use strict";
    names = req.query.keywords;
    //console.log(names);
    connection.query('select * from Country Where ContinentCode <> "" AND CountryName = ?', [names], function(err, results, fields) {
        if(err) throw err;

        // Prepare output in JSON format

        var JSONresult = JSON.stringify(results, null, "\t");

        //console.log(JSONresult);

        // setHeader
        var origin = req.headers.origin;
        res.setHeader("Access-Control-Allow-Origin", origin);

        if (results[0] == null) {
             connection.query('select * from Continent Where ContinentName = ?', [names], function(err, results, fields) {
                if(err) throw err;
                JSONresult = JSON.stringify(results, null, "\t");
                //console.log(JSONresult);

                if (results[0] == null) {
                    names = "%" + req.query.keywords + "%";
                    connection.query('select * from Sites Where SiteName LIKE ?', [names], function(err, results, fields) {
                        if(err) throw err;
                        JSONresult = JSON.stringify(results, null, "\t");
                        //console.log(JSONresult);

                        if (results[0] == null) {
                            //res.send("No Result");
                            res.status(503).send('No Search Result');
                            res.end();
                        } else {
                            //console.log(JSONresult);
                            res.send(JSONresult);
                            res.end();
                        }
                    })
                } else {
                    //console.log(JSONresult);
                    res.send(JSONresult);
                    res.end();
                }
             });

        } else {
            //console.log(JSONresult);
            res.send(JSONresult);
            res.end();
        }
    });

});

app.get('/searchCountry', function (req, res) {
    "use strict";
    connection.query('Select CountryCode, CountryName, ContinentCode From Country Where ContinentName <> "" ', function(err, results, fields) {
        if (err) throw err;

        var JSONresult = JSON.stringify(results, null, "\t");
        //console.log(JSONresult);

        var origin = req.headers.origin;
        res.setHeader("Access-Control-Allow-Origin", origin);

        res.send(JSONresult);
        res.end();
    });
});

app.get('/searchSite', function (req, res) {
    "use strict";

    var sql1 = 'Select SiteID, CountryCode, CountryName, ContinentCode, CorrectLatiDecimal AS LatiDecimal, CorrectLongDecimal AS LongDecimal From Sites WHERE CorrectLatiDecimal <> 0 and CorrectLongDecimal <> 0; ';
    var sql2 = 'Select SiteID, CountryCode, CountryName, ContinentCode, LatiDecimal, LongDecimal From Sites WHERE CorrectLatiDecimal = "" AND CorrectLongDecimal = ""; ';
    var sql3 = 'Select * from Continent; ';
    var sql4 = 'Select CountryCode from Country WHERE ContinentCode = "NA"; ';
    var sql5 = 'SELECT Count(SiteID) FROM Sites; ';

    connection.query(sql1+sql2, function(err, results, fields) {
        if (err) throw err;

        var result1 = results[0];
        var result2 = results[1];
        var resultsAll = result1.concat(result2);
        var JSONresult = JSON.stringify(resultsAll, null, "\t");
        //console.log(JSONresult);
        var origin = req.headers.origin;
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.send(JSONresult);
        res.end();

    });
});

app.get('/autoSuggestion', function (req, res) {

    "use strict";
    var sql1 = 'Select ContinentName AS value from Continent; ';
    var sql2 = 'Select CountryName AS value from Country Where ContinentCode <> ""; ';
    var sql3 = 'Select SiteName AS value from Sites; ';

    connection.query(sql1+sql2+sql3, function(err, results, fields) {
        if (err) throw err;

        var result1 = results[0];
        var result2 = results[1];
        var result3 = results[2];
        var resultsAll = result1.concat(result2).concat(result3);
        var JSONresult = JSON.stringify(resultsAll, null, "\t");
        //console.log(JSONresult.length);
        //console.log(JSONresult);

        var origin = req.headers.origin;
        res.setHeader("Access-Control-Allow-Origin", origin);

        res.send(JSONresult);
        res.end();

    });
});

app.get('/popup', function (req, res) {
    "use strict";
    connection.query('SELECT SiteID, SiteName, SiteDescription, SiteURL, PicPath FROM Sites', function(err, results, fields){
        if (err) throw err;
        var JSONresult = JSON.stringify(results, null, "\t");
        //console.log(JSONresult);

        var origin = req.headers.origin;
        res.setHeader("Access-Control-Allow-Origin", origin);

        res.send(JSONresult);
        res.end();
    });
});

var server = app.listen(9083, function () {
    "use strict";
    var host = server.address().address;
    var port = server.address().port;
    console.log("SmartSearch app is listening at http://%s:%s", host, port)

});