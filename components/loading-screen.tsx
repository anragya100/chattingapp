import { MessageCircle, Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">ChatApp</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}