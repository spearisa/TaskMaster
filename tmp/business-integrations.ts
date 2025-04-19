// Business tool integrations with pricing tiers
const BUSINESS_INTEGRATIONS = [
  {
    id: "business-tools",
    name: "Business & Productivity Tools",
    applications: [
      {
        id: "zoom",
        name: "Zoom",
        description: "Video conferencing solution with AI-enhanced features and automatic integration",
        url: "https://zoom.us/",
        useCases: ["meetings", "video conferencing", "webinars", "team collaboration", "remote work"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["40-minute limit on group meetings", "Basic features", "100 participants"],
            referralCommission: 0
          },
          {
            name: "Pro",
            price: 14.99,
            features: ["30-hour meeting duration", "Social media streaming", "1GB cloud recording"],
            referralCommission: 25
          },
          {
            name: "Business",
            price: 19.99,
            features: ["300 participants", "Managed domains", "Company branding", "Recording transcripts"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "salesforce",
        name: "Salesforce",
        description: "Customer relationship management platform with AI capabilities for sales automation",
        url: "https://www.salesforce.com/",
        useCases: ["sales", "customer management", "lead tracking", "analytics", "business intelligence"],
        pricingTiers: [
          {
            name: "Essentials",
            price: 25,
            features: ["Account management", "Lead management", "Basic sales automation"],
            referralCommission: 20
          },
          {
            name: "Professional",
            price: 75,
            features: ["Complete sales solution", "Forecasting", "Collaborative forecasting"],
            referralCommission: 25
          },
          {
            name: "Enterprise",
            price: 150,
            features: ["Advanced sales automation", "AI-powered insights", "Territory management"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "hubspot",
        name: "HubSpot",
        description: "Marketing, sales, and service software with powerful automation and AI features",
        url: "https://www.hubspot.com/",
        useCases: ["marketing", "sales", "customer service", "CRM", "automation", "lead generation"],
        pricingTiers: [
          {
            name: "Starter",
            price: 45,
            features: ["Contact management", "Deal pipeline", "Task automation"],
            referralCommission: 20
          },
          {
            name: "Professional",
            price: 800,
            features: ["Marketing automation", "Smart content", "Campaign management"],
            referralCommission: 25
          },
          {
            name: "Enterprise",
            price: 3600,
            features: ["Advanced reporting", "Predictive lead scoring", "Custom event triggers"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "slack",
        name: "Slack",
        description: "Business communication platform with AI integrations for team collaboration",
        url: "https://slack.com/",
        useCases: ["team chat", "collaboration", "file sharing", "integrations", "remote work"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["10K searchable messages", "10 integrations", "1-to-1 video calls"],
            referralCommission: 0
          },
          {
            name: "Pro",
            price: 7.25,
            features: ["Unlimited message history", "Unlimited integrations", "Group video calls"],
            referralCommission: 20
          },
          {
            name: "Business+",
            price: 12.50,
            features: ["Advanced identity management", "Data exports", "24/7 support"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "microsoft-teams",
        name: "Microsoft Teams",
        description: "Collaboration platform with video meetings, chat, and application integration",
        url: "https://www.microsoft.com/microsoft-teams/",
        useCases: ["team chat", "video conferencing", "file collaboration", "business communication"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["Chat and collaboration", "100 participants meetings", "5GB cloud storage"],
            referralCommission: 0
          },
          {
            name: "Microsoft 365 Business Basic",
            price: 6,
            features: ["All free features", "Meeting recordings", "50GB mailbox"],
            referralCommission: 20
          },
          {
            name: "Microsoft 365 Business Standard",
            price: 12.50,
            features: ["Desktop Office apps", "Premium features", "Webinar hosting"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Payment processing platform with AI fraud detection and revenue optimization",
        url: "https://stripe.com/",
        useCases: ["payments", "subscriptions", "invoicing", "financial services", "e-commerce"],
        pricingTiers: [
          {
            name: "Integrated",
            price: 0,
            features: ["2.9% + 30¢ per transaction", "Basic reporting", "Standard support"],
            referralCommission: 0.5
          },
          {
            name: "Customized",
            price: 0,
            features: ["Volume discounts", "Advanced reporting", "24/7 support"],
            referralCommission: 0.7
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Custom rates", "Dedicated account manager", "Enterprise features"],
            referralCommission: 1
          }
        ]
      },
      {
        id: "loom",
        name: "Loom",
        description: "Video messaging tool for work with AI transcription and summarization",
        url: "https://www.loom.com/",
        useCases: ["video messaging", "screen recording", "team updates", "tutorials", "feedback"],
        pricingTiers: [
          {
            name: "Starter",
            price: 0,
            features: ["25 videos per person", "5-minute video limit", "Basic editing tools"],
            referralCommission: 0
          },
          {
            name: "Business",
            price: 8,
            features: ["Unlimited videos", "Custom branding", "Engagement insights"],
            referralCommission: 20
          },
          {
            name: "Enterprise",
            price: 14,
            features: ["SSO", "Advanced security", "Dedicated support", "Advanced analytics"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "greenhouse",
        name: "Greenhouse",
        description: "Hiring software with AI-powered candidate screening and matching",
        url: "https://www.greenhouse.io/",
        useCases: ["recruiting", "hiring", "applicant tracking", "onboarding", "HR"],
        pricingTiers: [
          {
            name: "Essential",
            price: 0,
            features: ["Basic ATS", "Job posting", "Candidate tracking"],
            referralCommission: 20
          },
          {
            name: "Advance",
            price: 0,
            features: ["Advanced interviewing tools", "Custom pipelines", "CRM functionality"],
            referralCommission: 25
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Enterprise integrations", "Advanced permissions", "Custom workflows"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "activecampaign",
        name: "ActiveCampaign",
        description: "Marketing automation platform with AI-driven customer experience features",
        url: "https://www.activecampaign.com/",
        useCases: ["email marketing", "marketing automation", "CRM", "sales automation"],
        pricingTiers: [
          {
            name: "Lite",
            price: 29,
            features: ["Email marketing", "Marketing automation", "500 contacts"],
            referralCommission: 20
          },
          {
            name: "Plus",
            price: 49,
            features: ["CRM with sales automation", "Contact scoring", "Landing pages"],
            referralCommission: 25
          },
          {
            name: "Professional",
            price: 149,
            features: ["Machine learning", "Split automation", "Predictive sending"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "gong",
        name: "Gong",
        description: "Revenue intelligence platform with AI conversation analysis for sales teams",
        url: "https://www.gong.io/",
        useCases: ["sales intelligence", "call recording", "conversation analytics", "coaching"],
        pricingTiers: [
          {
            name: "Essential",
            price: 0,
            features: ["Call recording", "Basic analytics", "Integration with CRM"],
            referralCommission: 20
          },
          {
            name: "Business",
            price: 0,
            features: ["Advanced analytics", "Coaching capabilities", "Deal intelligence"],
            referralCommission: 25
          },
          {
            name: "Premium",
            price: 0,
            features: ["AI-powered insights", "Custom reporting", "Advanced integrations"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "typeform",
        name: "Typeform",
        description: "Interactive forms and surveys with AI-powered analytics and personalization",
        url: "https://www.typeform.com/",
        useCases: ["forms", "surveys", "quizzes", "lead generation", "data collection"],
        pricingTiers: [
          {
            name: "Basic",
            price: 25,
            features: ["10 questions per form", "100 responses per month", "Basic logic jumps"],
            referralCommission: 20
          },
          {
            name: "Plus",
            price: 50,
            features: ["Unlimited questions", "1,000 responses per month", "Hidden fields"],
            referralCommission: 25
          },
          {
            name: "Business",
            price: 83,
            features: ["10,000 responses per month", "Payment field", "Priority support"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Workflow automation platform with AI suggestions and integration capabilities",
        url: "https://zapier.com/",
        useCases: ["automation", "workflow", "app integration", "productivity", "business processes"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["5 Zaps", "100 tasks/month", "Single-step Zaps"],
            referralCommission: 0
          },
          {
            name: "Starter",
            price: 19.99,
            features: ["20 Zaps", "750 tasks/month", "Multi-step Zaps"],
            referralCommission: 20
          },
          {
            name: "Professional",
            price: 49,
            features: ["Unlimited Zaps", "2,000 tasks/month", "Custom logic", "Paths"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "make",
        name: "Make",
        description: "Visual automation platform with powerful workflow design capabilities",
        url: "https://www.make.com/",
        useCases: ["workflow automation", "app integration", "business process automation"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["1,000 operations", "2 active scenarios", "5-minute interval"],
            referralCommission: 0
          },
          {
            name: "Core",
            price: 9,
            features: ["10,000 operations", "3 active scenarios", "1-minute interval"],
            referralCommission: 20
          },
          {
            name: "Pro",
            price: 16,
            features: ["10,000 operations", "10 active scenarios", "1-minute interval"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Online payment system with AI fraud detection and business management tools",
        url: "https://www.paypal.com/",
        useCases: ["payments", "money transfers", "business transactions", "e-commerce"],
        pricingTiers: [
          {
            name: "Personal",
            price: 0,
            features: ["Send and receive money", "Shop online", "Mobile app access"],
            referralCommission: 0
          },
          {
            name: "Business",
            price: 0,
            features: ["Accept payments", "Invoicing", "Basic reporting", "2.9% + 30¢ per transaction"],
            referralCommission: 0.5
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Customized solutions", "Dedicated support", "Enhanced security"],
            referralCommission: 0.7
          }
        ]
      },
      {
        id: "google-analytics",
        name: "Google Analytics",
        description: "Web analytics service with AI-powered insights and traffic analysis",
        url: "https://analytics.google.com/",
        useCases: ["web analytics", "user behavior", "conversion tracking", "marketing attribution"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["Standard reports", "Data collection", "Basic analysis"],
            referralCommission: 0
          },
          {
            name: "Google Analytics 360",
            price: 150000,
            features: ["Advanced analysis", "Unsampled reports", "Data-driven attribution"],
            referralCommission: 10
          }
        ]
      },
      {
        id: "meta-pixel",
        name: "Meta Pixel",
        description: "Analytics tool for tracking Facebook ad conversions and website activity",
        url: "https://www.facebook.com/business/tools/meta-pixel",
        useCases: ["ad tracking", "conversion optimization", "audience targeting", "retargeting"],
        pricingTiers: [
          {
            name: "Standard",
            price: 0,
            features: ["Conversion tracking", "Audience creation", "Event tracking"],
            referralCommission: 0
          },
          {
            name: "Advanced Matching",
            price: 0,
            features: ["Enhanced customer matching", "Better attribution", "Improved ROI"],
            referralCommission: 0
          }
        ]
      }
    ]
  }
];