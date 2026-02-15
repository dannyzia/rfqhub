const fs = require('fs');

let content = fs.readFileSync('rfq-platform/backend/src/services/award.service.ts', 'utf8');

// Fix logger calls - replace object syntax with string syntax
content = content.replace(
  /logger\.info\(\{[^}]+\},\s*['"]([^'"]+)['"]\)/g,
  "logger.info('$1')"
);

fs.writeFileSync('rfq-platform/backend/src/services/award.service.ts', content);
console.log('Award service logger calls updated');
