export enum Sender {
    USER = 'user',
    AI = 'ai',
}

export interface Message {
    id: string;
    text: string;
    sender: Sender;
    isError?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
}