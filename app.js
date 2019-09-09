const http = require('http'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    cron = require('node-cron');

// Create global app object
const app = express();

const config = require('./config'); // get our config file

// Connencting to database
mongoose.set('useCreateIndex', true);
mongoose.connect(config.database, { useNewUrlParser: true });

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cors handling
app.use(cors());

app.use('/api/users', require('./api/users'));
app.use('/api/calcs', require('./api/calcs'));

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        'errors': {
            message: err.message,
            error: {}
        }
    });
});

const updateCalcsProgress = require('./controllers/calc').updateCalcsProgress;

cron.schedule('*/10 * * * * *', function () {
    updateCalcsProgress(function (err, data) {
        if (err) {
            console.log("Internal err!", err);
        } else {
            console.log("Updated calculations progress");
        }
    });
});

// finally, let's start our server...
const server = app.listen(process.env.PORT || 3000, function () {
    console.log('Listening on port ' + server.address().port);
});

const clientApp = express();
clientApp.use(express.static(path.join(__dirname, 'angular-client')));
clientApp.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'angular-client', 'index.html'));
});

const clientServer = clientApp.listen(4200, function () {
    console.log('Listening clientApp on port ' + clientServer.address().port);
});
