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
            <span className="text-sm font-medium">Supporting 100+ Startups</span>
          </div>
          <div className="w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-2 text-white/80">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">90% Business Success Rate</span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Transform Business
          <span className="block accent-text">
            Ideas into Enterprises
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          Empower your Business Incubation and Innovation Hub with our comprehensive management platform.
          From startup ideation to market-ready enterprises, streamline every step of business development.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <ButtonLoader
            loading={false}
            onClick={() => window.location.href = '/login'}
            label="Start Free Trial"
            variant="primary"
            size="lg"
            className="btn-primary bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
          />

          <ButtonLoader
            loading={false}
            onClick={() => {
              // Scroll to features section
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            label="Watch Demo"
            variant="outline"
            size="lg"
            className="btn-outline border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
            icon={<PlayIcon className="w-5 h-5" />}
          />

          <ButtonLoader
            loading={false}
            onClick={() => {
              // Scroll to contact section or open modal
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
            label="Schedule Consultation"
            variant="secondary"
            size="lg"
            className="btn-secondary bg-amber-600 hover:bg-amber-700 px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
            icon={<ArrowRightIcon className="w-5 h-5" />}
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
            <div className="text-3xl font-bold text-white mb-2">100+</div>
            <div className="text-white/80 text-sm">Startups Supported</div>
          </div>
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">R25M+</div>
            <div className="text-white/80 text-sm">Funding Secured</div>
          </div>
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">90%</div>
            <div className="text-white/80 text-sm">Business Success Rate</div>
          </div>
          <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">50+</div>
            <div className="text-white/80 text-sm">Jobs Created</div>
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