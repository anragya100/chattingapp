'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { createClient } from '@/lib/supabase';
import { Database } from '@/lib/supabase';
import { Sidebar } from '@/components/chat/sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { UserProfile } from '@/components/chat/user-profile';
import { EmptyState } from '@/components/chat/empty-state';

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

export function ChatInterface() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:participant1_id(
            id, username, full_name, avatar_url, is_online, last_seen
          ),
          participant2:participant2_id(
            id, username, full_name, avatar_url, is_online, last_seen
          ),
          last_message:messages!conversations_last_message_id_fkey(
            content, timestamp, sender_id
          )
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      setConversations(data as Conversation[]);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to conversation changes
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `participant1_id=eq.${user.id},participant2_id=eq.${user.id}`
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to profile changes for online status
    const profilesSubscription = supabase
      .channel('profiles')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }, [user?.id]);

  const createConversation = async (otherUser: Profile): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        (conv.participant1_id === user.id && conv.participant2_id === otherUser.id) ||
        (conv.participant1_id === otherUser.id && conv.participant2_id === user.id)
      );

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: otherUser.id,
        })
        .select(`
          *,
          participant1:participant1_id(
            id, username, full_name, avatar_url, is_online, last_seen
          ),
          participant2:participant2_id(
            id, username, full_name, avatar_url, is_online, last_seen
          )
        `)
        .single();

      if (error) throw error;

      const newConversation = data as Conversation;
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <Sidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onCreateConversation={createConversation}
          onShowProfile={() => setShowProfile(true)}
          currentUser={profile!}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showProfile && (
          <UserProfile 
            onClose={() => setShowProfile(false)}
            user={profile!}
          />
        )}
        
        {!showProfile && selectedConversation && (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={profile!}
          />
        )}
        
        {!showProfile && !selectedConversation && (
          <EmptyState />
        )}
      </div>
    </div>
  );
}