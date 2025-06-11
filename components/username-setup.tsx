'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { Check, X, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UsernameSetup() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setIsUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc('check_username_availability', {
          desired_username: username
        });

        if (error) throw error;
        setIsUsernameAvailable(data);
      } catch (error) {
        console.error('Error checking username:', error);
        toast.error('Failed to check username availability');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, supabase]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isUsernameAvailable || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        google_id: user.user_metadata?.provider_id,
        username: username.trim(),
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: avatarUrl,
        email: user.email,
        is_online: true,
      });

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUsernameStatus = () => {
    if (username.length === 0) return null;
    if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters' };
    if (isCheckingUsername) return { valid: null, message: 'Checking availability...' };
    if (isUsernameAvailable === null) return null;
    if (isUsernameAvailable) return { valid: true, message: 'Username is available' };
    return { valid: false, message: 'Username is already taken' };
  };

  const usernameStatus = getUsernameStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Choose a username and profile picture to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl} alt="Profile" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </div>
              <p className="text-sm text-gray-500">Click the icon to upload a profile picture</p>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn(
                    "pr-10",
                    usernameStatus?.valid === true && "border-green-500 focus-visible:ring-green-500",
                    usernameStatus?.valid === false && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isCheckingUsername && (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {!isCheckingUsername && usernameStatus?.valid === true && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {!isCheckingUsername && usernameStatus?.valid === false && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {usernameStatus?.message && (
                <p
                  className={cn(
                    "text-sm",
                    usernameStatus.valid === true && "text-green-600",
                    usernameStatus.valid === false && "text-red-600",
                    usernameStatus.valid === null && "text-gray-600"
                  )}
                >
                  {usernameStatus.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!isUsernameAvailable || isSubmitting || isCheckingUsername}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Profile...</span>
                </div>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}