import { MessageCircle, Users, Zap } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="h-10 w-10 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to ChatApp
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Select a conversation from the sidebar to start chatting, or create a new conversation 
          by searching for users.
        </p>
        
        <div className="grid grid-cols-1 gap-4 text-left">
          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Real-time Messaging</h3>
              <p className="text-gray-600 text-sm mt-1">
                Messages are delivered instantly with read receipts and typing indicators
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Find Friends</h3>
              <p className="text-gray-600 text-sm mt-1">
                Use the search feature to find and connect with other users
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}