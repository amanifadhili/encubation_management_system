import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { LightBulbIcon, DocumentTextIcon, CurrencyDollarIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const steps = [
  {
    icon: LightBulbIcon,
    title: "Idea Validation",
    description: "Submit your business idea for initial assessment and market validation. Our experts provide feedback and guidance on feasibility.",
    details: ["Business concept evaluation", "Market research support", "Initial mentorship sessions", "Feasibility analysis"]
  },
  {
    icon: DocumentTextIcon,
    title: "Business Planning",
    description: "Develop comprehensive business plans with our integrated tools and expert consultation. Create financial projections and growth strategies.",
    details: ["Business plan development", "Financial modeling", "Market analysis", "Strategy formulation"]
  },
  {
    icon: CurrencyDollarIcon,
    title: "Funding & Resources",
    description: "Access funding opportunities, incubation resources, and business development support. Connect with investors and partners.",
    details: ["Funding application assistance", "Investor matchmaking", "Resource allocation", "Network building"]
  },
  {
    icon: RocketLaunchIcon,
    title: "Launch & Scale",
    description: "Transform your validated business into a market-ready enterprise. Access ongoing support for scaling and sustainable growth.",
    details: ["Market launch support", "Scaling strategies", "Ongoing mentorship", "Performance tracking"]
  }
];

const ProcessSteps: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
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
            Business Incubation Process
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Structured approach to transform business ideas into successful enterprises
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
            <div className="h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Step Number */}
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-6 mx-auto lg:mx-0">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6 mx-auto lg:mx-0">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>

                {/* Content */}
                <div className="text-center lg:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Details List */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-8">
                    <div className="w-8 h-8 border-r-2 border-b-2 border-blue-300 transform rotate-45"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Your Business Journey?
            </h3>
            <p className="text-gray-600 mb-6">
              Join our Business Incubation and Innovation Hub and transform your entrepreneurial dreams into reality.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Apply for Incubation
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSteps;