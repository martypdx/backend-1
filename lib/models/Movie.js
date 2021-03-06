const mongoose = require('mongoose');
const { Schema } = mongoose;

const RequiredString = {
    type: String,
    required: true
};

const schema = new Schema({
    // you can assign id, so use the movieId as the mongo _id
    _id: RequiredString,
    title: RequiredString,
    // movieId: RequiredString,
    poster: String,
    description: String
});

schema.static('exists', function (query) {
    return this.find(query)
        .count()
        .then(count => (count > 0));
});

module.exports = mongoose.model('Movie', schema);

