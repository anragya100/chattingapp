'use client';

import { useAuth } from '@/components/providers';
import { LandingPage } from '@/components/landing-page';
import { UsernameSetup } from '@/components/username-setup';
import { ChatInterface } from '@/components/chat-interface';
import { LoadingScreen } from '@/components/loading-screen';

export default function Home() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (!profile?.username) {
    return <UsernameSetup />;
  }

  return <ChatInterface />;
}