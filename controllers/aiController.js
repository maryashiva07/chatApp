const ai = require("../config/gemini");

const model = "gemini-3.1-flash-lite";

const generateSuggestions = async (req, res) => {
  try {
    const { text, recentMessages = [] } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Text is required",
      });
    }

    const prompt = `

The user is currently typing:
"${text}"

Recent conversation context:
${recentMessages.slice(-5).join("\n")}

Generate exactly 3 short predictive typing suggestions.

Rules:
- Suggestions must naturally continue the user's text.
- Keep each suggestion very short.
- Maximum 6 words per suggestion.
- Use casual conversational language.
- Do not explain anything.
- Do not use numbering.
- Avoid unsafe, offensive, sexual, hateful, or harmful suggestions.
- Emojis are allowed when appropriate.

Return ONLY valid JSON:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["suggestions"],
        },
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    });

    const result = JSON.parse(response.text);

    const suggestions = Array.isArray(result.suggestions)
      ? result.suggestions
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    res.status(200).json({
      suggestions,
    });
  } catch (error) {
    console.log("AI Suggestion Error:", error);

    res.status(500).json({
      message: "Failed to generate suggestions",
    });
  }
};

const generateSmartReplies = async (req, res) => {
  try {
    const { message, recentMessages = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const prompt = `
You are an AI assistant inside a chat application.

Incoming message:
"${message}"

Recent conversation:
${recentMessages.slice(-5).join("\n")}

Generate exactly 3 short smart replies that the user could naturally send.

Rules:
- Replies must directly relate to the incoming message.
- Keep replies short and conversational.
- Maximum 8 words per reply.
- Use a casual friendly tone.
- Emojis are allowed when appropriate.
- Do not repeat the incoming message.
- Do not provide explanations.
- Avoid unsafe, offensive, sexual, hateful, or harmful content.

Return ONLY valid JSON:
{
  "replies": ["reply 1", "reply 2", "reply 3"]
}
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            replies: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["replies"],
        },
        temperature: 0.7,
        maxOutputTokens: 120,
      },
    });

    const result = JSON.parse(response.text);

    const replies = Array.isArray(result.replies)
      ? result.replies
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    res.status(200).json({
      replies,
    });
  } catch (error) {
    console.log("AI Smart Reply Error:", error);

    res.status(500).json({
      message: "Failed to generate smart replies",
    });
  }
};

module.exports = {
  generateSuggestions,
  generateSmartReplies,
};
