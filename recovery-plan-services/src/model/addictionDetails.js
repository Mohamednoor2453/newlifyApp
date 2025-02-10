const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addictionDetailSchema = new Schema({
    userId: {
        type:
        mongoose.Schema.Types.ObjectId,
        ref: 'User',//reference to User model
        required: true
    },

    addictionType:{
        type: String,
        required: true
        
    },
    period:{
        type: Number,
        required: true

    },
    age:{
        type: Number,
        required:true
    },
    gender:{
        type: String,
        required: true
    },
    workingwithpsychiatrist:{
        type:String,
        required: true
    },
    recoveryAttempt:{
        type: String,
        required:true

    }
})

const Detail = mongoose.model('Detail', addictionDetailSchema);
module.exports = Detail;
