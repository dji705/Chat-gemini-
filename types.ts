export enum Sender {
    USER = 'user',
    AI = 'ai',
}

export interface ToolCall {
  name: string;
  args: any;
  status: 'pending' | 'complete' | 'error';
  response?: any;
}

export interface Message {
    id: string;
    text: string;
    sender: Sender;
    isError?: boolean;
    toolCall?: ToolCall;
}

export interface ChatSession {
    id:string;
    title: string;
    messages: Message[];
}

export interface Settings {
    personalization: string;
    twitterBearerToken: string;
}