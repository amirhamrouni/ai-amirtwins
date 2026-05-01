const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Post = require('../models/Post');

router.get('/', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, publishedToday, pending, failed] = await Promise.all([
    Post.count(),
    Post.count({ where: { status: 'published', published_at: { [Op.gte]: today } } }),
    Post.count({ where: { status: 'pending' } }),
    Post.count({ where: { status: 'failed' } }),
  ]);

  res.json({ total, publishedToday, pending, failed });
});

module.exports = router;
