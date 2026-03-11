import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders WonderWallet app', () => {
  render(<App />);
  const titleElement = screen.getByText(/WonderWallet/i);
  expect(titleElement).toBeDefined();
});
