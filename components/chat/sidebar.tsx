'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { createClient } from '@/lib/supabase';
import { Database } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Search, Settings, Plus, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participant1: Profile;
  participant2: Profile;
  last_message?: {
    content: string | null;
    timestamp: string;
    sender_id: string;
  };
};

interface SidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation: (user: Profile) => Promise<Conversation | null>;
  onShowProfile: () => void;
  currentUser: Profile;
}

export function Sidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  onCreateConversation,
  onShowProfile,
  currentUser,
}: SidebarProps) {
  const { signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUser.id)
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser.id]);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant1_id === currentUser.id 
      ? conversation.participant2 
      : conversation.participant1;
  };

  const handleStartChat = async (user: Profile) => {
    const conversation = await onCreateConversation(user);
    if (conversation) {
      onSelectConversation(conversation);
      setShowNewChat(false);
      setSearchQuery('');
    }
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message?.content) {
      return 'No messages yet';
    }
    
    const isCurrentUser = conversation.last_message.sender_id === currentUser.id;
    const prefix = isCurrentUser ? 'You: ' : '';
    const content = conversation.last_message.content;
    
    return `${prefix}${content.length > 40 ? content.substring(0, 40) + '...' : content}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Chats</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewChat(!showNewChat)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowProfile}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        {showNewChat && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchQuery.length >= 2 && (
              <div className="bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleStartChat(user)}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-white cursor-pointer transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {user.full_name?.[0] || user.username?.[0] || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                        </div>
                        {user.is_online && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No users found</p>
                )}
              </div>
            )}
            <Separator />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-1">Start a new chat to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const isSelected = selectedConversation?.id === conversation.id;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-blue-50 border border-blue-200" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.avatar_url || ''} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {otherUser.full_name?.[0] || otherUser.username?.[0] || <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherUser.full_name || otherUser.username}
                        </p>
                        {conversation.last_message_timestamp && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message_timestamp), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 truncate">
                        {getLastMessagePreview(conversation)}
                      </p>
                      
                      {!otherUser.is_online && otherUser.last_seen && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last seen {formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Current User */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatar_url || ''} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {currentUser.full_name?.[0] || currentUser.username?.[0] || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.full_name || currentUser.username}
              </p>
              <p className="text-xs text-gray-500 truncate">@{currentUser.username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}