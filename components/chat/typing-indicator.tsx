import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Database } from '@/lib/supabase';
import { User } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface TypingIndicatorProps {
  user: Profile;
}

export function TypingIndicator({ user }: TypingIndicatorProps) {
  return (
    <div className="flex items-end space-x-2 mt-4">
      <div className="flex-shrink-0 w-8">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
            {user.full_name?.[0] || user.username?.[0] || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-bl-md">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      
      <div className="w-8 flex-shrink-0" />
    </div>
  );
}