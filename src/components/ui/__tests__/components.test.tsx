/**
 * UI Components Smoke Tests
 * Ensures all components render without crashing
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import all components
import { Alert, AlertTitle, AlertDescription } from '../alert';
import { Badge } from '../badge';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Input } from '../input';
import { Label } from '../label';
import { ScrollArea } from '../scroll-area';
import { Skeleton } from '../skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../table';

describe('UI Components', () => {
  it('renders Alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Test Alert</AlertTitle>
        <AlertDescription>This is a test description</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('Test Alert')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders Badge', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders Button with variants', () => {
    const { rerender } = render(<Button>Default</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Default');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Outline');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Ghost');
  });

  it('renders Checkbox and toggles checked state', async () => {
    const user = userEvent.setup();
    render(<Checkbox data-testid="checkbox" />);

    const checkbox = screen.getByTestId('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('renders Input', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders Label', () => {
    render(<Label htmlFor="test">Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders ScrollArea', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>Scrollable content</div>
      </ScrollArea>
    );
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  it('renders Skeleton', () => {
    render(<Skeleton className="h-4 w-full" data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders Table with structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('Input accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);

    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
    await user.type(input, 'Hello World');
    expect(input.value).toBe('Hello World');
  });

  it('Button is clickable', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click Me</Button>);

    const button = screen.getByRole('button');
    await user.click(button);
    expect(clicked).toBe(true);
  });
});
