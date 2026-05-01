const Groq = require('groq-sdk');
const ollamaService = require('./ollamaService');

const SYSTEM_PROMPT = `أنت خبير في إنشاء محتوى للفيسبوك بالدارجة التونسية.
المحتوى يكون طبيعي، مضحك أو مفيد، يمزج بين العربية والفرنسية كما يتكلم التونسيين.
استخدم emoji بشكل معقول لجذب الانتباه.
لا تكتب أكثر من 280 كلمة.
لا تضيف أي تفسيرات أو مقدمات، فقط البوست مباشرة.`;

async function generateContent(topic) {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    try {
      const client = new Groq({ apiKey: groqKey });
      const completion = await client.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama3-70b-8192',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `اكتب بوست فيسبوك عن: ${topic}` },
        ],
        temperature: 0.8,
        max_tokens: 400,
      });
      return completion.choices[0].message.content.trim();
    } catch (err) {
      console.error('[Groq] Error, falling back to Ollama:', err.message);
    }
  }

  return ollamaService.generateContent(topic, SYSTEM_PROMPT);
}

module.exports = { generateContent };
