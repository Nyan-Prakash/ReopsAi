import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseComposer } from './case-composer';
import {
  setRuntimeConfig,
  resetRuntimeConfig,
} from '@/shared/runtime_config';

describe('CaseComposer - Feature Flag Integration', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    resetRuntimeConfig();
    mockOnSend.mockClear();
  });

  describe('AI Draft Button Visibility', () => {
    it('hides AI draft button when USE_LLM is false', () => {
      setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'draft' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const aiButton = screen.queryByTestId('ai-draft-button');
      expect(aiButton).not.toBeInTheDocument();
    });

    it('hides AI draft button when LLM_MODE is none', () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'none' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const aiButton = screen.queryByTestId('ai-draft-button');
      expect(aiButton).not.toBeInTheDocument();
    });

    it('hides AI draft button when LLM_MODE is classify', () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'classify' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const aiButton = screen.queryByTestId('ai-draft-button');
      expect(aiButton).not.toBeInTheDocument();
    });

    it('shows AI draft button when USE_LLM is true and LLM_MODE is draft', () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const aiButton = screen.getByTestId('ai-draft-button');
      expect(aiButton).toBeInTheDocument();
      expect(aiButton).toHaveTextContent('AI Draft');
    });
  });

  describe('Macro Button Functionality', () => {
    it('shows macro button regardless of AI settings', () => {
      setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'none' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const macroButton = screen.getByTestId('macro-button');
      expect(macroButton).toBeInTheDocument();
    });

    it('macro button remains functional when AI is disabled', async () => {
      setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'none' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const macroButton = screen.getByTestId('macro-button');
      const textarea = screen.getByRole('textbox', { name: /message input/i });

      await userEvent.click(macroButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('Thank you for contacting us.');
      });
    });

    it('macro button works alongside AI draft button when both enabled', async () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const macroButton = screen.getByTestId('macro-button');
      const aiButton = screen.getByTestId('ai-draft-button');

      expect(macroButton).toBeInTheDocument();
      expect(aiButton).toBeInTheDocument();

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await userEvent.click(macroButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('Thank you for contacting us.');
      });
    });
  });

  describe('Send Functionality', () => {
    it('sends message when AI is disabled', async () => {
      setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'none' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await userEvent.type(textarea, 'Test message without AI');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message without AI');
      });
    });

    it('sends message when AI is enabled', async () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await userEvent.type(textarea, 'Test message with AI');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Test message with AI');
      });
    });

    it('clears textarea after sending', async () => {
      setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'none' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await userEvent.type(textarea, 'Test message');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for all interactive elements', () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/insert macro/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/generate ai draft/i)).toBeInTheDocument();
    });

    it('maintains accessible labels when AI is disabled', () => {
      setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'none' });
      render(<CaseComposer caseId="case_001" onSend={mockOnSend} />);

      expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/insert macro/i)).toBeInTheDocument();
    });
  });
});