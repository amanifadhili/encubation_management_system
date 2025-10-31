import React from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import { Quote } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const testimonials = [
  {
    name: "Sarah Nkosi",
    role: "Founder, TechSavvy Solutions",
    company: "R2M Funding Raised",
    content: "The Business Incubation Hub transformed our startup from an idea into a funded business. Their mentorship and resources were invaluable.",
    rating: 5,
    image: "/api/placeholder/64/64"
  },
  {
    name: "David Molefe",
    role: "CEO, GreenAgri Tech",
    company: "50 Jobs Created",
    content: "Through the incubation program, we secured funding and created employment opportunities. The support system is exceptional.",
    rating: 5,
    image: "/api/placeholder/64/64"
  },
  {
    name: "Nomsa Zulu",
    role: "Founder, HealthTech Innovations",
    company: "Market Ready in 8 Months",
    content: "The structured approach and expert guidance helped us go from concept to market-ready product faster than we imagined possible.",
    rating: 5,
    image: "/api/placeholder/64/64"
  }
];

const stats = [
  { number: "100+", label: "Startups Supported", suffix: "" },
  { number: "R25M+", label: "Funding Secured", suffix: "" },
  { number: "90%", label: "Success Rate", suffix: "" },
  { number: "50+", label: "Jobs Created", suffix: "" }
];

const AnimatedCounter: React.FC<{ end: string; suffix: string }> = ({ end, suffix }) => {
  const [count, setCount] = React.useState(0);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3
  });

  React.useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        const target = parseInt(end.replace(/[^\d]/g, ''));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps

        const counter = setInterval(() => {
          setCount(prev => {
            const next = prev + increment;
            if (next >= target) {
              clearInterval(counter);
              return target;
            }
            return next;
          });
        }, 16);

        return () => clearInterval(counter);
      }, 500); // Delay start by 500ms

      return () => clearTimeout(timer);
    }
  }, [inView, end]);

  return (
    <span ref={ref}>
      {Math.floor(count).toLocaleString()}{suffix}
    </span>
  );
};

const SocialProof: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                <AnimatedCounter end={stat.number} suffix={stat.suffix} />
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Success Stories from Our Entrepreneurs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from successful businesses that started their journey with our Business Incubation Hub
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl p-8 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-blue-200">
                <Quote className="w-8 h-8" />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm font-medium text-blue-600">{testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-8">Trusted by leading organizations and institutions</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Placeholder for partner logos */}
            <div className="text-gray-400 font-semibold">Partner Organizations</div>
            <div className="text-gray-400 font-semibold">Business Associations</div>
            <div className="text-gray-400 font-semibold">Government Agencies</div>
            <div className="text-gray-400 font-semibold">Financial Institutions</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;