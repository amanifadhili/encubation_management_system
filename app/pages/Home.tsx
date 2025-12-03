import React, { useState, useEffect } from "react";
import StarterComponent from "../components/StarterComponent";
import { PageSkeleton, ButtonLoader } from "../components/loading";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simulate initial data loading
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <PageSkeleton count={4} layout="form" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome to the Incubation Hub!</h1>
          <p className="mt-2 text-gray-600">This is your Home page. Start building your modules here.</p>
        </div>
        <ButtonLoader
          loading={refreshing}
          onClick={handleRefresh}
          label="Refresh"
          loadingText="Refreshing..."
          variant="outline"
          size="sm"
        />
      </div>
      <div className="mt-6">
        <StarterComponent text="This is a reusable component!" />
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <p className="text-gray-600 mb-4">Get started with common tasks</p>
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/projects'}
            label="View Projects"
            variant="primary"
            size="sm"
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <p className="text-gray-600 mb-4">Check your latest updates</p>
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/notifications'}
            label="View Notifications"
            variant="secondary"
            size="sm"
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Resources</h3>
          <p className="text-gray-600 mb-4">Access helpful resources</p>
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/dashboard'}
            label="Go to Dashboard"
            variant="success"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
