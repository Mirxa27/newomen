import { useChat } from '@/hooks/useChat';
import { ChatOnboarding } from '@/components/chat/ChatOnboarding';
import { ChatInterface } from '@/components/chat/ChatInterface';

const ChatPage = () => {
  const chat = useChat();

  if (!chat.isConnected && !chat.isConnecting) {
    return <ChatOnboarding startConversation={chat.startConversation} isConnecting={chat.isConnecting} />;
  }

  return <ChatInterface {...chat} />;
};

export default ChatPage;