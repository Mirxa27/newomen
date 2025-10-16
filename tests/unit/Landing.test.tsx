import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '../pages/Landing';
import '@testing-library/jest-dom';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <button {...props}>{children}</button>,
    li: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <li {...props}>{children}</li>,
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Landing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hero Section', () => {
    it('renders the hero title correctly', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Transform Your Life with/i)).toBeInTheDocument();
      expect(screen.getByText(/Newomen/i)).toBeInTheDocument();
    });

    it('displays the AI-powered badge', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/AI-Powered Personal Growth Platform/i)).toBeInTheDocument();
    });

    it('shows CTA buttons', () => {
      renderWithRouter(<Landing />);
      const startButtons = screen.getAllByRole('button', { name: /Start Your Journey/i });
      const learnMoreButton = screen.getByRole('button', { name: /Learn More/i });
      
      expect(startButtons.length).toBeGreaterThan(0);
      expect(learnMoreButton).toBeInTheDocument();
    });

    it('displays trust indicators', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/100% Private & Secure/i)).toBeInTheDocument();
      expect(screen.getByText(/10,000\+ Active Users/i)).toBeInTheDocument();
      expect(screen.getByText(/4\.9\/5 Rating/i)).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('renders all 6 feature cards', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/AI Companion/i)).toBeInTheDocument();
      expect(screen.getByText(/Persistent Memory/i)).toBeInTheDocument();
      expect(screen.getByText(/Personalized Growth/i)).toBeInTheDocument();
      expect(screen.getByText(/Community Connection/i)).toBeInTheDocument();
      expect(screen.getByText(/Gamification/i)).toBeInTheDocument();
      expect(screen.getByText(/Wellness Resources/i)).toBeInTheDocument();
    });

    it('displays feature descriptions', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Real-time voice conversations/i)).toBeInTheDocument();
      expect(screen.getByText(/remembers your journey/i)).toBeInTheDocument();
    });
  });

  describe('Stats Section', () => {
    it('renders statistics', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/10K\+/i)).toBeInTheDocument();
      expect(screen.getByText(/50K\+/i)).toBeInTheDocument();
      expect(screen.getByText(/4\.9★/i)).toBeInTheDocument();
      expect(screen.getByText(/95%/i)).toBeInTheDocument();
    });

    it('displays stat labels', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Conversations/i)).toBeInTheDocument();
      expect(screen.getByText(/User Rating/i)).toBeInTheDocument();
      expect(screen.getByText(/Satisfaction Rate/i)).toBeInTheDocument();
    });
  });

  describe('Pricing Section', () => {
    it('renders all 3 pricing tiers', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Discovery/i)).toBeInTheDocument();
      expect(screen.getByText(/Growth/i)).toBeInTheDocument();
      expect(screen.getByText(/Transformation/i)).toBeInTheDocument();
    });

    it('shows pricing information', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Free/i)).toBeInTheDocument();
      expect(screen.getByText(/\$22/i)).toBeInTheDocument();
      expect(screen.getByText(/\$222/i)).toBeInTheDocument();
    });

    it('displays Most Popular badge on featured tier', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Most Popular/i)).toBeInTheDocument();
    });

    it('shows CTA buttons for each tier', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Start Free/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose Growth/i)).toBeInTheDocument();
      expect(screen.getByText(/Transform Now/i)).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('renders footer sections', () => {
      renderWithRouter(<Landing />);
      expect(screen.getByText(/Product/i)).toBeInTheDocument();
      expect(screen.getByText(/Support/i)).toBeInTheDocument();
      expect(screen.getByText(/Legal/i)).toBeInTheDocument();
    });

    it('displays navigation links', () => {
      renderWithRouter(<Landing />);
      const assessmentLinks = screen.getAllByText(/Free Assessments/i);
      const aboutLinks = screen.getAllByText(/About/i);
      
      expect(assessmentLinks.length).toBeGreaterThan(0);
      expect(aboutLinks.length).toBeGreaterThan(0);
    });

    it('shows copyright information', () => {
      renderWithRouter(<Landing />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} Newomen`, 'i'))).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithRouter(<Landing />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has accessible buttons', () => {
      renderWithRouter(<Landing />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('has accessible links', () => {
      renderWithRouter(<Landing />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders without crashing on mobile viewport', () => {
      // Simulate mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      const { container } = renderWithRouter(<Landing />);
      expect(container).toBeInTheDocument();
    });

    it('renders without crashing on tablet viewport', () => {
      // Simulate tablet viewport
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      
      const { container } = renderWithRouter(<Landing />);
      expect(container).toBeInTheDocument();
    });

    it('renders without crashing on desktop viewport', () => {
      // Simulate desktop viewport
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      
      const { container } = renderWithRouter(<Landing />);
      expect(container).toBeInTheDocument();
    });
  });
});

