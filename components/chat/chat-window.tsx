'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from '@/components/chat/message-list';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Profile;
};
type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participant1: Profile;
  participant2: Profile;
};

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: Profile;
}

export function ChatWindow({ conversation, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const supabase = createClient();

  const otherUser = conversation.participant1_id === currentUser.id 
    ? conversation.participant2 
    : conversation.participant1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(
            id, username, full_name, avatar_url
          )
        `)
        .eq('conversation_id', conversation.id)
        .eq('deleted', false)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        return;
      }

      setMessages(data as Message[]);
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages-${conversation.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:sender_id(
                id, username, full_name, avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data as Message]);
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel(`typing-${conversation.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          if (payload.new && payload.new.user_id !== currentUser.id) {
            setOtherUserTyping(payload.new.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversation.id, currentUser.id]);

  const updateTypingStatus = async (typing: boolean) => {
    if (typing === isTyping) return;
    
    setIsTyping(typing);
    
    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversation.id,
          user_id: currentUser.id,
          is_typing: typing,
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) {
      updateTypingStatus(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 1000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    
    // Stop typing immediately when sending
    updateTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: messageContent,
          message_type: 'text',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar_url || ''} />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {otherUser.full_name?.[0] || otherUser.username?.[0] || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            {otherUser.is_online && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {otherUser.full_name || otherUser.username}
            </h2>
            <p className="text-sm text-gray-500">
              {otherUser.is_online 
                ? 'Online' 
                : `Last seen ${formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true })}`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <ScrollArea className="flex-1 p-4">
          <MessageList 
            messages={messages}
            currentUser={currentUser}
          />
          
          {otherUserTyping && (
            <TypingIndicator user={otherUser} />
          )}
          
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={sendMessage} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="pr-20 min-h-[44px] resize-none"
                disabled={isSending}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="h-11 px-4 bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}