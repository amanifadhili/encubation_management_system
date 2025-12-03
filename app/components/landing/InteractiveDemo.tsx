import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, XMarkIcon, ChartBarIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const demoSteps = [
  {
    title: "Dashboard Overview",
    description: "Real-time business metrics and progress tracking",
    icon: ChartBarIcon,
    content: "Monitor startup progress, funding milestones, and key performance indicators in one unified dashboard."
  },
  {
    title: "Team Collaboration",
    description: "Connect with mentors and fellow entrepreneurs",
    icon: UsersIcon,
    content: "Access expert mentorship, collaborate with peers, and build your entrepreneurial network."
  },
  {
    title: "Resource Management",
    description: "Track funding, resources, and business development",
    icon: CurrencyDollarIcon,
    content: "Manage funding applications, track resource allocation, and monitor business growth metrics."
  }
];

const InteractiveDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % demoSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);
  };

  return (
    <>
      {/* Demo Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <PlayIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
        <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Watch Demo
        </span>
      </motion.button>

      {/* Demo Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Business Incubation Platform Demo</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Navigation */}
                  <div className="lg:col-span-1">
                    <div className="space-y-3">
                      {demoSteps.map((step, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                            currentStep === index
                              ? 'bg-blue-50 border-2 border-blue-200'
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <step.icon className={`w-5 h-5 ${currentStep === index ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div>
                              <div className={`font-medium ${currentStep === index ? 'text-blue-900' : 'text-gray-700'}`}>
                                {step.title}
                              </div>
                              <div className="text-sm text-gray-500">{step.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Demo Content */}
                  <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-900 rounded-lg p-8 text-white min-h-[400px] flex flex-col justify-center"
                      >
                        {/* Mock Dashboard Interface */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-bold">{demoSteps[currentStep].title}</h4>
                            <div className="flex space-x-2">
                              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                          </div>

                          <p className="text-gray-300 leading-relaxed">
                            {demoSteps[currentStep].content}
                          </p>

                          {/* Mock Interface Elements */}
                          <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="text-2xl font-bold text-blue-400 mb-2">85%</div>
                              <div className="text-sm text-gray-400">Progress</div>
                              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                <div className="bg-blue-400 h-2 rounded-full w-4/5"></div>
                              </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-400 mb-2">R500K</div>
                              <div className="text-sm text-gray-400">Funding</div>
                              <div className="text-xs text-gray-500 mt-1">Target: R1M</div>
                            </div>
                          </div>

                          {/* Mock Chart */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-sm text-gray-400 mb-2">Monthly Growth</div>
                            <div className="flex items-end space-x-2 h-20">
                              {[40, 60, 45, 80, 65, 90, 75].map((height, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${height}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.1 }}
                                  className="bg-blue-500 rounded-t w-6"
                                  style={{ height: `${height}%` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center mt-6">
                      <button
                        onClick={prevStep}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        ← Previous
                      </button>
                      <div className="flex space-x-2">
                        {demoSteps.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                              currentStep === index ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={nextStep}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Experience our platform's key features in action
                  </p>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InteractiveDemo;