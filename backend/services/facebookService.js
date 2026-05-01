const axios = require('axios');

const GRAPH_API = 'https://graph.facebook.com/v18.0';

async function publishPost(content, imageUrl, settings) {
  const token = settings.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = settings.FACEBOOK_PAGE_ID;

  if (!token || !pageId) {
    throw new Error('Facebook credentials not configured in Settings.');
  }

  let payload = { message: content, access_token: token };

  if (imageUrl) {
    const photoRes = await axios.post(`${GRAPH_API}/${pageId}/photos`, {
      url: imageUrl,
      published: false,
      access_token: token,
    });
    payload.attached_media = [{ media_fbid: photoRes.data.id }];
  }

  const res = await axios.post(`${GRAPH_API}/${pageId}/feed`, payload);
  return res.data.id;
}

module.exports = { publishPost };
