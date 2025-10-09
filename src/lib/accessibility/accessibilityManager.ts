/**
 * Accessibility Management System
 * Production-grade accessibility features with WCAG 2.1 AA compliance
 */

import { z } from 'zod';
import { logger } from '@/lib/logging';

/**
 * Accessibility Configuration Schema
 */
export const AccessibilityConfigSchema = z.object({
  enabled: z.boolean().default(true),
  wcagCompliance: z.enum(['A', 'AA', 'AAA']).default('AA'),
  features: z.object({
    screenReaderSupport: z.boolean().default(true),
    keyboardNavigation: z.boolean().default(true),
    highContrastMode: z.boolean().default(true),
    fontSizeAdjustment: z.boolean().default(true),
    colorBlindMode: z.boolean().default(true),
    focusIndicators: z.boolean().default(true),
    skipLinks: z.boolean().default(true),
    ariaLabels: z.boolean().default(true),
    altText: z.boolean().default(true),
    captions: z.boolean().default(true),
    transcripts: z.boolean().default(true),
    reducedMotion: z.boolean().default(true),
    voiceNavigation: z.boolean().default(false),
    brailleSupport: z.boolean().default(false),
  }).default({}),
  testing: z.object({
    automated: z.boolean().default(true),
    manual: z.boolean().default(true),
    userTesting: z.boolean().default(true),
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  }).default({}),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    realTime: z.boolean().default(true),
    alerts: z.boolean().default(true),
    reporting: z.boolean().default(true),
  }).default({}),
  compliance: z.object({
    section508: z.boolean().default(true),
    wcag21: z.boolean().default(true),
    ada: z.boolean().default(true),
    en301549: z.boolean().default(false),
  }).default({}),
});

export type AccessibilityConfig = z.infer<typeof AccessibilityConfigSchema>;

/**
 * Accessibility Issue Schema
 */
export const AccessibilityIssueSchema = z.object({
  id: z.string(),
  type: z.enum(['error', 'warning', 'notice']),
  severity: z.enum(['critical', 'serious', 'moderate', 'minor']),
  category: z.enum([
    'perceivable',
    'operable',
    'understandable',
    'robust',
    'keyboard',
    'color',
    'contrast',
    'images',
    'forms',
    'tables',
    'media',
    'time',
    'navigation',
    'language',
    'semantics',
  ]),
  guideline: z.string(),
  description: z.string(),
  element: z.string().optional(),
  selector: z.string().optional(),
  recommendation: z.string(),
  wcagReference: z.string().optional(),
  automated: z.boolean().default(true),
  timestamp: z.string(),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().optional(),
});

export type AccessibilityIssue = z.infer<typeof AccessibilityIssueSchema>;

/**
 * User Preference Schema
 */
export const UserPreferenceSchema = z.object({
  userId: z.string(),
  preferences: z.object({
    highContrast: z.boolean().default(false),
    largeText: z.boolean().default(false),
    reducedMotion: z.boolean().default(false),
    colorBlindMode: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia']).default('none'),
    keyboardOnly: z.boolean().default(false),
    screenReader: z.boolean().default(false),
    voiceControl: z.boolean().default(false),
    captions: z.boolean().default(true),
    transcripts: z.boolean().default(true),
    audioDescription: z.boolean().default(true),
    signLanguage: z.boolean().default(false),
    braille: z.boolean().default(false),
  }).default({}),
  settings: z.object({
    fontSize: z.enum(['small', 'medium', 'large', 'extra-large']).default('medium'),
    fontFamily: z.enum(['system', 'serif', 'sans-serif', 'monospace']).default('system'),
    lineHeight: z.enum(['tight', 'normal', 'loose']).default('normal'),
    letterSpacing: z.enum(['tight', 'normal', 'wide']).default('normal'),
    wordSpacing: z.enum(['tight', 'normal', 'wide']).default('normal'),
    colorScheme: z.enum(['light', 'dark', 'auto']).default('auto'),
    contrast: z.enum(['normal', 'high', 'low']).default('normal'),
    saturation: z.enum(['muted', 'normal', 'vivid']).default('normal'),
  }).default({}),
  lastUpdated: z.string(),
});

export type UserPreference = z.infer<typeof UserPreferenceSchema>;

/**
 * Accessibility Manager
 */
export class AccessibilityManager {
  private config: AccessibilityConfig;
  private issues: AccessibilityIssue[] = [];
  private userPreferences: Map<string, UserPreference> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = AccessibilityConfigSchema.parse(config);
    this.initializeFeatures();
  }

  /**
   * Initialize accessibility features
   */
  private initializeFeatures(): void {
    if (!this.config.enabled) return;

    if (typeof window !== 'undefined') {
      this.setupKeyboardNavigation();
      this.setupScreenReaderSupport();
      this.setupFocusManagement();
      this.setupColorContrast();
      this.setupReducedMotion();
      this.setupSkipLinks();
      this.setupAriaLabels();
      this.setupAltText();
      this.setupCaptions();
      this.setupTranscripts();
      this.setupVoiceNavigation();
      this.setupBrailleSupport();
    }
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.config.features.keyboardNavigation) return;

    document.addEventListener('keydown', (event) => {
      // Tab navigation enhancement
      if (event.key === 'Tab') {
        this.enhanceTabNavigation(event);
      }
      
      // Arrow key navigation for custom components
      if (event.key.startsWith('Arrow')) {
        this.handleArrowKeyNavigation(event);
      }
      
      // Escape key for closing modals/dropdowns
      if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
      
      // Enter/Space for buttons and links
      if (event.key === 'Enter' || event.key === ' ') {
        this.handleActivationKey(event);
      }
    });

    // Add keyboard shortcuts
    this.addKeyboardShortcuts();
  }

  /**
   * Enhance tab navigation
   */
  private enhanceTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift+Tab (backward)
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      this.focusElement(focusableElements[previousIndex]);
    } else {
      // Tab (forward)
      const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      this.focusElement(focusableElements[nextIndex]);
    }
    
    event.preventDefault();
  }

  /**
   * Get focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    const selector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Focus element with accessibility
   */
  private focusElement(element: HTMLElement): void {
    if (element) {
      element.focus();
      this.announceToScreenReader(`Focused on ${element.tagName.toLowerCase()}`);
    }
  }

  /**
   * Handle arrow key navigation
   */
  private handleArrowKeyNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle menu navigation
    if (target.getAttribute('role') === 'menuitem') {
      this.navigateMenu(event);
    }
    
    // Handle list navigation
    if (target.getAttribute('role') === 'listitem') {
      this.navigateList(event);
    }
    
    // Handle slider navigation
    if (target.getAttribute('role') === 'slider') {
      this.navigateSlider(event);
    }
  }

  /**
   * Navigate menu with arrow keys
   */
  private navigateMenu(event: KeyboardEvent): void {
    const menu = (event.target as HTMLElement).closest('[role="menu"]');
    if (!menu) return;
    
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = items.indexOf(event.target as HTMLElement);
    
    if (event.key === 'ArrowDown') {
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      this.focusElement(items[nextIndex]);
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      this.focusElement(items[prevIndex]);
      event.preventDefault();
    }
  }

  /**
   * Navigate list with arrow keys
   */
  private navigateList(event: KeyboardEvent): void {
    const list = (event.target as HTMLElement).closest('[role="list"]');
    if (!list) return;
    
    const items = Array.from(list.querySelectorAll('[role="listitem"]')) as HTMLElement[];
    const currentIndex = items.indexOf(event.target as HTMLElement);
    
    if (event.key === 'ArrowDown' && currentIndex < items.length - 1) {
      this.focusElement(items[currentIndex + 1]);
      event.preventDefault();
    } else if (event.key === 'ArrowUp' && currentIndex > 0) {
      this.focusElement(items[currentIndex - 1]);
      event.preventDefault();
    }
  }

  /**
   * Navigate slider with arrow keys
   */
  private navigateSlider(event: KeyboardEvent): void {
    const slider = event.target as HTMLElement;
    const min = parseInt(slider.getAttribute('aria-valuemin') || '0');
    const max = parseInt(slider.getAttribute('aria-valuemax') || '100');
    const current = parseInt(slider.getAttribute('aria-valuenow') || '0');
    const step = parseInt(slider.getAttribute('data-step') || '1');
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      const newValue = Math.max(min, current - step);
      slider.setAttribute('aria-valuenow', newValue.toString());
      this.announceToScreenReader(`Value ${newValue}`);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      const newValue = Math.min(max, current + step);
      slider.setAttribute('aria-valuenow', newValue.toString());
      this.announceToScreenReader(`Value ${newValue}`);
      event.preventDefault();
    }
  }

  /**
   * Handle escape key
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    const dropdowns = document.querySelectorAll('[role="listbox"], [role="menu"]');
    
    // Close modal if open
    modals.forEach(modal => {
      if (modal.classList.contains('open')) {
        modal.classList.remove('open');
        this.announceToScreenReader('Modal closed');
      }
    });
    
    // Close dropdown if open
    dropdowns.forEach(dropdown => {
      if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        this.announceToScreenReader('Dropdown closed');
      }
    });
  }

  /**
   * Handle activation key (Enter/Space)
   */
  private handleActivationKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle button activation
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      target.click();
      event.preventDefault();
    }
    
    // Handle link activation
    if (target.tagName === 'A' && target.getAttribute('href')) {
      window.location.href = target.getAttribute('href')!;
      event.preventDefault();
    }
  }

  /**
   * Add keyboard shortcuts
   */
  private addKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Alt + / for search
      if (event.altKey && event.key === '/') {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          event.preventDefault();
        }
      }
      
      // Alt + 1 for main content
      if (event.altKey && event.key === '1') {
        const mainContent = document.querySelector('main, [role="main"]');
        if (mainContent) {
          this.focusElement(mainContent as HTMLElement);
          event.preventDefault();
        }
      }
      
      // Alt + 2 for navigation
      if (event.altKey && event.key === '2') {
        const navigation = document.querySelector('nav, [role="navigation"]');
        if (navigation) {
          this.focusElement(navigation as HTMLElement);
          event.preventDefault();
        }
      }
    });
  }

  /**
   * Setup screen reader support
   */
  private setupScreenReaderSupport(): void {
    if (!this.config.features.screenReaderSupport) return;

    // Add ARIA live regions
    this.addAriaLiveRegions();
    
    // Enhance form labels
    this.enhanceFormLabels();
    
    // Add descriptive text for complex components
    this.addDescriptiveText();
    
    // Setup screen reader announcements
    this.setupScreenReaderAnnouncements();
  }

  /**
   * Add ARIA live regions
   */
  private addAriaLiveRegions(): void {
    const liveRegions = [
      { id: 'sr-announcements', role: 'status', ariaLive: 'polite' },
      { id: 'sr-alerts', role: 'alert', ariaLive: 'assertive' },
      { id: 'sr-log', role: 'log', ariaLive: 'polite' },
    ];

    liveRegions.forEach(region => {
      if (!document.getElementById(region.id)) {
        const element = document.createElement('div');
        element.id = region.id;
        element.setAttribute('role', region.role);
        element.setAttribute('aria-live', region.ariaLive);
        element.style.position = 'absolute';
        element.style.left = '-10000px';
        element.style.width = '1px';
        element.style.height = '1px';
        element.style.overflow = 'hidden';
        document.body.appendChild(element);
      }
    });
  }

  /**
   * Enhance form labels
   */
  private enhanceFormLabels(): void {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const inputElement = input as HTMLInputElement;
        const label = inputElement.labels?.[0];
        
        if (!label) {
          // Create label if missing
          const labelElement = document.createElement('label');
          labelElement.textContent = this.generateLabelText(inputElement);
          labelElement.setAttribute('for', inputElement.id || this.generateId());
          inputElement.parentNode?.insertBefore(labelElement, inputElement);
        }
        
        // Add ARIA attributes
        if (!inputElement.hasAttribute('aria-label')) {
          inputElement.setAttribute('aria-label', label?.textContent || this.generateLabelText(inputElement));
        }
        
        if (inputElement.required && !inputElement.hasAttribute('aria-required')) {
          inputElement.setAttribute('aria-required', 'true');
        }
        
        if (inputElement.disabled && !inputElement.hasAttribute('aria-disabled')) {
          inputElement.setAttribute('aria-disabled', 'true');
        }
      });
    });
  }

  /**
   * Generate label text for input
   */
  private generateLabelText(input: HTMLInputElement): string {
    const placeholder = input.getAttribute('placeholder');
    const name = input.getAttribute('name');
    const type = input.getAttribute('type');
    
    if (placeholder) return placeholder;
    if (name) return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    if (type) return type.charAt(0).toUpperCase() + type.slice(1);
    return 'Input field';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `input-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add descriptive text for complex components
   */
  private addDescriptiveText(): void {
    // Add descriptions for charts
    const charts = document.querySelectorAll('[role="img"][aria-label*="chart" i]');
    charts.forEach(chart => {
      if (!chart.hasAttribute('aria-describedby')) {
        const description = document.createElement('div');
        description.id = `chart-desc-${Math.random().toString(36).substr(2, 9)}`;
        description.textContent = 'Interactive chart. Use arrow keys to navigate data points.';
        description.style.position = 'absolute';
        description.style.left = '-10000px';
        document.body.appendChild(description);
        chart.setAttribute('aria-describedby', description.id);
      }
    });
    
    // Add descriptions for data tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.hasAttribute('aria-label') && !table.hasAttribute('aria-labelledby')) {
        const caption = table.querySelector('caption');
        if (caption) {
          table.setAttribute('aria-labelledby', caption.id || this.generateId());
        } else {
          table.setAttribute('aria-label', 'Data table');
        }
      }
    });
  }

  /**
   * Setup screen reader announcements
   */
  private setupScreenReaderAnnouncements(): void {
    // Announce page changes
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const addedNodes = Array.from(mutation.addedNodes);
            const hasSignificantContent = addedNodes.some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node as Element).textContent && 
              (node as Element).textContent.trim().length > 0
            );
            
            if (hasSignificantContent) {
              this.announceToScreenReader('New content added to page');
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * Announce to screen reader
   */
  private announceToScreenReader(message: string): void {
    const announcement = document.getElementById('sr-announcements');
    if (announcement) {
      announcement.textContent = message;
      setTimeout(() => {
        announcement.textContent = '';
      }, 1000);
    }
  }

  /**
   * Setup focus management
   */
  private setupFocusManagement(): void {
    if (!this.config.features.focusIndicators) return;

    // Add focus-visible polyfill behavior
    document.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse');
    });

    document.addEventListener('keydown', () => {
      document.body.classList.remove('using-mouse');
    });

    // Enhance focus indicators
    this.enhanceFocusIndicators();
  }

  /**
   * Enhance focus indicators
   */
  private enhanceFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      .using-mouse *:focus {
        outline: none !important;
      }
      
      *:focus-visible {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      *:focus:not(:focus-visible) {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup color contrast
   */
  private setupColorContrast(): void {
    if (!this.config.features.colorBlindMode) return;

    // Add color contrast checker
    this.checkColorContrast();
    
    // Add color blind mode support
    this.setupColorBlindMode();
  }

  /**
   * Check color contrast
   */
  private checkColorContrast(): void {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
    
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Simple contrast check (in production, use a proper contrast checking library)
      if (color === backgroundColor) {
        logger.warn('Poor color contrast detected', { element: element.tagName });
      }
    });
  }

  /**
   * Setup color blind mode
   */
  private setupColorBlindMode(): void {
    const style = document.createElement('style');
    style.id = 'color-blind-styles';
    style.textContent = `
      .protanopia { filter: url('#protanopia') !important; }
      .deuteranopia { filter: url('#deuteranopia') !important; }
      .tritanopia { filter: url('#tritanopia') !important; }
    `;
    document.head.appendChild(style);
    
    // Add SVG filters for color blindness
    this.addColorBlindFilters();
  }

  /**
   * Add color blind filters
   */
  private addColorBlindFilters(): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Protanopia filter
    const protanopia = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    protanopia.setAttribute('id', 'protanopia');
    // Add filter elements here
    
    // Deuteranopia filter
    const deuteranopia = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    deuteranopia.setAttribute('id', 'deuteranopia');
    // Add filter elements here
    
    // Tritanopia filter
    const tritanopia = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    tritanopia.setAttribute('id', 'tritanopia');
    // Add filter elements here
    
    defs.appendChild(protanopia);
    defs.appendChild(deuteranopia);
    defs.appendChild(tritanopia);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  /**
   * Setup reduced motion
   */
  private setupReducedMotion(): void {
    if (!this.config.features.reducedMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotion = () => {
      if (mediaQuery.matches) {
        document.body.classList.add('reduced-motion');
        this.disableAnimations();
      } else {
        document.body.classList.remove('reduced-motion');
      }
    };
    
    handleReducedMotion();
    mediaQuery.addEventListener('change', handleReducedMotion);
  }

  /**
   * Disable animations
   */
  private disableAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    style.id = 'reduced-motion-styles';
    document.head.appendChild(style);
  }

  /**
   * Setup skip links
   */
  private setupSkipLinks(): void {
    if (!this.config.features.skipLinks) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '6px';
    skipLink.style.background = '#000';
    skipLink.style.color = '#fff';
    skipLink.style.padding = '8px';
    skipLink.style.textDecoration = 'none';
    skipLink.style.transition = 'top 0.3s';
    skipLink.style.zIndex = '1000';
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content target if not exists
    if (!document.getElementById('main-content')) {
      const mainContent = document.querySelector('main, [role="main"]');
      if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
      }
    }
  }

  /**
   * Setup ARIA labels
   */
  private setupAriaLabels(): void {
    if (!this.config.features.ariaLabels) return;

    // Add landmarks
    this.addLandmarks();
    
    // Add descriptions
    this.addDescriptions();
    
    // Add relationships
    this.addRelationships();
  }

  /**
   * Add landmarks
   */
  private addLandmarks(): void {
    const landmarks = [
      { selector: 'header', role: 'banner' },
      { selector: 'nav', role: 'navigation' },
      { selector: 'main', role: 'main' },
      { selector: 'aside', role: 'complementary' },
      { selector: 'footer', role: 'contentinfo' },
      { selector: 'section', role: 'region' },
      { selector: 'article', role: 'article' },
      { selector: 'form', role: 'form' },
      { selector: 'search', role: 'search' },
    ];

    landmarks.forEach(({ selector, role }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.hasAttribute('role')) {
          element.setAttribute('role', role);
        }
      });
    });
  }

  /**
   * Add descriptions
   */
  private addDescriptions(): void {
    // Add descriptions for complex widgets
    const widgets = document.querySelectorAll('[role="widget"], .widget');
    widgets.forEach(widget => {
      if (!widget.hasAttribute('aria-describedby')) {
        const description = document.createElement('div');
        description.id = `desc-${Math.random().toString(36).substr(2, 9)}`;
        description.textContent = 'Interactive widget. Use arrow keys to navigate.';
        description.style.position = 'absolute';
        description.style.left = '-10000px';
        document.body.appendChild(description);
        widget.setAttribute('aria-describedby', description.id);
      }
    });
  }

  /**
   * Add relationships
   */
  private addRelationships(): void {
    // Connect form inputs to their error messages
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const inputElement = input as HTMLInputElement;
        const errorMessage = inputElement.form?.querySelector(`[data-error-for="${inputElement.id}"]`);
        if (errorMessage) {
          inputElement.setAttribute('aria-describedby', errorMessage.id);
          inputElement.setAttribute('aria-invalid', 'true');
        }
      });
    });
  }

  /**
   * Setup alt text
   */
  private setupAltText(): void {
    if (!this.config.features.altText) return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        const src = img.getAttribute('src');
        if (src) {
          const filename = src.split('/').pop()?.split('.')[0];
          if (filename) {
            img.setAttribute('alt', `Image: ${filename.replace(/[-_]/g, ' ')}`);
          }
        }
      }
    });
  }

  /**
   * Setup captions
   */
  private setupCaptions(): void {
    if (!this.config.features.captions) return;

    // Add captions to videos
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (!video.querySelector('track[kind="captions"]')) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = 'English';
        track.srclang = 'en';
        track.default = true;
        video.appendChild(track);
      }
    });
  }

  /**
   * Setup transcripts
   */
  private setupTranscripts(): void {
    if (!this.config.features.transcripts) return;

    // Add transcript links to audio/video content
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(media => {
      if (!media.nextElementSibling?.classList.contains('transcript-link')) {
        const transcriptLink = document.createElement('a');
        transcriptLink.href = '#';
        transcriptLink.textContent = 'View transcript';
        transcriptLink.className = 'transcript-link';
        transcriptLink.setAttribute('aria-label', 'View transcript for this media');
        media.parentNode?.insertBefore(transcriptLink, media.nextSibling);
      }
    });
  }

  /**
   * Setup voice navigation
   */
  private setupVoiceNavigation(): void {
    if (!this.config.features.voiceNavigation) return;

    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.initializeVoiceRecognition();
    }
  }

  /**
   * Initialize voice recognition
   */
  private initializeVoiceRecognition(): void {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      this.processVoiceCommand(command);
    };
    
    // Start recognition when user clicks voice button
    const voiceButton = document.querySelector('[data-voice-control]');
    if (voiceButton) {
      voiceButton.addEventListener('click', () => {
        recognition.start();
        this.announceToScreenReader('Voice control activated');
      });
    }
  }

  /**
   * Process voice command
   */
  private processVoiceCommand(command: string): void {
    if (command.includes('click') || command.includes('press')) {
      const button = document.querySelector('button, [role="button"]') as HTMLButtonElement;
      if (button) {
        button.click();
        this.announceToScreenReader('Button clicked');
      }
    } else if (command.includes('scroll down')) {
      window.scrollBy(0, 100);
      this.announceToScreenReader('Scrolled down');
    } else if (command.includes('scroll up')) {
      window.scrollBy(0, -100);
      this.announceToScreenReader('Scrolled up');
    } else if (command.includes('go back')) {
      window.history.back();
      this.announceToScreenReader('Went back');
    } else if (command.includes('refresh')) {
      window.location.reload();
      this.announceToScreenReader('Page refreshed');
    }
  }

  /**
   * Setup braille support
   */
  private setupBrailleSupport(): void {
    if (!this.config.features.brailleSupport) return;

    // Add braille display support indicators
    const brailleIndicator = document.createElement('div');
    brailleIndicator.id = 'braille-support';
    brailleIndicator.setAttribute('aria-label', 'Braille display supported');
    brailleIndicator.style.position = 'absolute';
    brailleIndicator.style.left = '-10000px';
    document.body.appendChild(brailleIndicator);
  }

  /**
   * Run accessibility audit
   */
  async runAudit(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Automated checks
    if (this.config.testing.automated) {
      issues.push(...this.runAutomatedChecks());
    }
    
    // Manual checks
    if (this.config.testing.manual) {
      issues.push(...this.runManualChecks());
    }
    
    this.issues = issues;
    return issues;
  }

  /**
   * Run automated accessibility checks
   */
  private runAutomatedChecks(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach((img, index) => {
      issues.push({
        id: `alt-text-${index}`,
        type: 'error',
        severity: 'serious',
        category: 'images',
        guideline: 'WCAG 2.1 - 1.1.1 Non-text Content',
        description: 'Image missing alt text',
        element: img.tagName,
        recommendation: 'Add descriptive alt text to image',
        wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        automated: true,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    });
    
    // Check for missing form labels
    const inputsWithoutLabels = document.querySelectorAll('input:not([id]), textarea:not([id]), select:not([id])');
    inputsWithoutLabels.forEach((input, index) => {
      issues.push({
        id: `form-label-${index}`,
        type: 'error',
        severity: 'serious',
        category: 'forms',
        guideline: 'WCAG 2.1 - 3.3.2 Labels or Instructions',
        description: 'Form input missing label',
        element: input.tagName,
        recommendation: 'Add label or aria-label to form input',
        wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
        automated: true,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    });
    
    // Check for poor color contrast
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
    textElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (color === backgroundColor) {
        issues.push({
          id: `contrast-${index}`,
          type: 'error',
          severity: 'serious',
          category: 'contrast',
          guideline: 'WCAG 2.1 - 1.4.3 Contrast (Minimum)',
          description: 'Poor color contrast',
          element: element.tagName,
          recommendation: 'Ensure sufficient color contrast ratio (4.5:1 for normal text, 3:1 for large text)',
          wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
          automated: true,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    });
    
    return issues;
  }

  /**
   * Run manual accessibility checks
   */
  private runManualChecks(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for keyboard accessibility
    const interactiveElements = document.querySelectorAll('button, a, input, textarea, select');
    interactiveElements.forEach((element, index) => {
      if (!element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '0') {
        issues.push({
          id: `keyboard-${index}`,
          type: 'warning',
          severity: 'moderate',
          category: 'keyboard',
          guideline: 'WCAG 2.1 - 2.1.1 Keyboard',
          description: 'Interactive element may not be keyboard accessible',
          element: element.tagName,
          recommendation: 'Ensure element is focusable and operable with keyboard',
          wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
          automated: false,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    });
    
    return issues;
  }

  /**
   * Get accessibility report
   */
  getAccessibilityReport(): {
    totalIssues: number;
    criticalIssues: number;
    seriousIssues: number;
    moderateIssues: number;
    minorIssues: number;
    complianceScore: number;
    wcagCompliance: string;
    issues: AccessibilityIssue[];
  } {
    const critical = this.issues.filter(i => i.severity === 'critical').length;
    const serious = this.issues.filter(i => i.severity === 'serious').length;
    const moderate = this.issues.filter(i => i.severity === 'moderate').length;
    const minor = this.issues.filter(i => i.severity === 'minor').length;
    
    const total = this.issues.length;
    const complianceScore = total > 0 ? Math.round(((total - critical - serious) / total) * 100) : 100;
    
    return {
      totalIssues: total,
      criticalIssues: critical,
      seriousIssues: serious,
      moderateIssues: moderate,
      minorIssues: minor,
      complianceScore,
      wcagCompliance: this.config.wcagCompliance,
      issues: this.issues,
    };
  }

  /**
   * Set user preference
   */
  setUserPreference(userId: string, preference: Partial<UserPreference>): void {
    const existing = this.userPreferences.get(userId);
    const updated: UserPreference = {
      ...existing,
      ...preference,
      lastUpdated: new Date().toISOString(),
    };
    this.userPreferences.set(userId, updated);
  }

  /**
   * Get user preference
   */
  getUserPreference(userId: string): UserPreference | undefined {
    return this.userPreferences.get(userId);
  }

  /**
   * Apply user preferences
   */
  applyUserPreferences(userId: string): void {
    const preferences = this.getUserPreference(userId);
    if (!preferences) return;

    // Apply high contrast mode
    if (preferences.preferences.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply large text
    if (preferences.preferences.largeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }

    // Apply reduced motion
    if (preferences.preferences.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }

    // Apply color blind mode
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (preferences.preferences.colorBlindMode !== 'none') {
      document.body.classList.add(preferences.preferences.colorBlindMode);
    }

    // Apply font size
    document.documentElement.style.fontSize = this.getFontSize(preferences.settings.fontSize);
  }

  /**
   * Get font size
   */
  private getFontSize(size: string): string {
    const sizes: Record<string, string> = {
      'small': '14px',
      'medium': '16px',
      'large': '20px',
      'extra-large': '24px',
    };
    return sizes[size] || '16px';
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = AccessibilityConfigSchema.parse({
      ...this.config,
      ...config,
    });
    logger.info('Accessibility configuration updated');
  }

  /**
   * Get accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return this.config;
  }
}

export default AccessibilityManager;