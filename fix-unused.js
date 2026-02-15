const fs = require('fs');

// Fix notification controller - prefix unused req with underscore
let controllerContent = fs.readFileSync('rfq-platform/backend/src/controllers/notification.controller.ts', 'utf8');
controllerContent = controllerContent.replace(
  'async processPending(req: Request, res: Response, next: NextFunction): Promise<void> {',
  'async processPending(_req: Request, res: Response, next: NextFunction): Promise<void> {'
);
fs.writeFileSync('rfq-platform/backend/src/controllers/notification.controller.ts', controllerContent);
console.log('Notification controller fixed');

// Fix notification service - prefix unused parameters
let serviceContent = fs.readFileSync('rfq-platform/backend/src/services/notification.service.ts', 'utf8');

// Prefix RETRY_DELAYS with underscore since it's not used yet
serviceContent = serviceContent.replace(
  'const RETRY_DELAYS = [60000, 300000, 1500000];',
  'const _RETRY_DELAYS = [60000, 300000, 1500000];'
);

// Prefix unused body parameter
serviceContent = serviceContent.replace(
  'async sendEmail(to: string, subject: string, body: string): Promise<boolean> {',
  'async sendEmail(to: string, subject: string, _body: string): Promise<boolean> {'
);

// Prefix unused message parameter
serviceContent = serviceContent.replace(
  'async sendSms(to: string, message: string): Promise<boolean> {',
  'async sendSms(to: string, _message: string): Promise<boolean> {'
);

// Prefix unused type parameter in getEmailBody
serviceContent = serviceContent.replace(
  'getEmailBody(type: string, payload: Record<string, unknown>, recipientName: string): string {',
  'getEmailBody(_type: string, payload: Record<string, unknown>, recipientName: string): string {'
);

fs.writeFileSync('rfq-platform/backend/src/services/notification.service.ts', serviceContent);
console.log('Notification service fixed');
console.log('All unused variable errors fixed!');
