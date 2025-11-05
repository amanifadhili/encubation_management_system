import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/landing/Header";
import HeroSection from "../components/landing/HeroSection";
import FeatureGrid from "../components/landing/FeatureGrid";
import SocialProof from "../components/landing/SocialProof";
import ProcessSteps from "../components/landing/ProcessSteps";
import AboutSection from "../components/landing/AboutSection";
import ContactSection from "../components/landing/ContactSection";
import InteractiveDemo from "../components/landing/InteractiveDemo";
import ScrollProgress from "../components/landing/ScrollProgress";
import SEOHead from "../components/landing/SEOHead";
import AccessibilityEnhancer from "../components/landing/AccessibilityEnhancer";

const Landing = () => {
  const { user, loading } = useAuth();
  
  // Wait for auth check to complete before redirecting
  // Only show loading if we're checking auth (not for initial render)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  // Redirect authenticated users to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      <AccessibilityEnhancer />
      <ScrollProgress />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeatureGrid />
        <SocialProof />
        <ProcessSteps />
        <AboutSection />
        <ContactSection />
      </main>
      <InteractiveDemo />

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="text-xl font-bold">Career Development Unit</span>
              </div>
              <p className="text-gray-400 mb-4">
                Supporting student career growth and professional development through comprehensive guidance and incubation services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 Incubation Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 