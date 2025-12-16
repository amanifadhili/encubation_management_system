import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProfileProvider, useProfile } from '../context/ProfileContext';
import { ProfileCompletionBanner } from '../components/profile/ProfileCompletionBanner';
import { WelcomeScreen } from '../components/profile/WelcomeScreen';
import Analytics from './Analytics';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { completion, loading } = useProfile();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome screen for new incubators on first visit
    if (user?.role === 'incubator' && !loading && completion) {
      const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
      const isNewUser = completion.percentage < 25;
      
      if (!hasSeenWelcome && isNewUser) {
        setShowWelcome(true);
      }
    }
  }, [user, completion, loading]);

  const handleWelcomeDismiss = () => {
    localStorage.setItem('has_seen_welcome', 'true');
    setShowWelcome(false);
  };

  return (
    <div>
      {/* Welcome Screen for New Users */}
      {showWelcome && (
        <WelcomeScreen
          onDismiss={handleWelcomeDismiss}
          showSkip={true}
        />
      )}

      {/* Show profile completion banner for incubators */}
      {user?.role === 'incubator' && (
        <ProfileCompletionBanner />
      )}
      <Analytics />
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  // Wrap in ProfileProvider for incubators to show completion banner
  if (user?.role === 'incubator') {
    return (
      <ProfileProvider>
        <DashboardContent />
      </ProfileProvider>
    );
  }

  return <Analytics />;
};

export default Dashboard;
