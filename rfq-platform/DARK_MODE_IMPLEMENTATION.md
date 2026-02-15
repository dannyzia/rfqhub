# Dark Mode Implementation for RFQ Buddy

## Overview

This document outlines the implementation of dark mode support as an optional enhancement to the RFQ Buddy design system, providing users with a choice between light and dark themes.

## Design Principles for Dark Mode

### 1. Accessibility First
- Maintain WCAG AA contrast ratios in both themes
- Ensure text remains readable in all lighting conditions
- Provide sufficient contrast for interactive elements

### 2. Visual Comfort
- Use softer, less intense colors to reduce eye strain
- Implement proper color temperature balance
- Avoid pure black backgrounds

### 3. Consistency
- Maintain the same visual hierarchy in both themes
- Preserve brand identity through color relationships
- Keep interaction patterns consistent

## Color Palette for Dark Theme

### Dark Theme Colors
```css
:root[data-theme="dark"] {
  /* Backgrounds */
  --color-background: #121212;
  --color-surface: #1e1e1e;
  --color-surface-elevated: #252525;
  
  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;
  --color-text-tertiary: #808080;
  
  /* Borders and Dividers */
  --color-border: #333333;
  --color-border-subtle: #2a2a2a;
  
  /* Primary Colors (adapted for dark) */
  --color-primary: #6ea8fe;
  --color-primary-dark: #4a90e2;
  --color-primary-light: #1a237e;
  
  /* Semantic Colors (adapted for dark) */
  --color-success: #66bb6a;
  --color-success-light: #1b5e20;
  --color-warning: #ffb74d;
  --color-warning-light: #e65100;
  --color-error: #ef5350;
  --color-error-light: #b71c1c;
  
  /* Shadows (adapted for dark) */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

### Color Adaptation Strategy
- **Backgrounds**: Use dark grays instead of pure black
- **Text**: White for primary, progressively darker grays for secondary/tertiary
- **Accents**: Lighter versions of primary colors for better visibility
- **Borders**: Subtle dark borders that don't create harsh lines

## Implementation Strategy

### 1. CSS-in-JS Approach with Theme Provider

```svelte
<!-- src/lib/components/ThemeProvider.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  
  // Theme store
  export const theme = writable<'light' | 'dark'>('light');
  
  // Theme toggle function
  export function toggleTheme() {
    theme.update(current => current === 'light' ? 'dark' : 'light');
  }
  
  // Initialize theme from localStorage
  (function initTheme() {
    const savedTheme = localStorage.getItem('rfq-theme') as 'light' | 'dark';
    if (savedTheme) {
      theme.set(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.set(prefersDark ? 'dark' : 'light');
    }
  })();
</script>

{#snippet default()}
  <slot />
{/snippet}
```

### 2. Theme-Aware Components

```svelte
<!-- src/lib/components/ThemeToggle.svelte -->
<script lang="ts">
  import { theme, toggleTheme } from './ThemeProvider.svelte';
</script>

<button 
  class="theme-toggle" 
  on:click={toggleTheme}
  aria-label="Toggle theme"
>
  {#if $theme === 'light'}
    <svg><!-- Moon icon --></svg>
    Dark Mode
  {:else}
    <svg><!-- Sun icon --></svg>
    Light Mode
  {/if}
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .theme-toggle:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-border-subtle);
  }
</style>
```

### 3. Theme-Aware Base Styles

```css
/* src/app.css - Updated with theme support */
:root {
  /* Light theme (default) */
  --color-background: #f9f9f9;
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #e0e0e0;
  --color-border-subtle: #f0f0f0;
  --color-primary: #4a90e2;
  --color-primary-dark: #357abd;
  --color-primary-light: #f0f7ff;
  --color-success: #4caf50;
  --color-success-light: #f1f8f4;
  --color-warning: #ff9800;
  --color-error: #f44336;
  --color-error-light: #ffecee;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Dark theme overrides */
:root[data-theme="dark"] {
  --color-background: #121212;
  --color-surface: #1e1e1e;
  --color-surface-elevated: #252525;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;
  --color-text-tertiary: #808080;
  --color-border: #333333;
  --color-border-subtle: #2a2a2a;
  --color-primary: #6ea8fe;
  --color-primary-dark: #4a90e2;
  --color-primary-light: #1a237e;
  --color-success: #66bb6a;
  --color-success-light: #1b5e20;
  --color-warning: #ffb74d;
  --color-warning-light: #e65100;
  --color-error: #ef5350;
  --color-error-light: #b71c1c;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}

/* Apply theme to body */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Theme-aware components */
.card {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
  transition: all 0.3s ease;
}

.input {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}
```

### 4. Component-Specific Theme Adaptations

```svelte
<!-- Enhanced Button component with theme support -->
<!-- src/lib/components/Button.svelte -->
<script lang="ts">
  import { theme } from './ThemeProvider.svelte';
  
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button
  class="btn"
  class:btn--primary={variant === 'primary'}
  class:btn--secondary={variant === 'secondary'}
  class:btn--ghost={variant === 'ghost'}
  class:btn--sm={size === 'sm'}
  class:btn--md={size === 'md'}
  class:btn--lg={size === 'lg'}
  class:btn--full-width={fullWidth}
  class:btn--disabled={disabled || loading}
  disabled={disabled || loading}
  type={type}
>
  {#if loading}
    <span class="btn__spinner"></span>
    Loading...
  {:else}
    <slot></slot>
  {/if}
</button>

<style>
  .btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: var(--font-family);
  }
  
  .btn--primary {
    background: var(--color-primary);
    color: white;
  }
  
  .btn--primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
  }
  
  .btn--secondary {
    background: var(--color-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  
  .btn--secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-border-subtle);
  }
  
  .btn--ghost {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }
  
  .btn--ghost:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
  }
  
  .btn--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  .btn--sm { padding: 8px 12px; font-size: 0.875rem; }
  .btn--md { padding: 12px 16px; font-size: 1rem; }
  .btn--lg { padding: 16px 20px; font-size: 1.125rem; }
  
  .btn--full-width { width: 100%; }
  
  .btn__spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

## Implementation Steps

### Phase 1: Foundation (Week 1)
1. **Create Theme Provider**: Implement the theme store and context
2. **Update CSS Variables**: Add dark theme color definitions
3. **Create Theme Toggle**: Build the theme switching component
4. **Update Base Styles**: Make existing styles theme-aware

### Phase 2: Component Updates (Week 2)
1. **Update Core Components**: Make Button, Input, Card theme-aware
2. **Update Layout Components**: Header, Sidebar, Footer theme support
3. **Update Form Components**: All form elements with theme support
4. **Update Navigation**: Menu items and links theme-aware

### Phase 3: Polish and Testing (Week 3)
1. **Accessibility Testing**: Ensure WCAG compliance in both themes
2. **Cross-Browser Testing**: Test theme switching across browsers
3. **Performance Optimization**: Optimize theme switching performance
4. **User Testing**: Gather feedback on dark theme usability

## User Preferences and Persistence

### 1. Theme Persistence
```javascript
// Theme persistence logic
export function saveThemePreference(theme: 'light' | 'dark') {
  localStorage.setItem('rfq-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function loadThemePreference() {
  const savedTheme = localStorage.getItem('rfq-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    return savedTheme;
  }
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = prefersDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', initialTheme);
  return initialTheme;
}
```

### 2. System Preference Detection
```javascript
// Auto-switch based on system preference changes
export function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('rfq-theme')) {
      // Only auto-switch if user hasn't manually set a preference
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  });
}
```

## Accessibility Considerations

### 1. Contrast Requirements
- **Text**: Minimum 4.5:1 contrast ratio for normal text
- **Large Text**: Minimum 3:1 contrast ratio for large text (18pt+ or 14pt+ bold)
- **Interactive Elements**: Clear visual distinction in all states

### 2. Focus Indicators
```css
/* Enhanced focus indicators for dark theme */
:root[data-theme="dark"] .btn:focus,
:root[data-theme="dark"] .input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

:root[data-theme="dark"] .btn:focus-visible {
  box-shadow: 0 0 0 4px rgba(110, 168, 254, 0.3);
}
```

### 3. Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Considerations

### 1. CSS-in-JS Optimization
- Use CSS custom properties for theme switching
- Minimize re-renders when theme changes
- Cache theme values where possible

### 2. Bundle Size
- Tree-shake unused theme code
- Lazy load theme-specific styles
- Minimize JavaScript for theme switching

### 3. Memory Usage
- Clean up event listeners on theme changes
- Avoid memory leaks in theme store
- Optimize CSS-in-JS performance

## Testing Strategy

### 1. Visual Regression Testing
- Test all components in both themes
- Ensure consistent spacing and alignment
- Verify color contrast compliance

### 2. Cross-Browser Testing
- Test theme switching in all major browsers
- Verify CSS custom property support
- Test system preference detection

### 3. Accessibility Testing
- Run automated accessibility audits
- Test with screen readers
- Verify keyboard navigation

## Migration Strategy

### 1. Gradual Rollout
- Implement dark theme alongside existing light theme
- Allow users to opt-in to dark theme
- Monitor usage and feedback

### 2. Backward Compatibility
- Ensure existing light theme remains unchanged
- Maintain all existing functionality
- Preserve user preferences

### 3. Documentation
- Update component documentation with theme examples
- Create theme usage guidelines
- Document accessibility considerations

This dark mode implementation provides a comprehensive approach to adding theme support while maintaining accessibility, performance, and user experience quality.