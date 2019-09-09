// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Calculation', new Schema({ 
    name: String,
    status: String,
    startTime: {
        type: Date,
        default: null 
    },
    endTime: {
        type: Date,
        default: null 
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}));