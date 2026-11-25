// Deterministic keyword-based FAQ used when no AI key is configured.
// Answers never state exact fees, dates, salaries or phone numbers.

const CONTACT_LINE =
  'For specifics, please email admissions@platypus.example.edu and our team will help you out.';

const TOPICS = [
  {
    key: 'greeting',
    keywords: ['hello', 'hi ', 'hi!', 'hey', 'good morning', 'good afternoon', 'good evening'],
    answer:
      "Hello, and welcome to Platypus University! I'm the virtual helpdesk assistant, here to help with admissions, courses, fees, hostels, facilities, placements and contact details. What would you like to know?",
  },
  {
    key: 'thanks',
    keywords: ['thank', 'thanks', 'appreciate'],
    answer:
      "You're very welcome! If anything else comes to mind about studying at Platypus University, just ask. Best of luck with your application!",
  },
  {
    key: 'admissions',
    keywords: ['apply', 'application', 'admission', 'eligibility', 'deadline'],
    answer:
      'Applying to Platypus University is simple: you fill in our online application form with your academic details and choose your programme. We review applications in the order they arrive, and shortlisted applicants are invited for a short interaction. Entry requirements vary by programme, so it is worth checking the specific one you are interested in. ' +
      CONTACT_LINE,
  },
  {
    key: 'courses',
    keywords: ['course', 'courses', 'program', 'programme', 'degree', 'branch', 'major'],
    answer:
      'Platypus University offers a wide range of undergraduate and postgraduate programmes across engineering, sciences, business, humanities and the arts. Each programme combines core subjects with electives, plus hands-on projects and internships. ' +
      CONTACT_LINE,
  },
  {
    key: 'fees',
    keywords: ['fee', 'fees', 'tuition', 'scholarship', 'cost', 'payment'],
    answer:
      'Fees vary by programme and level of study, and our scholarships are awarded based on merit and need. We aim to keep education accessible, and there are several financial support options. ' +
      CONTACT_LINE,
  },
  {
    key: 'hostels',
    keywords: ['hostel', 'hostels', 'accommodation', 'dorm', 'dormitory', 'mess', 'food', 'room'],
    answer:
      'Our hostels are comfortable, secure and right on campus, with separate residences for different needs. Rooms come furnished, and the mess serves a rotating menu with vegetarian and non-vegetarian options. Common rooms and laundry facilities are available to all residents. Wardens and support staff are on hand around the clock. ' +
      CONTACT_LINE,
  },
  {
    key: 'facilities',
    keywords: [
      'library', 'lab', 'laboratory', 'sports', 'gym', 'wifi', 'wi-fi', 'canteen', 'campus',
    ],
    answer:
      'Campus life at Platypus University is lively: there is a well-stocked library, modern labs, sports grounds and a gym, fast campus-wide Wi-Fi, and canteens serving everything from quick snacks to full meals. Student clubs run events through the year, so there is always something happening. ' +
      CONTACT_LINE,
  },
  {
    key: 'placements',
    keywords: ['placement', 'placements', 'job', 'jobs', 'recruiter', 'recruitment', 'package', 'internship'],
    answer:
      'Our placements cell works closely with a broad mix of recruiters across technology, business and research. Students get interview training, mock sessions and internship support before the placement season. Offer packages vary by role and company, and our cell can share recent placement reports. ' +
      CONTACT_LINE,
  },
  {
    key: 'contact',
    keywords: ['contact', 'email', 'phone', 'address', 'reach', 'office'],
    answer:
      'The best way to reach us is by email at admissions@platypus.example.edu. Our admissions office is on the main campus and happy to help with any question about studying here. ' +
      CONTACT_LINE,
  },
];

function findTopic(text) {
  const lower = ` ${text.toLowerCase()} `;
  for (const topic of TOPICS) {
    if (topic.keywords.some((k) => lower.includes(k))) {
      return topic;
    }
  }
  return null;
}

const FALLBACK =
  "I'm sorry, I don't have information on that. I can help with admissions, courses, fees, hostels, facilities, placements and contact details. For anything else, please email admissions@platypus.example.edu and our team will be glad to help.";

export function demoReply(message, history = []) {
  const topic = findTopic(message);
  if (topic) return topic.answer;

  // Follow-up: reuse the topic of the most recent user message in history
  // so short questions like "what about the food?" still make sense. Longer
  // or entity-specific questions ("who is the dean of the law school?") are
  // treated as new questions and fall through to the honest fallback.
  const words = message.trim().split(/\s+/);
  const isSpecificQuestion = /^(who|whom|whose|when|where|which|name)\b/i.test(message.trim());
  if (words.length <= 5 && !isSpecificQuestion) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role !== 'user') continue;
      const prev = findTopic(history[i].content);
      if (prev) {
        return "About your earlier question: " + prev.answer;
      }
    }
  }
  return FALLBACK;
}
