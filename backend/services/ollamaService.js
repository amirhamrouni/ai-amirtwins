const axios = require('axios');

async function generateContent(topic, systemPrompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const response = await axios.post(`${baseUrl}/api/chat`, {
    model: 'qwen2.5:3b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `اكتب بوست فيسبوك عن: ${topic}` },
    ],
    stream: false,
  });
  return response.data.message.content.trim();
}

module.exports = { generateContent };
