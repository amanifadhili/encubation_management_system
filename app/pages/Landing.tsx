import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ButtonLoader } from "../components/loading";

const Landing = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-200">
      <header className="flex items-center justify-between px-8 py-6 bg-white shadow">
        <span className="text-2xl font-bold text-blue-700">Incubation Hub</span>
        <nav className="space-x-4">
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/login'}
            label="Login"
            variant="outline"
            size="sm"
            className="text-blue-800 border-blue-800 hover:bg-blue-50"
          />
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">Career Development & Incubation Hub</h1>
        <p className="text-lg md:text-xl text-blue-800 mb-8 max-w-2xl">
          Empowering students, mentors, and managers to innovate, collaborate, and grow. Manage incubators, track progress, and unlock your entrepreneurial journey.
        </p>
        <div className="space-x-4">
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/login'}
            label="Get Started"
            variant="primary"
            size="lg"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 shadow-lg"
          />
        </div>
      </main>
      <footer className="py-4 text-center text-blue-400 text-sm">© 2024 University Career Development Unit</footer>
    </div>
  );
};

export default Landing; 