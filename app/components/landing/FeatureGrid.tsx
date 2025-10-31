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
    title: "Career Counseling",
    description: "Personalized career guidance sessions with professional counselors to help students identify their strengths and career goals."
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor student career development progress with comprehensive milestone tracking and achievement analytics."
  },
  {
    icon: MessageSquare,
    title: "Mentor Communication",
    description: "Direct messaging and consultation booking with career mentors, alumni, and industry professionals."
  },
  {
    icon: BarChart3,
    title: "Placement Analytics",
    description: "Real-time dashboards showing placement rates, industry trends, and career success metrics for informed decision making."
  },
  {
    icon: Settings,
    title: "Resource Management",
    description: "Efficient allocation and tracking of career development resources, workshops, and professional development opportunities."
  },
  {
    icon: FileText,
    title: "Resume & Portfolio Tools",
    description: "Integrated tools for resume building, portfolio development, and professional document creation with expert feedback."
  },
  {
    icon: Target,
    title: "Job Matching & Placement",
    description: "Advanced job matching algorithms, internship placement coordination, and employment opportunity connections."
  },
  {
    icon: Award,
    title: "Achievement Recognition",
    description: "Celebrate student achievements, showcase success stories, and recognize outstanding career development milestones."
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
            Career Development & Guidance Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive tools and resources to support student career growth, professional development, and successful transitions to the workforce
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