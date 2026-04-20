const express = require('express');
const router = express.Router();
const MoodLog = require('../models/MoodLog');

// GET all mood logs
router.get('/', async (req, res) => {
  try {
    const logs = await MoodLog.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new mood log
router.post('/', async (req, res) => {
  try {
    const log = new MoodLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
// GET mood logs for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const logs = await MoodLog.find({ userId: req.params.userId });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});