'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Database } from '@/lib/supabase';
import { X, Upload, User, Save, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserProfileProps {
  onClose: () => void;
  user: Profile;
}

export function UserProfile({ onClose, user }: UserProfileProps) {
  const { refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = createClient();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl && avatarUrl.includes('avatars/')) {
        const oldFileName = avatarUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName]);
        }
      }

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 max-w-md mx-auto space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={avatarUrl} alt="Profile" />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                {user.full_name?.[0] || user.username?.[0] || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 cursor-pointer transition-colors shadow-lg"
              >
                {isUploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </label>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploadingAvatar || !isEditing}
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">
              {user.full_name || user.username}
            </h3>
            <p className="text-gray-500">@{user.username}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            {isEditing ? (
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                {user.full_name || 'Not set'}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {user.email}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              @{user.username}
            </div>
          </div>

          {/* Join Date */}
          <div className="space-y-2">
            <Label>Member Since</Label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {formatJoinDate(user.created_at)}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                user.is_online ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-gray-900">
                {user.is_online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setFullName(user.full_name || '');
                setAvatarUrl(user.avatar_url || '');
              }}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}