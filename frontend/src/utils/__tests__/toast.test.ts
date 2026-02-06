/**
 * Tests for Toast Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  dismissToast,
} from '../toast.tsx';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: vi.fn((_message: string, _options?: any) => 'toast-id'),
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
  promise: vi.fn(),
}));

describe('Toast Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showSuccess', () => {
    it('should call toast.success with message', () => {
      showSuccess('Test success message');
      
      expect(toast.success).toHaveBeenCalledWith(
        'Test success message',
        expect.objectContaining({
          duration: 3000,
        })
      );
    });

    it('should accept custom duration', () => {
      showSuccess('Test', { duration: 5000 });
      
      expect(toast.success).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          duration: 5000,
        })
      );
    });
  });

  describe('showError', () => {
    it('should call toast.error with message', () => {
      showError('Test error');
      
      expect(toast.error).toHaveBeenCalledWith(
        'Test error',
        expect.any(Object)
      );
    });

    it('should append error message when Error object provided', () => {
      const error = new Error('Network failed');
      showError('Request failed', error);
      
      expect(toast.error).toHaveBeenCalledWith(
        'Request failed: Network failed',
        expect.any(Object)
      );
    });

    it('should append error string when string provided', () => {
      showError('Request failed', 'Connection timeout');
      
      expect(toast.error).toHaveBeenCalledWith(
        'Request failed: Connection timeout',
        expect.any(Object)
      );
    });
  });

  describe('showWarning', () => {
    it('should display warning toast', () => {
      showWarning('Warning message');
      
      expect(toast).toHaveBeenCalledWith(
        'Warning message',
        expect.objectContaining({
          icon: '⚠️',
        })
      );
    });
  });

  describe('showInfo', () => {
    it('should display info toast', () => {
      showInfo('Info message');
      
      expect(toast).toHaveBeenCalledWith(
        'Info message',
        expect.objectContaining({
          icon: 'ℹ️',
        })
      );
    });
  });

  describe('showLoading', () => {
    it('should call toast.loading with default message', () => {
      showLoading();
      
      expect(toast.loading).toHaveBeenCalledWith(
        'Chargement...',
        expect.any(Object)
      );
    });

    it('should call toast.loading with custom message', () => {
      showLoading('Saving data...');
      
      expect(toast.loading).toHaveBeenCalledWith(
        'Saving data...',
        expect.any(Object)
      );
    });

    it('should return toast id', () => {
      (toast.loading as any).mockReturnValue('toast-123');
      
      const id = showLoading('Test');
      
      expect(id).toBe('toast-123');
    });
  });

  describe('dismissToast', () => {
    it('should call toast.dismiss with id', () => {
      dismissToast('toast-123');
      
      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });
  });
});
