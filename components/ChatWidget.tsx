import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Sparkles, MessageCircle, Download } from './Icons';
import { ResearchResult } from '../types';
import { getResearchChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
  researchResult: ResearchResult;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ researchResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat when research result changes
  useEffect(() => {
    chatSessionRef.current = getResearchChatSession(researchResult);
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Hi! I've studied the research on **${researchResult.topic}**. Ask me anything about the summary or the articles!`
      }
    ]);
  }, [researchResult]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMessage.text });
      const text = (response as GenerateContentResponse).text || "I couldn't generate a response.";
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text
      }]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error while trying to answer that."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;

    const title = `Research Chat - ${researchResult.topic}`;
    const date = new Date().toLocaleString();
    const content = messages.map(m => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      return `### ${role}\n${m.text}\n`;
    }).join('\n---\n\n');

    const fileContent = `# ${title}\nDate: ${date}\n\n${content}`;
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${researchResult.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto
          bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden
          transition-all duration-300 ease-in-out origin-bottom-right
          flex flex-col mb-4
          ${isOpen ? 'w-[90vw] md:w-[450px] h-[500px] max-h-[75vh] opacity-100 scale-100' : 'w-[400px] h-0 opacity-0 scale-90 overflow-hidden'}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-yellow-300" />
            <span className="font-bold text-sm tracking-wide">Research Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleExport}
              title="Export Chat"
              className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              title="Close"
              className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm overflow-hidden
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}
                `}
              >
                {msg.role === 'model' ? (
                   <div className="prose prose-sm prose-slate max-w-none
                      prose-headings:font-bold prose-headings:text-slate-800 prose-headings:mt-2 prose-headings:mb-1
                      prose-p:my-1 
                      prose-li:my-0
                      prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
                      prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4
                      prose-strong:text-slate-900 prose-strong:font-semibold
                    ">
                     <ReactMarkdown>
                       {msg.text}
                     </ReactMarkdown>
                   </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-purple-500" />
                <span className="text-xs text-slate-400 font-medium">Gemini is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the methodology..."
              className="w-full bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-full py-3 pl-4 pr-12 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto
          group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300
          ${isOpen ? 'bg-slate-700 rotate-90' : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:scale-105'}
        `}
      >
        {isOpen ? (
          <X className="text-white" />
        ) : (
          <MessageCircle className="text-white w-7 h-7" />
        )}
      </button>
    </div>
  );
};