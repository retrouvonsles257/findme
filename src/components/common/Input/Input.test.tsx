import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('should render with helper text', () => {
      render(<Input helperText="This is helper text" />);
      expect(screen.getByText(/this is helper text/i)).toBeInTheDocument();
    });

    it('should render placeholder text', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render all sizes', () => {
      const sizes = ['sm', 'md', 'lg'];
      sizes.forEach((size) => {
        const { unmount } = render(<Input size={size as any} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Variants', () => {
    it('should render all variants', () => {
      const variants = ['default', 'error', 'success'];
      variants.forEach((variant) => {
        const { unmount } = render(<Input variant={variant as any} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should be readonly when readonly prop is true', () => {
      render(<Input readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('should apply fullWidth class', () => {
      render(<Input fullWidth />);
      expect(screen.getByRole('textbox')).toHaveClass('fullWidth');
    });
  });

  describe('Icons', () => {
    it('should render start icon', () => {
      render(<Input startIcon={<span data-testid="start-icon">@</span>} />);
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('should render end icon', () => {
      render(<Input endIcon={<span data-testid="end-icon">✓</span>} />);
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('should render both icons', () => {
      render(
        <Input
          startIcon={<span data-testid="start-icon">@</span>}
          endIcon={<span data-testid="end-icon">✓</span>}
        />
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should update value on change', async () => {
      render(<Input data-testid="input-field" />);
      const input = screen.getByTestId('input-field') as HTMLInputElement;

      await userEvent.type(input, 'hello');
      expect(input.value).toBe('hello');
    });

    it('should call onChange handler', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus handler', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should call onBlur handler', async () => {
      const handleBlur = jest.fn();
      render(
        <div>
          <Input onBlur={handleBlur} />
          <button>Other</button>
        </div>
      );
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');

      await userEvent.click(input);
      await userEvent.click(button);
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should support custom className', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    it('should generate unique id if not provided', () => {
      const { unmount: unmount1 } = render(<Input label="Test" />);
      const input1 = screen.getByRole('textbox');
      const labelFor1 = input1.getAttribute('id');
      unmount1();

      const { unmount: unmount2 } = render(<Input label="Test" />);
      const input2 = screen.getByRole('textbox');
      const labelFor2 = input2.getAttribute('id');
      unmount2();

      expect(labelFor1).not.toBe(labelFor2);
    });

    it('should use provided id', () => {
      render(<Input id="custom-id" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    });
  });
});
