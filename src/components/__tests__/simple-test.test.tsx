import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component for testing
const SimpleComponent = () => {
  return <div data-testid="simple-component">Hello World</div>;
};

describe('Simple Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have working DOM', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello World');
    
    document.body.removeChild(div);
  });

  it('should create DOM elements', () => {
    const element = document.createElement('div');
    element.setAttribute('data-testid', 'test-element');
    element.textContent = 'Test Content';
    
    expect(element.getAttribute('data-testid')).toBe('test-element');
    expect(element.textContent).toBe('Test Content');
  });

  it('should render a simple React component', () => {
    render(<SimpleComponent />);
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should have correct text content', () => {
    render(<SimpleComponent />);
    
    const component = screen.getByTestId('simple-component');
    expect(component).toHaveTextContent('Hello World');
  });

  it('should be accessible', () => {
    render(<SimpleComponent />);
    
    const component = screen.getByTestId('simple-component');
    expect(component).toBeVisible();
  });
});