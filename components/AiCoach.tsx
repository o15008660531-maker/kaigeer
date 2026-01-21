import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import { generateHealthAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';

const SUGGESTIONS = [
  "凯格尔运动有什么好处？",
  "我应该每天做多久？",
  "如果我感到疼痛怎么办？",
  "男性也可以做凯格尔运动吗？"
];

const AiCoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '你好！我是你的盆底肌健康助手。关于凯格尔运动或盆底健康，你有什么想问的吗？',
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Basic context from "app state" could be injected here if we had global store
      const responseText = await generateHealthAdvice(text, "用户正在使用 KegelFlow App 进行日常训练。");
      
      const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，连接失败。', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <Bot className="text-indigo-600 w-6 h-6" />
            </div>
            <div>
                <h2 className="font-bold text-slate-800">AI 健康教练</h2>
                <p className="text-xs text-slate-500">Powered by Gemini</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="flex gap-2 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm items-center ml-10">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400">思考中...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length < 3 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-indigo-50">
                      {s}
                  </button>
              ))}
          </div>
      )}

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-center relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入您的问题..."
            className="flex-1 bg-slate-100 text-slate-800 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
             <Info size={10} /> AI回复仅供参考，不构成医疗建议。
           </p>
        </div>
      </div>
    </div>
  );
};

export default AiCoach;