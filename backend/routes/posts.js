const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Setting = require('../models/Setting');
const facebookService = require('../services/facebookService');

router.get('/', async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  const posts = await Post.findAll({ where, order: [['scheduled_at', 'DESC']] });
  res.json(posts);
});

router.post('/', async (req, res) => {
  try {
    const { topic, content, image_url, scheduled_at } = req.body;
    const post = await Post.create({ topic, content, image_url, scheduled_at });
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.update(req.body);
  res.json(post);
});

router.delete('/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  await post.destroy();
  res.json({ success: true });
});

router.post('/:id/publish', async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });

  const rows = await Setting.findAll();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  try {
    const fbId = await facebookService.publishPost(post.content, post.image_url, settings);
    await post.update({ status: 'published', published_at: new Date(), facebook_post_id: fbId });
    res.json(post);
  } catch (err) {
    await post.update({ status: 'failed', error_message: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
