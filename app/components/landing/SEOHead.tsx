import React from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Business Incubation and Innovation Hub - Transform Ideas into Enterprises",
  description = "Empower your Business Incubation and Innovation Hub with our comprehensive management platform. From startup ideation to market-ready enterprises, streamline every step of business development.",
  keywords = "business incubation, innovation hub, startup support, entrepreneurship, business development, South Africa",
  image = "/og-image.jpg",
  url = window.location.href
}) => {
  React.useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'Business Incubation and Innovation Hub');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'Business Incubation and Innovation Hub', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('language', 'English');
    updateMetaTag('revisit-after', '7 days');

    // Structured data for business/organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Business Incubation and Innovation Hub",
      "description": description,
      "url": url,
      "logo": image,
      "sameAs": [
        // Add social media URLs when available
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+27-21-123-4567",
        "contactType": "customer service",
        "availableLanguage": "English"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Innovation Street",
        "addressLocality": "Cape Town",
        "postalCode": "8001",
        "addressCountry": "ZA"
      },
      "offers": {
        "@type": "Offer",
        "category": "Business Incubation Services",
        "description": "Comprehensive business incubation and innovation support services"
      }
    };

    let scriptElement = document.querySelector('script[type="application/ld+json"]');
    if (scriptElement) {
      scriptElement.textContent = JSON.stringify(structuredData);
    } else {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

  }, [title, description, keywords, image, url]);

  return null; // This component doesn't render anything
};

export default SEOHead;