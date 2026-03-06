/**
 * How-to-Use (Simple Guide) content for the RFQ Buddy docs page.
 * Edit this file to add or update sections as the app is enriched.
 */

export interface GuideSection {
  id: string;
  title: string;
  content: string;
  steps?: string[];
}

export const guideSections: GuideSection[] = [
  {
    id: 'what-is',
    title: 'What is RFQ Buddy?',
    content:
      'RFQ Buddy is a platform for managing Requests for Quotation (RFQ) and formal tenders. Buyers publish tenders; vendors submit bids; evaluation and awards are managed in one place with full audit trail and notifications.'
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    content: 'Create an account and sign in to access the Dashboard. From there you can create tenders (buyers), respond to tenders (vendors), or perform evaluation (evaluators).',
    steps: [
      'Register with your organization details and email.',
      'Sign in and complete your profile if prompted.',
      'Use the Dashboard to start a new tender (buyer) or browse open tenders (vendor).'
    ]
  },
  {
    id: 'buyers-create',
    title: 'Buyers: Creating a tender',
    content:
      'On the Dashboard you will see options based on your organization type. Government organizations can create Detailed RFT or Live Tendering; others typically see Simple RFQ and Live Tendering.',
    steps: [
      'Go to Dashboard and click the option you need (e.g. "Start Simple RFQ" or "Start Detailed RFT").',
      'Fill in the tender details: title, description, deadline, and any items or requirements.',
      'For Detailed RFT, complete the document checklist and workflow settings as required.',
      'Save as draft or publish when ready. Published tenders become visible to invited or eligible vendors.'
    ]
  },
  {
    id: 'buyers-vendors',
    title: 'Buyers: Managing vendors',
    content:
      'You can invite or approve vendors for your organization from the Vendors area. For restricted or limited tenders, assign which vendors can see and bid on specific tenders.',
    steps: [
      'Open Vendors from the main navigation (buyer/admin only).',
      'Add or invite vendors and manage their approval status.',
      'When creating or editing a tender, specify vendor access (open or limited to selected vendors).'
    ]
  },
  {
    id: 'buyers-evaluate',
    title: 'Buyers: Evaluation and award',
    content:
      'After the submission deadline, assign evaluators from the Committee/Workflow area. Evaluators score bids; you can then compare results, run evaluation, and create full or partial awards. Notifications are sent to stakeholders.',
    steps: [
      'Open the tender and go to the Committee or Workflow section.',
      'Assign evaluators and let them complete their scoring in the Evaluator Dashboard.',
      'Review evaluation results and create an award (full or partial).',
      'Winning vendors and relevant parties receive notifications.'
    ]
  },
  {
    id: 'vendors-find',
    title: 'Vendors: Finding and bidding',
    content:
      'As a vendor, use the Tenders list to see published tenders you can access. Open a tender to view details and submit your bid before the deadline.',
    steps: [
      'Go to Tenders from the main navigation.',
      'Browse or filter open tenders and open one to view details.',
      'Use the bid submission page to enter your pricing and upload required documents.',
      'Submit your bid. You can track status from your dashboard or the tender page.'
    ]
  },
  {
    id: 'vendors-track',
    title: 'Vendors: Tracking your bids',
    content:
      'Your dashboard and tender pages show the status of your submissions. After evaluation, awards are visible and you will receive notifications if you are awarded (full or partial).'
  },
  {
    id: 'help',
    title: 'Where to get help',
    content:
      'Use the FAQ for common questions. For bugs or feature requests, go to Support and submit a ticket. You can track tickets under My Tickets.',
    steps: [
      'FAQ: quick answers to common questions (this site).',
      'How-to Guide: step-by-step instructions (this page).',
      'Support: submit a ticket for bugs or feature requests; track under My Tickets.'
    ]
  }
];
