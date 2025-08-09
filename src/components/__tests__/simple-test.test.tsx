import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Try to force legacy render
const { render: legacyRender } = require('@testing-library/react/dont-cleanup-after-each');

// Simple component for testing
const SimpleComponent = () => {
  return <div data-testid="simple-component">Hello World</div>;
};

describe('Simple Test', () => {
  it('should render a simple component', () => {
    try {
      render(<SimpleComponent />);
    } catch (error) {
      // Try legacy render if modern render fails
      console.log('Modern render failed, trying legacy approach');
      const ReactDOM = require('react-dom');
      const container = document.createElement('div');
      document.body.appendChild(container);
      ReactDOM.render(<SimpleComponent />, container);
    }
    expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});