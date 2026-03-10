import React, { useState, useEffect, useRef } from 'react';
import { Message, PendingMessage, Role } from '../types';
import { generateTamperedMessage } from '../services/geminiService';

interface ChatPanelProps {
  messages: Message[];
  pendingMessages: PendingMessage[];
  role: Role;
  onSend: (msg: string) => void;
  onInterceptDecision: (id: string, action: 'APPROVE' | 'EDIT', content?: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, pendingMessages, role, onSend, onInterceptDecision }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/80 border border-gray-700 rounded-lg overflow-hidden relative">
      <div className="bg-black/40 p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-300">ENCRYPTED CHANNEL</h3>
        <div className="text-xs text-gray-500 animate-pulse">● LIVE</div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
            {msg.isSystem ? (
               <span className="text-xs text-yellow-500/80 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/50">{msg.content}</span>
            ) : (
                <div className="max-w-[85%]">
                    <span className={`text-xs font-bold block mb-0.5 ${msg.senderId === 'player-me' ? 'text-green-400' : 'text-cyan-400'}`}>
                        {msg.senderName}
                    </span>
                    <div className={`p-2 rounded text-sm ${
                        msg.isTampered ? 'bg-red-900/20 border border-red-900/50 text-red-200' : 'bg-gray-800 border border-gray-700'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Infiltrator Intercept Overlay - Appears over the chat input area or floating */}
      {role === Role.INFILTRATOR && pendingMessages.length > 0 && (
          <div className="absolute bottom-[70px] left-2 right-2 flex flex-col gap-2 z-20">
              {pendingMessages.map(pm => (
                  <InterceptCard key={pm.id} message={pm} onDecision={onInterceptDecision} />
              ))}
          </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-black/60 border-t border-gray-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Transmit data..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 text-white"
        />
      </form>
    </div>
  );
};

const InterceptCard: React.FC<{ message: PendingMessage, onDecision: (id: string, action: 'APPROVE' | 'EDIT', content?: string) => void }> = ({ message, onDecision }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.max(0, message.expiresAt - Date.now());
            setTimeLeft(diff);
            if (diff <= 0) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }, [message.expiresAt]);

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        const newText = await generateTamperedMessage(message.content);
        if (newText) setEditContent(newText);
        setIsGenerating(false);
    };

    if (editMode) {
        return (
            <div className="bg-red-950 border border-red-500 rounded p-2 shadow-lg animate-in slide-in-from-bottom-2 fade-in">
                <div className="flex justify-between text-xs text-red-300 mb-1">
                    <span>EDITING // {message.senderName}</span>
                    <span>{(timeLeft / 1000).toFixed(1)}s</span>
                </div>
                <input 
                    className="w-full bg-black/50 border border-red-800 text-red-200 text-sm p-1 mb-2 rounded"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={isGenerating}
                />
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={handleAutoGenerate}
                        className="flex-1 bg-red-900/50 hover:bg-red-800 text-xs py-1 rounded text-red-200 border border-red-800 flex justify-center items-center"
                    >
                        {isGenerating ? 'AI...' : 'AI SABOTAGE'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => onDecision(message.id, 'EDIT', editContent)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-xs py-1 rounded text-black font-bold"
                    >
                        COMMIT
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-800 border-l-4 border-yellow-500 rounded-r p-2 shadow-lg flex justify-between items-center group relative overflow-hidden">
             {/* Progress bar background */}
             <div 
                className="absolute inset-0 bg-yellow-500/10 z-0 origin-left transition-transform duration-100 ease-linear"
                style={{ transform: `scaleX(${timeLeft / 5000})` }}
             />
             
             <div className="z-10 text-xs flex-1 mr-2">
                 <span className="text-gray-400 font-bold block">{message.senderName}:</span>
                 <span className="text-gray-200 truncate block">{message.content}</span>
             </div>
             <div className="z-10 flex gap-1">
                 <button onClick={() => setEditMode(true)} className="px-2 py-1 bg-red-900/80 text-red-200 text-xs rounded hover:bg-red-800 border border-red-700">
                     TAMPER
                 </button>
                 <button onClick={() => onDecision(message.id, 'APPROVE')} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 border border-gray-600">
                     ALLOW
                 </button>
             </div>
        </div>
    );
}