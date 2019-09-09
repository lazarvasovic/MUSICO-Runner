// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Unit', new Schema({
    name: String,
    status: String,
    index: Number,
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    pathToZip: String,
    pathToResults: {
        type: String,
        default: null
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    jobId: {
        type: String,
        default: null
    },
    calculation: {
        type: Schema.Types.ObjectId,
        ref: 'Calculation'
    }
}));
