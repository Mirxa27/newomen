import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatOnboarding } from "@/components/chat/ChatOnboarding";
import { useChat } from "@/hooks/useChat";

export default function Chat() {
  const chat = useChat();

  if (!chat.isConnected && !chat.isConnecting) {
    return <ChatOnboarding startConversation={chat.startConversation} isConnecting={chat.isConnecting} />;
  }

  return <ChatInterface {...chat} />;
};