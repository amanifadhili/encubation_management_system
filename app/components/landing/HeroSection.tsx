import React from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ButtonLoader } from '../loading';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-bg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center space-x-6 mb-8"
        >
          <div className="flex items-center space-x-2 text-white/80">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-sm font-medium">RP Kigali College</span>
          </div>
          <div className="w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-2 text-white/80">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Career Development Unit</span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Career Development
          <span className="block accent-text">
            & Guidance Unit
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          RP Kigali College Career Development and Guidance Unit - Supporting student career growth and professional development through comprehensive incubation and guidance services.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center justify-center mb-12"
        >
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/login'}
            label="Access System"
            variant="primary"
            size="lg"
            className="btn-primary bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
          />
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">500+</div>
            <div className="text-white/80 text-sm">Students Guided</div>
          </div>
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">50+</div>
            <div className="text-white/80 text-sm">Career Programs</div>
          </div>
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">95%</div>
            <div className="text-white/80 text-sm">Placement Rate</div>
          </div>
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">10+</div>
            <div className="text-white/80 text-sm">Years Experience</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;