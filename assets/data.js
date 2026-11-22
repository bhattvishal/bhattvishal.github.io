/*
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit this file to update the site.
 *  Everything on the page (except live GitHub repos) is read
 *  from this object, so no HTML editing is needed.
 *
 *  Source of current content: resume (static/media/resume.79fc10b2.pdf),
 *  the previous version of this site (legacy.html), and the
 *  github.com/bhattvishal profile README.
 *  Fields marked  // TODO(linkedin)  should be checked against LinkedIn.
 * ─────────────────────────────────────────────────────────────
 */
window.PROFILE = {
  name: "Vishal Bhatt",
  firstName: "Vishal",
  location: "Pune, India",
  careerStart: "2008-07-01", // drives the live "uptime" counter

  // TODO(linkedin): replace with your current LinkedIn headline
  headline: "Software Specialist · Digital Innovator · .NET · IoT · Cloud · DevOps",
  rotating: ["Innovator", "Engineer", "Tech Enthusiast", "Photographer", "Nature Lover"],

  about: [
    "I'm a Software Specialist from Pune, India, with rich experience in Windows, IoT and Cloud development. I'm passionate about technology, teaching machines how to think, and helping organizations in their Digital Transformation journey.",
    "Self-motivated and success-driven, I've spent my career in software architecture, development and technical leadership — connecting millions of industrial devices to the cloud, and mentoring the people who build them.",
  ],

  // Career, newest first. "version" is shown in the changelog view.
  // TODO(linkedin): add any role after 2019 and confirm the latest end date
  experience: [
    {
      version: "v4",
      title: "Specialist Software Engineer",
      org: "Eaton India Innovation Centre",
      period: "2019 — Present",
      tag: "innovation",
      notes: [
        "Enable digital innovation and transformation — helping the organization move products from ‘What Is’ to ‘What Could Be’.",
        "Build technology partnerships between teams to deliver intelligent solutions around IoT and Cloud.",
        "Technical lead and mentor for high-energy professionals from Embedded, Firmware and Cloud backgrounds.",
      ],
    },
    {
      version: "v3",
      title: "Lead Software Engineer",
      org: "Eaton India Innovation Centre",
      period: "2015 — 2019",
      tag: "platform",
      notes: [
        "Designed and architected Eaton's Cloud and IoT platform to connect millions of industrial devices.",
        "Designed Eaton's unified service tools for industrial devices over legacy protocols — CAN, MODBUS, PROFINET.",
        "Led, mentored and coached a team of 8+ high-potential professionals as an Agile Scrum team.",
      ],
    },
    {
      version: "v2",
      title: "Senior Software Engineer",
      org: "Eaton India Engineering Centre",
      period: "2011 — 2015",
      tag: "cloud",
      notes: [
        "Designed and developed Eaton's high-performance Power Xpert Insight — on-premise and private cloud solution.",
        "Owned application lifecycle management and built CI/CD pipelines.",
      ],
    },
    {
      version: "v1",
      title: "Software Engineer",
      org: "Eaton India Engineering Centre",
      period: "2008 — 2011",
      tag: "devices",
      notes: [
        "Application design and development for Eaton's Power Xpert device configuration tools.",
        "Global code and design reviews.",
      ],
    },
  ],

  education: [
    { degree: "Master of Technology (M.Tech)", field: "Computer Science and Engineering", school: "National Institute of Technology, Bhopal", period: "2006 — 2008" },
    { degree: "Bachelor of Engineering (B.E.)", field: "Computer Science and Engineering", school: "University of Technology, Bhopal", period: "2002 — 2006" },
  ],

  // TODO(linkedin): add newer certifications
  certifications: [
    "Microsoft Certified: Azure IoT Developer Specialty",
    "Certified ScrumMaster®",
  ],

  // Shown as animated counters. TODO(linkedin): refresh the numbers
  innovation: [
    { n: 1, label: "Patent" },
    { n: 1, label: "Trade secret" },
    { n: 8, label: "Invention disclosures" },
    { n: 2, label: "Publications" },
  ],

  // Signal strength 0–100 → rendered as signal bars + gauge
  skills: {
    "Core tech": [
      ["C#, .NET", 100],
      ["Microsoft Azure — IoT, Edge, Web Apps & APIs", 100],
      ["Microservices architecture", 75],
    ],
    "Concepts": [
      ["OOP & design patterns", 100],
      ["Scaled / distributed Agile", 100],
      ["Multithreading", 75],
      ["DevOps", 100],
    ],
    "Languages & tools": [
      ["C, C++, Embedded", 75],
      ["WPF, WCF", 100],
      ["Git, TFS, Azure DevOps", 100],
      ["Atlassian ALM tools", 100],
    ],
    "Human skills": [
      ["Design thinking", 75],
      ["Creativity", 75],
      ["Learning agility", 75],
    ],
  },

  nowExploring: [
    "Data Science and AI",
    "Microsoft Azure",
    "Embedded IoT controllers (ESP8266 / ESP32)",
    "IoT and Cloud platforms",
  ],
  collaborate: [
    "Digitalization and Digital Transformation",
    "IoT platform projects",
    "Enterprise cloud integration",
  ],
  offline: [
    { icon: "📷", title: "Photography", text: "Chasing light, mostly outdoors." },
    { icon: "🌿", title: "Gardening & DIY", text: "If it grows or can be built at home, I'm in." },
    { icon: "🏠", title: "Smart home", text: "ESP32s quietly running the house." },
    { icon: "🍳", title: "Cooking", text: "Fun fact: I can cook very well." },
  ],

  links: [
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/bhattvishal/" },
    { id: "github", label: "GitHub", url: "https://github.com/bhattvishal" },
    { id: "stackoverflow", label: "Stack Overflow", url: "https://stackoverflow.com/users/2516018/vishal-bhatt" },
    { id: "medium", label: "Medium", url: "https://medium.com/@bhattvishal" },
    { id: "hackster", label: "Hackster", url: "https://www.hackster.io/bhattvishal" },
    { id: "instagram", label: "Instagram", url: "https://www.instagram.com/bhattvishal/" },
    { id: "twitter", label: "X / Twitter", url: "https://twitter.com/bhattvishal" },
  ],

  resume: "static/media/resume.79fc10b2.pdf",
  githubUser: "bhattvishal",
};
