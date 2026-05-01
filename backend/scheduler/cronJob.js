const cron = require('node-cron');
const { Op } = require('sequelize');
const Post = require('../models/Post');
const Setting = require('../models/Setting');
const facebookService = require('../services/facebookService');

async function getSettings() {
  const rows = await Setting.findAll();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function startScheduler() {
  cron.schedule('* * * * *', async () => {
    const duePosts = await Post.findAll({
      where: {
        status: 'pending',
        scheduled_at: { [Op.lte]: new Date() },
      },
    });

    if (!duePosts.length) return;

    const settings = await getSettings();

    for (const post of duePosts) {
      try {
        const fbId = await facebookService.publishPost(
          post.content,
          post.image_url,
          settings
        );
        await post.update({
          status: 'published',
          published_at: new Date(),
          facebook_post_id: fbId,
        });
        console.log(`[Scheduler] Published post ${post.id} → FB id: ${fbId}`);
      } catch (err) {
        await post.update({ status: 'failed', error_message: err.message });
        console.error(`[Scheduler] Failed post ${post.id}:`, err.message);
      }
    }
  });

  console.log('[Scheduler] Cron job started (every minute)');
}

module.exports = { startScheduler };
