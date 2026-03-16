import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AboutModal } from '@/components/AboutModal';

describe('AboutModal', () => {
  it('renders the ABOUT button', () => {
    render(<AboutModal />);
    expect(screen.getByText('[ ABOUT ]')).toBeInTheDocument();
  });

  it('opens modal on click', () => {
    render(<AboutModal />);
    fireEvent.click(screen.getByText('[ ABOUT ]'));
    expect(screen.getByText(/DECLASSIFIED/)).toBeInTheDocument();
    expect(screen.getByText(/PROJECT OVERVIEW/)).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    render(<AboutModal />);
    fireEvent.click(screen.getByText('[ ABOUT ]'));
    expect(screen.getByText(/DECLASSIFIED/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/DECLASSIFIED/)).not.toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    render(<AboutModal />);
    fireEvent.click(screen.getByText('[ ABOUT ]'));
    expect(screen.getByText(/DECLASSIFIED/)).toBeInTheDocument();

    // Click the backdrop (the outermost overlay div)
    const backdrop = screen.getByText(/DECLASSIFIED/).closest('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(screen.queryByText(/DECLASSIFIED/)).not.toBeInTheDocument();
  });
});
