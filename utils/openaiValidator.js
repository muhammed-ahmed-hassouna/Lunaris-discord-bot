const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function validateGuess(guess, correctAnswer) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `أنت مدقق لعبة. قم بتحليل التخمين والإجابة التالية:
    التخمين: "${guess}"
    الإجابة الصحيحة: "${correctAnswer}"
    هل يجب قبول التخمين؟

    يجب الأخذ بعين الاعتبار:
    1. التطابق المباشر
    2. الأسماء 
    3. الأخطاء الإملائية (بتسامح ±2 حرف)
    4. المكافئات الثقافية

    IMPORTANT: Respond in Arabic using this exact format:
    التحليل: [تحليلك هنا]
    النتيجة: نعم/لا`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let reasoning = "";
    let isValid = false;

    if (!response) {
      throw new Error("لا يوجد رد من Gemini");
    }

    // Parse Arabic response
    if (response.includes("التحليل:") && response.includes("النتيجة:")) {
      const parts = response.split("النتيجة:");
      if (parts.length >= 2) {
        const answer = parts[parts.length - 1].trim();
        isValid = answer.includes("نعم");
        
        reasoning = parts[0]
          .replace("التحليل:", "")
          .trim();
      } else {
        throw new Error("تنسيق الرد غير صالح");
      }
    } else {
      // Fallback: Check for Arabic yes/no
      isValid = response.includes("نعم");
      reasoning = "تحليل الرد المباشر";
    }

    return {
      isValid,
      reasoning,
      rawResponse: response,
    };
  } catch (error) {
    console.error("خطأ في التحقق من Gemini:", error);
    return {
      isValid: guess.toLowerCase() === correctAnswer.toLowerCase(),
      reasoning: "خطأ في API - الرجوع إلى المطابقة الدقيقة",
      rawResponse: error.message,
    };
  }
}

module.exports = { validateGuess };