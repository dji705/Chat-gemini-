

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Chat } from '@google/genai';
import { HistoryPanel } from './components/HistoryPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SettingsPanel } from './components/SettingsPanel';
import type { Message, ToolCall, Settings } from './types';
import { Sender } from './types';
import { startChatWithHistory, sendMessage } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';
import { useSettings } from './hooks/useSettings';

const App: React.FC = () => {
    const {
        chatHistory,
        activeChatId,
        activeChat,
        startNewChat,
        selectChat,
        deleteChat,
        updateChat,
    } = useChatHistory();
    
    const { settings, setSettings } = useSettings();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [geminiChat, setGeminiChat] = useState<Chat | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (activeChat) {
            setMessages(activeChat.messages);
            // Recreate chat instance with history and settings when active chat or settings change
            const chatInstance = startChatWithHistory(activeChat.messages.filter(m => !m.isError), settings);
            setGeminiChat(chatInstance);
        } else {
            setMessages([]);
            setGeminiChat(null);
        }
    }, [activeChatId, activeChat, settings]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (isLoading || !text.trim() || !geminiChat || !activeChatId) return;

        setIsLoading(true);

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: Sender.USER,
            text: text,
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);

        const isNewChat = messages.length === 0;

        const aiMessageId = (Date.now() + 1).toString();
        const aiMessagePlaceholder: Message = { id: aiMessageId, sender: Sender.AI, text: '' };
        setMessages(prev => [...prev, aiMessagePlaceholder]);
        
        let fullResponse = '';
        let currentToolCall: ToolCall | undefined = undefined;
        let errorOccurred = false;
        let finalAiText = '';

        try {
            const stream = sendMessage(geminiChat, text, settings);
            for await (const chunk of stream) {
                 if (chunk.text) {
                    fullResponse += chunk.text;
                }
                if (chunk.toolCall) {
                    currentToolCall = chunk.toolCall;
                }
                
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: fullResponse, toolCall: currentToolCall, isError: false } : msg
                    )
                );
            }
            finalAiText = fullResponse || "לא התקבלה תשובה.";
        } catch (error: any) {
            errorOccurred = true;
            console.error('Error sending message to Gemini:', error);
            let errorMessage = 'אופס, משהו השתבש. אנא נסה שוב.';
             if (error && typeof error.message === 'string') {
                if (error.message.includes('http status code: 0') || error.message.toLowerCase().includes('failed to fetch')) {
                    errorMessage = 'שגיאת רשת. לא ניתן היה להתחבר לשרתי Gemini. אנא בדוק/בדקי את חיבור האינטרנט שלך, ואם קיימים חוסמי פרסומות או חומת אש שעלולים להפריע לתקשורת.';
                } else if (error.message.includes('418') || error.message.toLowerCase().includes('api key not valid')) {
                    errorMessage = 'התקבלה שגיאת תצורה. ייתכן שמפתח ה-API אינו תקין או לא מתאים לשירות Gemini. אנא ודא/י שאת/ה משתמש/ת במפתח API של Google AI ושהוא הוגדר כהלכה.';
                } else if (error.message.includes('400')) {
                    errorMessage = 'הבקשה נשלחה בפורמט שגוי (שגיאה 400). אנא בדוק/בדקי את תוכן ההודעה ונסה/י שוב.';
                } else if (error.message.includes('500') || error.message.includes('503')) {
                    errorMessage = 'אירעה שגיאה זמנית בשרתי Gemini. אנא נסה/י שוב בעוד מספר רגעים.';
                }
            }
            finalAiText = errorMessage;
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: errorMessage, isError: true, toolCall: undefined } : msg));
        } finally {
            setIsLoading(false);
            
            const finalAiMessage: Message = { 
                id: aiMessageId, 
                sender: Sender.AI, 
                text: finalAiText,
                toolCall: currentToolCall?.status === 'complete' ? currentToolCall : undefined, // Persist only completed tool calls
                isError: errorOccurred
            };
            const finalMessages = [...currentMessages, finalAiMessage];
            
            const updatePayload: { messages: Message[], title?: string } = { messages: finalMessages };
            if (isNewChat && !errorOccurred) {
                updatePayload.title = text.substring(0, 45) + (text.length > 45 ? '...' : '');
            }

            updateChat(activeChatId, updatePayload);
        }
    }, [isLoading, geminiChat, activeChatId, messages, updateChat, settings]);

    const handleDeleteMessage = useCallback((messageId: string) => {
        if (!activeChatId) return;
        
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
        updateChat(activeChatId, { messages: updatedMessages });

    }, [activeChatId, messages, updateChat]);
    
    const handleNewChat = useCallback(() => {
        startNewChat();
    }, [startNewChat]);

    const handleSelectChat = useCallback((id: string) => {
        selectChat(id);
    }, [selectChat]);
    
    const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        setIsSettingsOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
            <HistoryPanel
                history={chatHistory}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={deleteChat}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
            <main className="flex-1 flex flex-col h-screen relative">
                <div className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto">
                    {messages.length === 0 ? (
                        <WelcomeScreen onExampleClick={handleSendMessage} />
                    ) : (
                        <ChatWindow messages={messages} onDeleteMessage={handleDeleteMessage} />
                    )}
                </div>
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </main>
            {isSettingsOpen && (
                <SettingsPanel 
                    currentSettings={settings}
                    onSave={handleSaveSettings}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
};

export default App;