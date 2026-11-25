const { dbState } = require('../config/db');

module.exports = (req, res) => {
  res.json({ status: 'ok', db: dbState() });
};
