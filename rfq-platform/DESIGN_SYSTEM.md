# RFQ Buddy Design System

## Overview

This document defines the comprehensive design system for the RFQ Buddy web application, ensuring visual consistency, accessibility, and a professional user experience across all components and pages.

## Design Principles

### 1. Professional & Trustworthy
- Clean, minimal interface that inspires confidence
- Consistent spacing and alignment
- Professional color palette suitable for B2B environment

### 2. Accessible & Inclusive
- WCAG AA compliance for color contrast
- Keyboard navigation support
- Screen reader friendly components
- Clear visual hierarchy

### 3. Responsive & Adaptive
- Mobile-first design approach
- Consistent experience across all devices
- Flexible layouts that adapt to content

### 4. Efficient & Intuitive
- Clear information architecture
- Familiar interaction patterns
- Minimal cognitive load for users

## Color Palette

### Primary Colors
- **Primary Blue**: `#4A90E2` (Main brand color)
- **Primary Blue Dark**: `#357ABD` (Hover states, emphasis)
- **Primary Blue Light**: `#F0F7FF` (Backgrounds, highlights)

### Secondary Colors
- **Success Green**: `#4CAF50` (Positive actions, confirmations)
- **Success Green Light**: `#F1F8F4` (Success backgrounds)
- **Warning Orange**: `#FF9800` (Warnings, cautions)
- **Error Red**: `#F44336` (Errors, destructive actions)
- **Error Red Light**: `#FFECEE` (Error backgrounds)

### Neutral Colors
- **Text Primary**: `#333333` (Main text)
- **Text Secondary**: `#666666` (Secondary text, labels)
- **Text Tertiary**: `#999999` (Hints, disabled text)
- **Border**: `#E0E0E0` (Dividers, borders)
- **Background**: `#F9F9F9` (Page backgrounds)
- **Surface**: `#FFFFFF` (Card backgrounds, modals)

### Semantic Colors
- **Info Blue**: `#2196F3` (Informational content)
- **Info Blue Light**: `#E3F2FD` (Info backgrounds)

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

### Scale
- **Heading 1**: `2rem` (32px) - Page titles
- **Heading 2**: `1.5rem` (24px) - Section titles
- **Heading 3**: `1.25rem` (20px) - Subsection titles
- **Heading 4**: `1.125rem` (18px) - Component titles
- **Body Large**: `1.125rem` (18px) - Primary content
- **Body**: `1rem` (16px) - Standard text
- **Body Small**: `0.875rem` (14px) - Secondary text, captions
- **Caption**: `0.75rem` (12px) - Labels, hints

### Weights
- **Bold**: `700` - Headings, emphasis
- **Semi-bold**: `600` - Buttons, important text
- **Medium**: `500` - Subheadings
- **Regular**: `400` - Body text
- **Light**: `300` - Secondary content

## Spacing System

### Scale (based on 4px unit)
- **0**: `0px`
- **1**: `4px`
- **2**: `8px`
- **3**: `12px`
- **4**: `16px`
- **5**: `20px`
- **6**: `24px`
- **8**: `32px`
- **10**: `40px`
- **12**: `48px`
- **16**: `64px`
- **20**: `80px`
- **24**: `96px`

### Usage Guidelines
- **Component padding**: 4-6 units
- **Component margins**: 4-8 units
- **Section spacing**: 8-12 units
- **Page padding**: 6-8 units
- **Card spacing**: 4-6 units

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #357ABD;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: #F0F0F0;
  color: #333;
  border: 1px solid #E0E0E0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #E8E8E8;
  border-color: #D0D0D0;
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: #4A90E2;
  border: 1px solid #4A90E2;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: #4A90E2;
  color: white;
}
```

### Inputs

#### Text Input
```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.input:disabled {
  background: #F5F5F5;
  color: #999;
  cursor: not-allowed;
  border-color: #E0E0E0;
}

.input.error {
  border-color: #F44336;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}
```

#### Select Input
```css
.select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 16px center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
}

.select:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}
```

### Cards

#### Basic Card
```css
.card {
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card.ghost {
  background: #F9F9F9;
  border: 1px dashed #E0E0E0;
}
```

### Forms

#### Label
```css
.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.label.required::after {
  content: ' *';
  color: #F44336;
}
```

#### Help Text
```css
.help-text {
  font-size: 0.875rem;
  color: #666;
  margin-top: 4px;
}
```

#### Error Message
```css
.error-message {
  color: #F44336;
  font-size: 0.875rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Layout

#### Container
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.container-fluid {
  width: 100%;
  padding: 0 24px;
}
```

#### Grid System
```css
.grid {
  display: grid;
  gap: 16px;
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (max-width: 768px) {
  .grid-cols-2, .grid-cols-3, .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

### Navigation

#### Breadcrumb
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #666;
}

.breadcrumb-item {
  color: #333;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #999;
}
```

#### Tabs
```css
.tabs {
  display: flex;
  border-bottom: 2px solid #E0E0E0;
  gap: 0;
}

.tab {
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab.active {
  color: #4A90E2;
  border-bottom-color: #4A90E2;
}

.tab:hover {
  color: #333;
  background: #F9F9F9;
}
```

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  .container { padding: 0 16px; }
  .card { padding: 16px; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .container { padding: 0 20px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .container { padding: 0 24px; }
}
```

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order maintained
- Focus states clearly defined

### Screen Reader Support
- Semantic HTML structure
- ARIA labels where needed
- Proper heading hierarchy (H1 > H2 > H3)

## Animation Guidelines

### Duration
- **Fast**: 150ms (hover states, small interactions)
- **Normal**: 250ms (transitions, modal open/close)
- **Slow**: 400ms (page transitions, complex animations)

### Easing
- **Ease Out**: `cubic-bezier(0.4, 0, 0.2, 1)` (most transitions)
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` (entrance animations)
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` (modal animations)

### Transform Properties
- Use `transform` for animations (better performance)
- Avoid animating layout properties (width, height, margin, padding)
- Use `will-change` for complex animations

## Implementation Notes

### CSS Architecture
- Use BEM methodology for class naming
- Leverage CSS custom properties for theming
- Maintain consistent specificity levels
- Use utility classes sparingly

### Component Structure
- Each component should be self-contained
- Use consistent prop naming conventions
- Provide clear documentation for each component
- Include accessibility attributes by default

### Performance
- Minimize re-renders with memoization
- Use CSS-in-JS libraries efficiently
- Optimize images and assets
- Implement lazy loading for non-critical components

## Usage Examples

### Creating a New Component
```svelte
<script lang="ts">
  // Component props and logic
</script>

<div class="component-name">
  <!-- Component content -->
</div>

<style>
  .component-name {
    /* Component styles using design system */
  }
</style>
```

### Using Design System Classes
```svelte
<div class="card">
  <h2 class="text-lg font-semibold mb-4">Section Title</h2>
  <div class="grid grid-cols-2 gap-4">
    <div class="input-group">
      <label class="label required">Field Label</label>
      <input type="text" class="input" />
      <p class="help-text">Help text for the field</p>
    </div>
  </div>
</div>
```

This design system provides a solid foundation for maintaining visual consistency and creating a professional, accessible user experience across the entire RFQ Buddy application.