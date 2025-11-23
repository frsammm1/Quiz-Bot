
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionData, Subject, QuizMode, MathsDifficulty } from "../types";

// IMPORTANT: Hardcoding the API key as requested.
const API_KEY = "AIzaSyANKwxX5ZxpGX0VhiNT2-yiYzSlfEl37oA";

// --- OFFLINE DATABASE (Fallback for Scale) ---
// This ensures the app NEVER crashes even if millions of users hit the API limit.
// In a real production app, this could be fetched from a JSON file on a CDN.

const OFFLINE_DB = {
  English: [
    {
      question: "Select the most appropriate option to substitute the underlined segment in the given sentence. If no substitution is required, select 'No improvement'. She is one of the most intelligent students that <u>has ever attended</u> this school.",
      options: ["have ever attended", "has been ever attending", "had ever attended", "No improvement"],
      correct: 0,
      explanation: "The relative pronoun 'that' refers to the antecedent 'students' (plural). Therefore, the verb must be plural ('have'). Correct sentence: 'She is one of the most intelligent students that have ever attended this school'."
    },
    {
      question: "Identify the segment in the sentence which contains a grammatical error. <br/> The river has overflown its banks due to heavy rain.",
      options: ["The river has", "overflown its banks", "due to", "heavy rain"],
      correct: 1,
      explanation: "The past participle of 'overflow' is 'overflowed', not 'overflown'. 'Overflown' is the past participle of 'overfly'. Correct: 'The river has overflowed its banks'."
    },
    {
      question: "Select the appropriate synonym for the word: <b>CANDID</b>",
      options: ["Deceptive", "Frank", "Secretive", "Reserved"],
      correct: 1,
      explanation: "<b>Candid</b> means truthful and straightforward; frank. <br/>Deceptive means misleading.<br/>Secretive means not open.<br/>Reserved means slow to reveal emotion."
    },
    {
      question: "Select the correct indirect form of the given sentence.<br/>He said to me, 'What are you doing?'",
      options: ["He asked me what I was doing.", "He asked me what was I doing.", "He asked me what am I doing.", "He told me what I was doing."],
      correct: 0,
      explanation: "In Interrogative sentences reporting verb 'said to' is changed to 'asked'. The question form is changed to statement form (Subject + Verb). 'Are you doing' (Present Continuous) changes to 'was doing' (Past Continuous)."
    },
    {
      question: "Select the correctly spelt word.",
      options: ["Accomodation", "Accommodation", "Acommodation", "Acomodation"],
      correct: 1,
      explanation: "The correct spelling is <b>Accommodation</b> (double 'c', double 'm')."
    }
  ],
  GK: [
    {
      question: "Who was the first Governor-General of independent India? || स्वतंत्र भारत के प्रथम गवर्नर-जनरल कौन थे?",
      options: ["C. Rajagopalachari || सी. राजगोपालाचारी", "Lord Mountbatten || लॉर्ड माउंटबेटन", "Rajendra Prasad || राजेंद्र प्रसाद", "Jawaharlal Nehru || जवाहरलाल नेहरू"],
      correct: 1,
      explanation: "Lord Mountbatten was the first Governor-General of independent India (1947-48). C. Rajagopalachari was the first and last Indian Governor-General (1948-50). || लॉर्ड माउंटबेटन स्वतंत्र भारत के पहले गवर्नर-जनरल (1947-48) थे। सी. राजगोपालाचारी पहले और अंतिम भारतीय गवर्नर-जनरल (1948-50) थे।"
    },
    {
      question: "Which Article of the Indian Constitution deals with the abolition of Untouchability? || भारतीय संविधान का कौन सा अनुच्छेद अस्पृश्यता के उन्मूलन से संबंधित है?",
      options: ["Article 16 || अनुच्छेद 16", "Article 17 || अनुच्छेद 17", "Article 18 || अनुच्छेद 18", "Article 21 || अनुच्छेद 21"],
      correct: 1,
      explanation: "<b>Article 17</b> abolishes 'untouchability' and forbids its practice in any form. || <b>अनुच्छेद 17</b> 'अस्पृश्यता' को समाप्त करता है और किसी भी रूप में इसके अभ्यास को रोकता है।"
    },
    {
      question: "Where is the headquarters of ISRO located? || इसरो (ISRO) का मुख्यालय कहाँ स्थित है?",
      options: ["New Delhi || नई दिल्ली", "Mumbai || मुंबई", "Bengaluru || बेंगलुरु", "Chennai || चेन्नई"],
      correct: 2,
      explanation: "The headquarters of Indian Space Research Organisation (ISRO) is in <b>Bengaluru</b>. It was formed in 1969. || भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) का मुख्यालय <b>बेंगलुरु</b> में है। इसका गठन 1969 में हुआ था।"
    },
    {
      question: "Which acid is present in Ant stings? || चींटी के डंक में कौन सा अम्ल होता है?",
      options: ["Formic Acid || फार्मिक अम्ल", "Acetic Acid || एसिटिक अम्ल", "Citric Acid || साइट्रिक अम्ल", "Lactic Acid || लैक्टिक अम्ल"],
      correct: 0,
      explanation: "Ant stings contain <b>Formic Acid</b> (Methanoic acid). This causes the burning sensation. || चींटी के डंक में <b>फार्मिक अम्ल</b> (मेथेनोइक अम्ल) होता है। इसी कारण जलन होती है।"
    }
  ],
  Maths: [
    {
      question: "If x + 1/x = 4, then find the value of x^2 + 1/x^2. || यदि x + 1/x = 4 है, तो x^2 + 1/x^2 का मान ज्ञात कीजिए।",
      options: ["14", "16", "12", "18"],
      correct: 0,
      explanation: "Formula: If x + 1/x = k, then x^2 + 1/x^2 = k^2 - 2. <br/> Here, k = 4. <br/> So, 4^2 - 2 = 16 - 2 = <b>14</b>. || सूत्र: यदि x + 1/x = k, तो x^2 + 1/x^2 = k^2 - 2. <br/> यहाँ, k = 4. <br/> अतः, 4^2 - 2 = 16 - 2 = <b>14</b>."
    },
    {
      question: "A alone can do a piece of work in 6 days and B alone in 8 days. A and B undertook to do it for Rs. 3200. With the help of C, they completed the work in 3 days. How much is to be paid to C? || A अकेले एक काम को 6 दिनों में और B अकेले 8 दिनों में कर सकता है। A और B ने इसे 3200 रुपये में करने का जिम्मा लिया। C की मदद से, उन्होंने 3 दिनों में काम पूरा कर लिया। C को कितना भुगतान किया जाना चाहिए?",
      options: ["Rs. 375", "Rs. 400", "Rs. 600", "Rs. 800"],
      correct: 1,
      explanation: "C's 1 day work = 1/3 - (1/6 + 1/8) = 1/3 - 7/24 = 1/24. <br/> Ratio of work done by A:B:C = 1/6 : 1/8 : 1/24 = 4:3:1. <br/> C's share = (1/8) * 3200 = <b>Rs. 400</b>."
    },
    {
      question: "The marked price of an article is Rs. 500. It is sold at a discount of 20%. If the profit is 25%, find the cost price. || एक वस्तु का अंकित मूल्य 500 रुपये है। इसे 20% की छूट पर बेचा जाता है। यदि लाभ 25% है, तो क्रय मूल्य ज्ञात कीजिए।",
      options: ["Rs. 300", "Rs. 320", "Rs. 350", "Rs. 375"],
      correct: 1,
      explanation: "SP = 500 * (80/100) = Rs. 400. <br/> CP = SP * (100 / (100 + Profit%)) <br/> CP = 400 * (100/125) = 400 * 4/5 = <b>Rs. 320</b>."
    }
  ],
  Vocab_Booster: [
    {
      question: "Select the most appropriate antonym of the given word: <b>OBSTRUCT</b>",
      options: ["Block", "Prevent", "Assist", "Hamper"],
      correct: 2,
      explanation: "<b>Obstruct</b> means to block or get in the way of. <br/><b>Assist</b> means to help or make easier, which is the opposite."
    },
    {
      question: "Select the most appropriate synonym of the given word: <b>LETHARGIC</b>",
      options: ["Active", "Lazy", "Sharp", "Bright"],
      correct: 1,
      explanation: "<b>Lethargic</b> means lacking energy or enthusiasm. <br/><b>Lazy</b> is the closest synonym. Active, Sharp, and Bright are antonyms."
    },
    {
      question: "One who knows everything.",
      options: ["Omnipresent", "Omnipotent", "Omniscient", "Gullible"],
      correct: 2,
      explanation: "<b>Omniscient</b>: Knowing everything. <br/>Omnipresent: Present everywhere. <br/>Omnipotent: Having unlimited power."
    }
  ]
};

// ------------------------------------------------------------------

const ENGLISH_TOPICS = [
  "Grammar Error Detection", "Synonyms", "Antonyms", "Idioms & Phrases", 
  "One Word Substitution", "Spelling Correction", "Sentence Improvement", 
  "Fill in the Blanks (Cloze Test style)",
  "Active/Passive Voice",
  "Direct/Indirect Speech (Narration)",
  "Sentence Rearrangement",
  "Punctuation Rules"
];

const GK_TOPICS = [
  "Indian History", "Geography (Indian & World)", "Indian Polity & Constitution", 
  "Indian Economy", "General Science (Physics, Chemistry, Bio)", 
  "Current Affairs (Recent 6-12 months)", 
  "Static GK (Books & Authors, Awards & Honors, Important Days, Sports)"
];

const MATHS_TOPICS = [
  "Percentage", "Profit and Loss", "Simple & Compound Interest", "Ratio and Proportion", 
  "Time and Work", "Time, Speed and Distance", "Average", "Algebra", 
  "Geometry", "Trigonometry", "Number System"
];

const VOCAB_BOOSTER_TOPICS = [
  "Synonyms", "Antonyms", "Idioms & Phrases", "One Word Substitution", "Spelling Correction"
];


// Utility to clean JSON string if it's wrapped in markdown
const cleanJsonString = (str: string): string => {
  // Remove ```json and ``` or just ```
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned.trim();
};

const getPYQBasedPrologue = (subject: Subject) => {
  let subjectDescription = '';
  let languageConstraint = '';

  switch (subject) {
    case 'English':
    case 'Vocab Booster':
      subjectDescription = 'English';
      languageConstraint = 'Language: STRICTLY ENGLISH ONLY. Do NOT use Hindi.';
      break;
    case 'GK':
      subjectDescription = 'bilingual (Hindi || English) General Knowledge';
      languageConstraint = 'Language: BILINGUAL (Hindi || English).';
      break;
    case 'Maths':
      subjectDescription = 'bilingual (Hindi || English) Quantitative Aptitude (Maths)';
      languageConstraint = 'Language: BILINGUAL (Hindi || English).';
      break;
  }
  return `
    You are an expert SSC exam question creator. Your task is to generate a single question that is stylistically and structurally identical to an authentic Previous Year Question (PYQ) from the SSC CGL or CHSL exams.
    
    CRITICAL CONSTRAINTS:
    1.  **STYLE & DIFFICULTY**: The question's difficulty, tone, and format must perfectly match real exam questions from 2018-2024. It should feel like it was taken directly from a real paper.
    2.  **TOPIC ACCURACY**: The question must be highly relevant to the provided topic.
    3.  **JSON ONLY**: The output must be strictly valid JSON.
    4.  **LANGUAGE**: ${languageConstraint}
    
    Generate a ${subjectDescription} question for the topic: 
  `;
};

// --- OFFLINE FALLBACK FUNCTION ---
const getOfflineQuestion = (subject: Subject): QuestionData => {
  let pool = [];
  switch (subject) {
    case 'English': pool = OFFLINE_DB.English; break;
    case 'GK': pool = OFFLINE_DB.GK; break;
    case 'Maths': pool = OFFLINE_DB.Maths; break;
    case 'Vocab Booster': pool = OFFLINE_DB.Vocab_Booster; break;
    default: pool = OFFLINE_DB.English;
  }

  const randomQ = pool[Math.floor(Math.random() * pool.length)];
  
  return {
    id: `offline_${Date.now()}_${Math.random()}`,
    subject: subject,
    mode: 'quiz', // Default to quiz mode for offline
    question: randomQ.question,
    options: randomQ.options,
    correctIndex: randomQ.correct,
    explanation: randomQ.explanation
  };
};


export const generateQuestion = async (subject: Subject, mode: QuizMode, difficulty: MathsDifficulty = 'moderate'): Promise<QuestionData> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const isPYQ = mode === 'pyq';

  let topics: string[] = [];
  let prompt: string = '';

  switch (subject) {
    case 'English': topics = ENGLISH_TOPICS; break;
    case 'GK': topics = GK_TOPICS; break;
    case 'Maths': topics = MATHS_TOPICS; break;
    case 'Vocab Booster': topics = VOCAB_BOOSTER_TOPICS; break;
  }
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  // --- PROMPTS ---
  const englishPrompt = `
      Generate a unique, challenging SSC CGL/CHSL Tier-1 level English question.
      Topic: ${randomTopic}.
      Focus: Strictly relevant to SSC CGL Previous Year Question patterns.
      Language: STRICTLY ENGLISH ONLY. Do NOT provide Hindi translations or use '||' separators. The entire output (question, options, explanation) must be in English.
      Format: JSON.
      Constraints: 1. Grammar must be impeccable. 2. Options must be unambiguous. 3. Explanation must be detailed and in English only.
      Instruction for specific topics: - If topic is "Active/Passive Voice" OR "Direct/Indirect Speech": Provide a sentence and ask to select the correct conversion. - If topic is "Sentence Rearrangement": Provide 4 parts (P, Q, R, S) and ask for the correct order.
      IMPORTANT formatting: - Use HTML tags <u> to underline key words/idioms if needed. - Use <b> for bolding emphasis. - Do NOT use markdown.
    `;

  const gkPrompt = `
      Generate a unique, factual SSC CGL/CHSL Tier-1 level General Knowledge question.
      Topic: ${randomTopic}. Language: BILINGUAL (Hindi and English combined). Format: JSON.
      Structure: - Question: "Hindi Text || English Text" - Options: "Hindi Option || English Option" - Explanation: "Hindi Explanation || English Explanation"
      Constraints: 1. FACTS MUST BE 100% ACCURATE. 2. Hindi translation must be NATURAL and Grammatically correct. 3. Use <b> tags to highlight important years or names in the explanation. 4. Use '||' as a separator.
    `;
    
  const mathsPrompt = (difficulty: MathsDifficulty) => `
      Generate a unique, challenging SSC CGL/CHSL Tier-1 level Quantitative Aptitude (Maths) question with a ${difficulty} difficulty.
      Topic: ${randomTopic}. Language: BILINGUAL (Hindi and English combined). Format: JSON.
      Structure: - Question: "Hindi Text || English Text" - Options: "Hindi Option || English Option" - Explanation: "Hindi Explanation || English Explanation"
      CRITICAL: Represent mathematical expressions using simple text characters. - Use '^' for exponents (e.g., x^2). - Use '*' for multiplication and '/' for division. - Use 'sqrt()' for square roots.
      Constraints: 1. The question and solution must be mathematically correct. 2. The explanation must show the formula used and the step-by-step calculation. 3. Use <b> tags to highlight the final answer or key formulas in the explanation. 4. Use '||' as a separator.
    `;

  const vocabBoosterPrompt = `
      Generate a focused SSC CGL/CHSL Tier-1 level English Vocabulary question.
      Topic: ${randomTopic}. Format: JSON.
      Language: STRICTLY ENGLISH ONLY. Do NOT provide Hindi translations or use '||' separators.
      Constraints: 1. Must test a non-trivial vocabulary word. 2. Explanation must provide the meaning, a synonym, an antonym, and an example sentence in English. 3. Use <u> to underline the word being tested. 4. Use <b> for bolding emphasis in the explanation.
    `;

  if (isPYQ) {
    prompt = `${getPYQBasedPrologue(subject)}${randomTopic}`;
     if (subject === 'Maths') {
      prompt += ` The question difficulty should be ${difficulty}.`;
    }
  } else {
    switch (subject) {
      case 'English': prompt = englishPrompt; break;
      case 'GK': prompt = gkPrompt; break;
      case 'Maths': prompt = mathsPrompt(difficulty); break;
      case 'Vocab Booster': prompt = vocabBoosterPrompt; break;
    }
  }

  const systemInstruction = isPYQ
    ? `You are an SSC exam question simulation engine. Output must be perfectly structured JSON. For English and Vocab subjects, strictly output ONLY English.`
    : `You are an expert SSC CGL/CHSL Exam Question Setter. Your primary goal is ACCURACY and RELEVANCE. All questions must strictly adhere to the difficulty and pattern of the SSC CGL & CHSL Tier-1 examinations. Never generate a question with grammatical errors. Never generate factually incorrect GK questions. Always output strictly valid JSON without markdown formatting blocks. For English and Vocab Booster subjects, strictly output ONLY English.`;

  const schema: any = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correct: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
        explanation: { type: Type.STRING }
      },
      required: ["question", "options", "correct", "explanation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const cleanedText = cleanJsonString(text);
    
    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw Text:", text);
      throw new Error("Failed to parse question data");
    }

    const questionData: QuestionData = {
      id: Date.now().toString() + Math.random(),
      subject,
      mode,
      question: data.question,
      options: data.options,
      correctIndex: data.correct,
      explanation: data.explanation,
    };

    if (subject === 'Maths') {
      questionData.difficulty = difficulty;
    }

    return questionData;

  } catch (error) {
    console.warn("Gemini API failed or quota exceeded. Switching to Offline Database.", error);
    
    // FALLBACK TO OFFLINE DATABASE
    // This guarantees the user ALWAYS gets a question, even if the API is down/limited.
    const offlineQ = getOfflineQuestion(subject);
    if (subject === 'Maths') offlineQ.difficulty = difficulty;
    // Add a tiny delay to simulate network to keep UX consistent
    await new Promise(resolve => setTimeout(resolve, 600)); 
    return offlineQ;
  }
};
