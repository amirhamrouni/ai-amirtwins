const axios = require('axios');

async function generateImage(prompt) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return null;

  const response = await axios.post(
    'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
    { inputs: prompt },
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      responseType: 'arraybuffer',
    }
  );

  const base64 = Buffer.from(response.data).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

module.exports = { generateImage };
