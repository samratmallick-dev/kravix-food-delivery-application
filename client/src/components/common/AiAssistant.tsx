import React, { useState, useEffect, useRef } from "react";
import { aiApi } from "../../utils/ai.api";
import { useAppData } from "../../context/AppContext";

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
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

    const handleSend = async () => {
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

            setMessages(prev => [
                ...prev, 
                { id: (Date.now() + 1).toString(), sender: "ai", text: res.reply }
            ]);
        } catch (error) {
            setMessages(prev => [
                ...prev, 
                { id: (Date.now() + 1).toString(), sender: "ai", text: "Sorry, I'm having trouble connecting right now." }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-all duration-300 ease-out transform translate-y-0 opacity-100">
                    <div className="bg-gradient-to-br from-[#FF6B6B] to-[#FF4757] text-white px-5 py-4 flex justify-between items-center">
                        <div className="font-semibold text-base flex items-center gap-2.5">
                            <span className="text-[20px] bg-white/20 p-1.5 rounded-full">🤖</span>
                            Kravix Assistant
                        </div>
                        <button 
                            className="bg-transparent border-none text-white text-[28px] leading-none cursor-pointer opacity-80 hover:opacity-100"
                            onClick={() => setIsOpen(false)}
                        >
                            &times;
                        </button>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto bg-[#F8F9FA] flex flex-col gap-3" ref={chatBodyRef}>
                        {messages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`max-w-[80%] px-4 py-3 rounded-[18px] text-sm leading-snug break-words ${
                                    msg.sender === "user" 
                                        ? "bg-[#FF4757] text-white self-end rounded-br-[4px]" 
                                        : "bg-white text-[#333] self-start rounded-bl-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="max-w-[80%] px-4 py-3 rounded-[18px] text-sm leading-snug break-words bg-white text-[#333] self-start rounded-bl-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-white border-t border-[#EEEEEE] flex gap-2.5">
                        <input 
                            className="flex-1 px-4 py-3 border border-[#E0E0E0] rounded-full outline-none text-sm transition-colors duration-200 focus:border-[#FF4757]"
                            type="text"
                            placeholder="Ask me anything..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button 
                            className="bg-[#FF4757] text-white border-none px-5 rounded-full font-semibold cursor-pointer transition-colors duration-200 disabled:bg-[#FFB3BA] disabled:cursor-not-allowed hover:not-disabled:bg-[#E84150]"
                            onClick={handleSend} 
                            disabled={!inputValue.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
            
            {!isOpen && (
                <button 
                    className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF4757] border-none text-white text-[28px] cursor-pointer shadow-[0_8px_24px_rgba(255,71,87,0.4)] transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-[0_12px_28px_rgba(255,71,87,0.5)] flex items-center justify-center"
                    onClick={() => setIsOpen(true)}
                >
                    <span>💬</span>
                </button>
            )}
        </div>
    );
};

export default AiAssistant;
