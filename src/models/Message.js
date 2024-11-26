const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for efficient querying
messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
