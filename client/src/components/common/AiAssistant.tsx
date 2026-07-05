import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bot, X, Send, Loader2, ChevronDown } from "lucide-react";
import { aiApi } from "../../utils/ai.api";
import { useAppData } from "../../context/AppContext";

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
    feedbackSent?: boolean;
}

const AiAssistant: React.FC = () => {
    const { user } = useAppData();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: "1",
                    sender: "ai",
                    text: `Hi ${user?.name || "there"}! I'm the Kravix Assistant. How can I help you today?`
                }
            ]);
        }
    }, [isOpen, messages.length, user]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || !user) return;
        
        const userMsg = inputValue.trim();
        const newMsg: Message = { id: Date.now().toString(), sender: "user", text: userMsg };
        setMessages(prev => [...prev, newMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const role = user.role || "customer";
            const res = await aiApi.chat({
                message: userMsg,
                userId: user._id || "anonymous",
                role
            });

            const aiMsgId = (Date.now() + 1).toString();
            setMessages(prev => [
                ...prev,
                { id: aiMsgId, sender: "ai", text: res.reply, _rawMsg: userMsg, _rawReply: res.reply } as any
            ]);
        } catch {
            setMessages(prev => [
                ...prev, 
                { id: (Date.now() + 1).toString(), sender: "ai", text: "Sorry, I couldn't process your request. Please try again later." }
            ]);
        } finally {
            setIsTyping(false);
        }
    }, [inputValue, user]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    }, [handleSend]);

    if (!user) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(o => !o)}
                aria-label="Toggle AI Assistant"
                className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-transform sm:bottom-6 sm:right-6"
            >
                {isOpen ? <ChevronDown size={22} /> : <Bot size={22} />}
            </button>

            {isOpen && (
                <div className="fixed z-40 inset-x-3 bottom-18 top-16 sm:inset-auto sm:bottom-22 sm:right-5 sm:w-85 md:w-97.5 sm:max-h-140 flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 bg-primary text-white shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                            <Bot size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">Kravix Assistant</p>
                            <p className="text-xs text-white/70 capitalize">{user.role ?? "customer"} mode</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>

                    <div ref={chatBodyRef} className="flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 space-y-2.5 bg-background">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.sender === "ai" && (
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shrink-0 mb-0.5">
                                            <Bot size={12} />
                                        </div>
                                        <div className="bg-white border border-border text-gray-800 text-sm px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                                            {msg.text}
                                        </div>
                                    </div>
                                )}
                                {msg.sender === "user" && (
                                    <div className="bg-primary text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm">
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-end gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shrink-0">
                                    <Bot size={12} />
                                </div>
                                <div className="bg-white border border-border px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                                    <Loader2 size={14} className="animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-end gap-2 px-2.5 py-2.5 sm:px-3 sm:py-3 border-t border-border bg-white shrink-0">
                        <textarea
                            rows={1}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything…"
                            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors max-h-28 leading-5"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                            aria-label="Send"
                        >
                            <Send size={15} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAssistant;
