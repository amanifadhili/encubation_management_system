import React from 'react';
import { motion } from 'framer-motion';
import { BuildingOfficeIcon, AcademicCapIcon, UsersIcon, TrophyIcon } from '@heroicons/react/24/outline';

const highlights = [
  {
    icon: BuildingOfficeIcon,
    title: "State-of-the-Art Facilities",
    description: "Modern business incubation spaces equipped with the latest technology and resources for entrepreneurs."
  },
  {
    icon: AcademicCapIcon,
    title: "Expert Mentorship",
    description: "Access to experienced business mentors, industry experts, and academic advisors throughout your journey."
  },
  {
    icon: UsersIcon,
    title: "Network Building",
    description: "Connect with fellow entrepreneurs, investors, and business partners in our vibrant entrepreneurial ecosystem."
  },
  {
    icon: TrophyIcon,
    title: "Success Track Record",
    description: "Proven results with successful business launches, funding secured, and job creation across various industries."
  }
];

const AboutSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
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
            About Business Incubation and Innovation Hub
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Driving economic growth through comprehensive business incubation and innovation support
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Mission Statement */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                The Business Incubation and Innovation Hub is dedicated to fostering entrepreneurship and innovation
                within our community. We provide comprehensive support to transform business ideas into successful,
                sustainable enterprises that contribute to economic growth and job creation.
              </p>
              <p>
                Through our structured incubation program, we offer entrepreneurs access to mentorship, resources,
                funding opportunities, and a supportive network that accelerates their path to success.
              </p>
              <p>
                Our commitment extends beyond startup creation – we focus on building scalable businesses that
                create lasting value for entrepreneurs, communities, and the broader economy.
              </p>
            </div>
          </motion.div>

          {/* Key Statistics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600 font-medium">Startups Incubated</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">R25M+</div>
              <div className="text-gray-600 font-medium">Funding Secured</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600 font-medium">Jobs Created</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">90%</div>
              <div className="text-gray-600 font-medium">Success Rate</div>
            </div>
          </motion.div>
        </div>

        {/* Key Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">Why Choose Our Hub?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <highlight.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {highlight.title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {highlight.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Vision Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-6">Our Vision</h3>
          <p className="text-lg md:text-xl leading-relaxed max-w-4xl mx-auto">
            To be the leading business incubation and innovation hub that empowers entrepreneurs to build
            world-class businesses, drives economic transformation, and creates sustainable job opportunities
            for our community and beyond.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;