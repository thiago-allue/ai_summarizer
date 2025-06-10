import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummarizerPage from '../components/SummarizerPage';

/**
 * Basic unit tests for the SummarizerPage component.
 * Verifies rendering and some interactive elements.
 */
describe('SummarizerPage', () => {
  it('should render the heading', () => {
    render(<SummarizerPage />);
    const heading = screen.getByText(/Text Summarizer/i);
    expect(heading).toBeInTheDocument();
  });

  it('should render the summarize button', () => {
    render(<SummarizerPage />);
    const button = screen.getByRole('button', { name: /Summarize/i });
    expect(button).toBeInTheDocument();
  });
});
