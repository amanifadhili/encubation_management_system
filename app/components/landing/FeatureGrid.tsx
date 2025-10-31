import React from 'react';
import { motion } from 'framer-motion';
import FeatureCard from './FeatureCard';
import {
  Users,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Target,
  Award
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Connect entrepreneurs, mentors, and business advisors in a unified platform for seamless collaboration and knowledge sharing."
  },
  {
    icon: TrendingUp,
    title: "Business Development Tracking",
    description: "Monitor startup progress from ideation to market launch with comprehensive milestone tracking and performance analytics."
  },
  {
    icon: MessageSquare,
    title: "Expert Communication",
    description: "Direct messaging and consultation booking with industry experts, mentors, and business development specialists."
  },
  {
    icon: BarChart3,
    title: "Impact Analytics",
    description: "Real-time dashboards showing business growth metrics, funding secured, jobs created, and economic impact generated."
  },
  {
    icon: Settings,
    title: "Resource Management",
    description: "Efficient allocation and tracking of business development resources, funding opportunities, and incubation facilities."
  },
  {
    icon: FileText,
    title: "Business Planning Tools",
    description: "Integrated tools for business plan development, financial modeling, and pitch deck creation with expert feedback."
  },
  {
    icon: Target,
    title: "Funding & Investment",
    description: "Connect startups with investors, track funding applications, and manage investment relationships throughout the growth journey."
  },
  {
    icon: Award,
    title: "Success Recognition",
    description: "Celebrate milestones, showcase success stories, and build a community of accomplished entrepreneurs and businesses."
  }
];

const FeatureGrid: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Business Incubation Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage, track, and scale business incubation and innovation programs
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            Ready to transform your business incubation program?
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Start Your Business Journey
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;