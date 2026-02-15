"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentMessage, processUserQuery } from "@/lib/nexus/agent-core";

const INITIAL_MESSAGE: AgentMessage = {
    id: 'init-1',
    role: 'agent',
    content: "Welcome to your Student OS. I'm NEXUS. access exclusive deals, find gigs, or manage your budget. How can I help today?",
    timestamp: new Date()
};

export function ConciergeInterface() {
    const [messages, setMessages] = useState<AgentMessage[]>([INITIAL_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: AgentMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsThinking(true);

        try {
            const response = await processUserQuery(userMsg.content);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            // proper error handling would go here
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-2xl mx-auto">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.role === 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-nexus-primary flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div
                            className={cn(
                                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-nexus-primary text-white rounded-tr-sm"
                                    : "bg-white/10 text-gray-200 border border-white/5 rounded-tl-sm neo-glass"
                            )}
                        >
                            <p>{msg.content}</p>

                            {msg.action && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <Button
                                        variant="outline"
                                        className="w-full h-8 text-xs border-nexus-action text-nexus-action hover:bg-nexus-action hover:text-white"
                                    >
                                        {msg.action?.label}
                                    </Button>
                                </div>
                            )}

                            <span className="text-[10px] opacity-40 mt-2 block text-right">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-gray-300" />
                            </div>
                        )}
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-3 justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-nexus-primary flex items-center justify-center shrink-0 opacity-50">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-nexus-dark border-t border-white/10">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-nexus-primary transition-all"
                >
                    <button type="button" className="text-gray-400 hover:text-white transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask NEXUS anything..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 py-2"
                    />

                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isThinking}
                        className="p-2 bg-nexus-primary rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-400 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
