const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

router.get('/', async (req, res) => {
  const rows = await Setting.findAll();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json(settings);
});

router.post('/', async (req, res) => {
  const entries = Object.entries(req.body);
  await Promise.all(
    entries.map(([key, value]) =>
      Setting.upsert({ key, value })
    )
  );
  res.json({ success: true });
});

module.exports = router;
