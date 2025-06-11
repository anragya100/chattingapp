'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Database } from '@/lib/supabase';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, Check, CheckCheck } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Profile;
};

interface MessageListProps {
  messages: Message[];
  currentUser: Profile;
}

export function MessageList({ messages, currentUser }: MessageListProps) {
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    return !isSameDay(currentDate, previousDate);
  };

  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM dd, yyyy');
    }
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    
    return currentMessage.sender_id !== nextMessage.sender_id;
  };

  const isConsecutiveMessage = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return false;
    
    const timeDiff = new Date(currentMessage.timestamp).getTime() - new Date(previousMessage.timestamp).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (
      currentMessage.sender_id === previousMessage.sender_id &&
      timeDiff < fiveMinutes
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          Send your first message to begin chatting with this person.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender_id === currentUser.id;
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const showAvatar = shouldShowAvatar(message, nextMessage);
        const isConsecutive = isConsecutiveMessage(message, previousMessage);
        
        return (
          <div key={message.id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDateSeparator(message.timestamp)}
                </span>
              </div>
            )}

            {/* Message */}
            <div
              className={cn(
                "flex items-end space-x-2 group",
                isCurrentUser ? "justify-end" : "justify-start",
                isConsecutive ? "mt-1" : "mt-4"
              )}
            >
              {/* Avatar for other users */}
              {!isCurrentUser && (
                <div className={cn("flex-shrink-0 w-8", showAvatar ? "opacity-100" : "opacity-0")}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar_url || ''} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {message.sender.full_name?.[0] || message.sender.username?.[0] || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Message Content */}
              <div
                className={cn(
                  "max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl break-words",
                  isCurrentUser
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                )}
              >
                {/* Sender name for group context (if needed) */}
                {!isCurrentUser && !isConsecutive && (
                  <p className="text-xs text-gray-600 mb-1 font-medium">
                    {message.sender.full_name || message.sender.username}
                  </p>
                )}
                
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Message time and status */}
                <div
                  className={cn(
                    "flex items-center justify-end space-x-1 mt-1",
                    isCurrentUser ? "text-blue-100" : "text-gray-500"
                  )}
                >
                  <span className="text-xs opacity-70">
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {isCurrentUser && (
                    <div className="flex">
                      {message.read_by && Array.isArray(message.read_by) && message.read_by.length > 1 ? (
                        <CheckCheck className="h-3 w-3 opacity-70" />
                      ) : (
                        <Check className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Spacer for current user to maintain alignment */}
              {isCurrentUser && <div className="w-8 flex-shrink-0" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}