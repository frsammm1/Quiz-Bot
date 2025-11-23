import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal, Box, List } from 'lucide-react';

const BOT_PY_CODE = `import logging
import os
import json
import asyncio
import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler
import requests

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Environment Variables
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not TOKEN or not GEMINI_API_KEY:
    logger.error("Missing Environment Variables! Please check TELEGRAM_BOT_TOKEN and GEMINI_API_KEY.")
    exit(1)

# Gemini API Configuration
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

# --- PROMPTS ---

AI_ENGLISH_PROMPT = "Generate a unique, challenging SSC CGL/CHSL English question on topics like Grammar, Synonyms, Active/Passive Voice, etc. Format as JSON with question, options (list), correct (int), and explanation. Use <b>/<u> HTML tags for emphasis."
AI_GK_PROMPT = "Generate a unique, factual SSC CGL/CHSL GK question (History, Geo, Polity). Language: Bilingual (Hindi || English). Format as JSON with question, options, correct, explanation. Ensure natural Hindi translation and fact accuracy. Use '||' as a separator."
AI_MATHS_PROMPT_TEMPLATE = "Generate a unique SSC CGL/CHSL Quantitative Aptitude question with {difficulty} difficulty. Language: Bilingual (Hindi || English). Format as JSON. Use simple text for math (e.g., x^2, *, /). Explanation must show steps and formulas. Use '||' as a separator."
AI_VOCAB_PROMPT = "Generate a focused SSC CGL/CHSL English Vocabulary question (Synonym, Antonym, Idiom). Format as JSON. Explanation must include meaning, synonym, antonym, and example sentence. Use <u> for the tested word."

PYQ_PROMPT_TEMPLATE = """
You are an expert SSC exam question creator. Generate a single question stylistically identical to a real PYQ from SSC CGL/CHSL (2018-2024). Output must be strictly valid JSON.
Generate a {subject_text} question. For Maths, the difficulty must be {difficulty}.
JSON structure: {{ "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }}
"""

SUBJECT_MAP = {
    'english': {'prompt': AI_ENGLISH_PROMPT, 'pyq_text': 'English'},
    'gk': {'prompt': AI_GK_PROMPT, 'pyq_text': 'bilingual (Hindi || English) General Knowledge'},
    'maths': {'pyq_text': 'bilingual (Hindi || English) Quantitative Aptitude (Maths)'},
    'vocab_booster': {'prompt': AI_VOCAB_PROMPT, 'pyq_text': 'English Vocabulary'}
}

async def get_gemini_question(subject, mode, difficulty='moderate'):
    headers = {'Content-Type': 'application/json'}
    prompt = ""

    subject_info = SUBJECT_MAP.get(subject.lower().replace(" ", "_"))
    if not subject_info:
        return None

    if mode == 'pyq':
        prompt = PYQ_PROMPT_TEMPLATE.format(subject_text=subject_info['pyq_text'], difficulty=difficulty)
    else:
        if subject == 'maths':
            prompt = AI_MATHS_PROMPT_TEMPLATE.format(difficulty=difficulty)
        else:
            prompt = subject_info.get('prompt', '')
    
    if not prompt: return None
        
    data = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.9, "responseMimeType": "application/json"}}
    
    for attempt in range(3):
        try:
            response = requests.post(GEMINI_URL, headers=headers, json=data, timeout=20)
            response.raise_for_status()
            text_content = response.json()['candidates'][0]['content']['parts'][0]['text']
            
            # Use regex to find the JSON block, robust against markdown wrappers
            match = re.search(r'\\{.*\\}', text_content, re.DOTALL)
            if not match: 
                # Fallback for non-wrapped JSON
                try:
                    q_data = json.loads(text_content)
                    if 'question' in q_data and 'options' in q_data and 'correct' in q_data:
                         return q_data
                except json.JSONDecodeError:
                    logger.warning(f"Failed to decode plain text, attempt {attempt+1}")
                    continue
            
            json_str = match.group(0)
            q_data = json.loads(json_str)
            if 'question' in q_data and 'options' in q_data and 'correct' in q_data:
                return q_data
        except Exception as e:
            logger.error(f"Attempt {attempt+1} failed: {e}")
            await asyncio.sleep(1.5)
    return None

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🧠 AI Quiz", callback_data='mode_quiz')],
        [InlineKeyboardButton("📜 PYQ-Based", callback_data='mode_pyq')]
    ]
    await update.message.reply_text("Welcome! 🇮🇳 Choose a practice mode:", reply_markup=InlineKeyboardMarkup(keyboard))

async def show_subject_menu(update: Update, context: ContextTypes.DEFAULT_TYPE, message_text: str):
    keyboard = [
        [InlineKeyboardButton("📚 English", callback_data='subject_english'), InlineKeyboardButton("🌍 GK", callback_data='subject_gk')],
        [InlineKeyboardButton("🧮 Maths", callback_data='subject_maths'), InlineKeyboardButton("📖 Vocab Booster", callback_data='subject_vocab_booster')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    if update.callback_query:
        await update.callback_query.edit_message_text(message_text, reply_markup=reply_markup)
    else:
        await update.message.reply_text(message_text, reply_markup=reply_markup)

async def show_maths_difficulty_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton("😊 Easy", callback_data='maths_difficulty_easy'),
            InlineKeyboardButton("😐 Moderate", callback_data='maths_difficulty_moderate'),
            InlineKeyboardButton("🔥 Hard", callback_data='maths_difficulty_hard')
        ],
        [InlineKeyboardButton("⬅️ Back to Subjects", callback_data='back_subjects')]
    ]
    await update.callback_query.edit_message_text("Select Maths Difficulty:", reply_markup=InlineKeyboardMarkup(keyboard))

async def generate_and_send_question(update: Update, context: ContextTypes.DEFAULT_TYPE, subject: str, mode: str, difficulty: str = 'moderate'):
    await update.callback_query.edit_message_text(f"Generating {subject.replace('_', ' ').upper()} question... ⏳")
    question_data = await get_gemini_question(subject, mode, difficulty)
    
    if not question_data:
        keyboard = [[InlineKeyboardButton("🔄 Try Again", callback_data=f'subject_{subject}')]]
        await update.callback_query.edit_message_text("❌ Failed to generate question.", reply_markup=InlineKeyboardMarkup(keyboard))
        return
        
    context.user_data['current_q'] = question_data
    options = [str(opt).replace('||', ' / ') for opt in question_data['options']]
    keyboard = [[InlineKeyboardButton(opt, callback_data=f'ans_{i}')] for i, opt in enumerate(options)]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    question_text = f"📝 <b>{subject.replace('_', ' ').upper()} Question:</b>\\n\\n{question_data['question'].replace('||', '\\n')}"
    await update.callback_query.edit_message_text(question_text, reply_markup=reply_markup, parse_mode='HTML')


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    
    if data.startswith('mode_'):
        mode = data.split('_')[1]
        context.user_data['mode'] = mode
        mode_text = "AI Quiz" if mode == 'quiz' else "PYQ-Based"
        await show_subject_menu(update, context, f"Mode: {mode_text}\\nChoose a subject:")
    
    elif data.startswith('subject_'):
        subject = data.split('_', 1)[1]
        context.user_data['subject'] = subject
        
        if subject == 'maths':
            await show_maths_difficulty_menu(update, context)
            return

        mode = context.user_data.get('mode')
        if not mode:
            await query.edit_message_text("⚠️ Session expired. Please type /start to restart.")
            return
            
        context.user_data['score'] = context.user_data.get('score', 0)
        await generate_and_send_question(update, context, subject, mode)

    elif data.startswith('maths_difficulty_'):
        difficulty = data.split('_')[2]
        subject = 'maths'
        mode = context.user_data.get('mode')
        if not mode:
             await query.edit_message_text("⚠️ Session expired. Please type /start to restart.")
             return
        context.user_data['score'] = context.user_data.get('score', 0)
        await generate_and_send_question(update, context, subject, mode, difficulty)

    elif data.startswith('ans_'):
        selected_idx = int(data.split('_')[1])
        q_data = context.user_data.get('current_q')
        if not q_data:
            await query.edit_message_text("⚠️ Session expired. Type /start to restart.")
            return
        correct_idx = q_data['correct']
        is_correct = selected_idx == correct_idx
        if is_correct:
            context.user_data['score'] += 1
            result_header = "✅ <b>Correct Answer!</b>"
        else:
            correct_option_text = str(q_data['options'][correct_idx]).replace('||', ' / ')
            result_header = f"❌ <b>Wrong Answer!</b>\\nCorrect: {correct_option_text}"
            
        explanation = q_data.get('explanation', 'No explanation provided.').replace('||', '\\n')
        msg = f"{result_header}\\n\\n📖 <b>Explanation:</b>\\n{explanation}\\n\\n🏆 <b>Your Score: {context.user_data['score']}</b>"
        
        next_callback = f"subject_{context.user_data['subject']}"
        if context.user_data['subject'] == 'maths':
            # This part is tricky, we lost difficulty. A better state management would be needed for a perfect "Next"
            # For now, we'll just restart the maths flow
            next_callback = "subject_maths" 
            
        keyboard = [
            [InlineKeyboardButton("➡️ Next Question", callback_data=next_callback)],
            [InlineKeyboardButton("🏠 Main Menu", callback_data="back_menu")]
        ]
        await query.edit_message_text(msg, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='HTML')

    elif data == 'back_menu' or data == 'back_subjects':
        mode = context.user_data.get('mode', 'quiz')
        mode_text = "AI Quiz" if mode == 'quiz' else "PYQ-Based"
        await show_subject_menu(update, context, f"Mode: {mode_text}\\nChoose a subject:")


def main():
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    logger.info("🚀 Bot is polling...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Fatal Error: {e}")
`;

const DOCKERFILE_CODE = `FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (gcc needed for some python packages)
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port for Health Check (Render requirement)
EXPOSE 10000

# Run the entrypoint script
CMD ["python", "run.py"]
`;

const REQUIREMENTS_CODE = `python-telegram-bot==21.0.1
requests==2.31.0
flask==3.0.0
gunicorn==21.2.0
`;

const RUN_PY_CODE = `import threading
import os
import time
from flask import Flask
from bot import main as start_bot

app = Flask(__name__)

@app.route('/')
def home():
    return "SSC Quiz Bot is Running!"

@app.route('/health')
def health():
    return {"status": "ok"}, 200

def run_flask():
    port = int(os.environ.get("PORT", 10000))
    # Using 0.0.0.0 to allow external access (required by Render)
    app.run(host='0.0.0.0', port=port)

if __name__ == "__main__":
    # Start Flask server in a separate thread for Health Checks
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Give Flask a second to start
    time.sleep(1)
    
    # Start Telegram Bot (this blocks the main thread)
    print("Starting Telegram Bot...")
    start_bot()
`;

interface CodeBlockProps {
  filename: string;
  description: string;
  code: string;
  icon?: React.ReactNode;
}

const CodeBlock = ({ filename, description, code, icon }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 border border-slate-700 rounded-lg overflow-hidden bg-slate-900 shadow-lg">
      <div className="flex justify-between items-center bg-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          {icon || <FileCode className="w-5 h-5 text-blue-400" />}
          <div>
            <h3 className="text-sm font-mono font-bold text-white">{filename}</h3>
            <p className="text-xs text-slate-400 hidden sm:block">{description}</p>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
          title="Copy Code"
        >
          {copied ? <Check className="w-3 h-3 text-green-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const BotCodeViewer: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-20">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Python Telegram Bot Code</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Create a new folder/repo and add the following 4 files <b>EXACTLY</b> as named below.
          <br/>Deploy to Render.com with <code>TELEGRAM_BOT_TOKEN</code> and <code>GEMINI_API_KEY</code>.
        </p>
      </div>

      <CodeBlock 
        filename="bot.py" 
        description="Contains the main logic, Gemini integration, and Telegram handlers."
        code={BOT_PY_CODE} 
        icon={<Terminal className="w-5 h-5 text-yellow-400" />}
      />
      
      <CodeBlock 
        filename="run.py" 
        description="Entry point. Runs the Flask health server + Bot together."
        code={RUN_PY_CODE} 
        icon={<FileCode className="w-5 h-5 text-green-400" />}
      />
      
      <CodeBlock 
        filename="Dockerfile" 
        description="Instructions for Render to build the Python environment."
        code={DOCKERFILE_CODE} 
        icon={<Box className="w-5 h-5 text-blue-400" />}
      />
      
      <CodeBlock 
        filename="requirements.txt" 
        description="List of Python libraries required."
        code={REQUIREMENTS_CODE} 
        icon={<List className="w-5 h-5 text-red-400" />}
      />
      
      <div className="bg-emerald-900/20 border border-emerald-700/50 p-6 rounded-lg text-emerald-200 text-sm mb-8">
        <h3 className="font-bold text-lg mb-3 flex items-center">
          <span className="mr-2">🚀</span> Final Deployment Checklist
        </h3>
        <ul className="list-disc ml-5 space-y-2 text-emerald-100/80">
          <li>Ensure filenames are exactly <code>bot.py</code>, <code>run.py</code>, <code>Dockerfile</code>, and <code>requirements.txt</code>.</li>
          <li>On Render, select <strong>Web Service</strong> (Not Background Worker).</li>
          <li>Set Runtime to <strong>Docker</strong>.</li>
          <li>Add Environment Variables: <code>TELEGRAM_BOT_TOKEN</code> and <code>GEMINI_API_KEY</code>.</li>
          <li>If the bot stops replying after 15 mins, set up a free Cron job (e.g., cron-job.org) to ping your Render URL <code>https://your-app.onrender.com</code> every 5 minutes.</li>
        </ul>
      </div>
    </div>
  );
};