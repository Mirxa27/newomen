import { useChat } from '@/hooks/features/ai/useChat';
import { ChatOnboarding } from '@/components/features/ai/ChatOnboarding';
import { ChatInterface } from '@/components/features/ai/ChatInterface';

const ChatPage = () => {
  const chat = useChat();

  if (!chat.isConnected && !chat.isConnecting) {
    return <ChatOnboarding startConversation={chat.startConversation} isConnecting={chat.isConnecting} />;
  }

  return <ChatInterface {...chat} isConnecting={chat.isConnecting} />;
};

export default ChatPage;