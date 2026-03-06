/**
 * FAQ content for the RFQ Buddy docs page.
 * Edit this file to add or update questions and answers as the app is enriched.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'What is RFQ Buddy?',
    answer:
      'RFQ Buddy is an online platform for managing Requests for Quotation (RFQ) and formal tenders. It connects buyers with vendors through structured, transparent bidding and supports the full lifecycle from creation to award.'
  },
  {
    question: 'How do I create an account?',
    answer:
      'Click "Get Started" or "Register" and enter your organization details, email, and password. After registration you can sign in and, depending on your organization type, create tenders (buyers) or respond to them (vendors).'
  },
  {
    question: 'What roles are there?',
    answer:
      'Buyers create and manage tenders, invite vendors, and run evaluation and awards. Vendors view open tenders and submit bids. Evaluators are assigned to evaluate bids (technical/commercial). Admins can manage the organization and access admin features.'
  },
  {
    question: 'What is a Simple RFQ?',
    answer:
      'Simple RFQ is for when you mainly need prices—e.g. office supplies, IT gear, or small services. You create a short form, vendors submit quotes, and you can compare and award without the full formal tender process.'
  },
  {
    question: 'What is a Detailed RFT?',
    answer:
      'Detailed RFT (Request for Tender) is for formal, audit-ready tenders—e.g. government, large projects, construction, or infrastructure. It includes full lifecycle management, document checklists, evaluation, and workflow suitable for compliance.'
  },
  {
    question: 'What is Live Tendering?',
    answer:
      'Live Tendering runs real-time auction-style bidding. You schedule an auction session; vendors place bids during the session, and pricing can update dynamically. Suitable when you want competitive real-time bidding.'
  },
  {
    question: 'How do I submit a bid as a vendor?',
    answer:
      'Go to Tenders, open a published tender you have access to, and use the bid submission page. Fill in your pricing and upload any required documents. Submit before the deadline. You can track your submitted bids from your dashboard.'
  },
  {
    question: 'How does evaluation work?',
    answer:
      'Buyers assign evaluators to tenders. Evaluators score bids (e.g. technical and commercial) through the Evaluator Dashboard. The buyer can then compare scores, run evaluations, and proceed to award. Full and partial awards are supported with notifications.'
  },
  {
    question: 'How do I get help or report an issue?',
    answer:
      'Use the Support area to submit a ticket: choose Bug Report or Feature Request, add a title and description, and submit. You can track your tickets under My Tickets. For quick answers, check the FAQ and How-to Guide.'
  },
  {
    question: 'Is my data secure?',
    answer:
      'We use authentication, role-based access, and audit logging. Sensitive actions and data access are tracked. Use a strong password and do not share your login. For full details, refer to the platform\'s security and privacy documentation.'
  },
  {
    question: 'Which browsers are supported?',
    answer:
      'Use a modern browser (Chrome, Firefox, Safari, or Edge, recent versions) with JavaScript enabled. For the best experience, keep your browser up to date.'
  }
];
