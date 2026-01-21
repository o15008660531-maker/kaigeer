import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateHealthAdvice = async (userQuery: string, historyContext?: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "请配置 API Key 以使用 AI 教练功能。";

  try {
    const systemPrompt = `
      你是一位专业的盆底肌康复理疗师和健康教练。
      你的名字叫 "KegelFlow AI"。
      你的任务是回答用户关于凯格尔运动（提肛运动）、盆底肌健康、性健康和运动恢复的问题。
      
      回答原则：
      1. 专业、科学、客观。
      2. 语气温和、鼓励性强。
      3. 回答简洁明了，避免过于晦涩的医学术语，必须使用中文回答。
      4. 如果用户询问严重的医疗症状（如剧烈疼痛、出血），请务必建议就医。
      
      用户背景信息：${historyContext || "新用户"}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    return response.text || "抱歉，我现在无法回答，请稍后再试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "连接 AI 服务时出现错误，请检查网络或稍后再试。";
  }
};