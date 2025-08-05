
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Chat } from '@google/genai';
import { HistoryPanel } from './components/HistoryPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import type { Message } from './types';
import { Sender } from './types';
import { startChatWithHistory, sendMessage } from './services/geminiService';
import { useChatHistory } from './hooks/useChatHistory';

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
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [geminiChat, setGeminiChat] = useState<Chat | null>(null);

    useEffect(() => {
        if (activeChat) {
            setMessages(activeChat.messages);
            // Recreate chat instance with history when active chat changes, excluding errors
            const chatInstance = startChatWithHistory(activeChat.messages.filter(m => m.text && !m.isError));
            setGeminiChat(chatInstance);
        } else {
            setMessages([]);
            setGeminiChat(null);
        }
    }, [activeChatId, activeChat]);

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
        let errorOccurred = false;
        let finalAiText = '';

        try {
            const stream = await sendMessage(geminiChat, text);
            for await (const chunk of stream) {
                fullResponse += chunk;
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: fullResponse, isError: false } : msg
                    )
                );
            }
            finalAiText = fullResponse || "לא התקבלה תשובה.";
        } catch (error: any) {
            errorOccurred = true;
            console.error('Error sending message to Gemini:', error);
            let errorMessage = 'אופס, משהו השתבש. אנא נסה שוב.';
             if (error && typeof error.message === 'string') {
                if (error.message.includes('http status code: 0')) {
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
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: errorMessage, isError: true } : msg));
        } finally {
            setIsLoading(false);
            
            const finalAiMessage: Message = { 
                id: aiMessageId, 
                sender: Sender.AI, 
                text: finalAiText,
                isError: errorOccurred
            };
            const finalMessages = [...currentMessages, finalAiMessage];
            
            const updatePayload: { messages: Message[], title?: string } = { messages: finalMessages };
            if (isNewChat && !errorOccurred) {
                updatePayload.title = text.substring(0, 45) + (text.length > 45 ? '...' : '');
            }

            updateChat(activeChatId, updatePayload);
        }
    }, [isLoading, geminiChat, activeChatId, messages, updateChat]);

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

    return (
        <div className="flex h-screen bg-gray-900 text-slate-200 font-sans overflow-hidden">
            <HistoryPanel
                history={chatHistory}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={deleteChat}
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
        </div>
    );
};

export default App;
