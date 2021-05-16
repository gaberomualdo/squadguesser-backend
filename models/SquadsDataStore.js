const mongoose = require('mongoose');

const SquadsDataStoreSchema = new mongoose.Schema({
  contents: {
    type: String,
    required: true,
  },
});

module.exports = SquadsDataStore = mongoose.model('squads-data-store', SquadsDataStoreSchema);
