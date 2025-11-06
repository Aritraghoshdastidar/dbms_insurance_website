import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page by default', () => {
  render(<App />);
  // Login page renders heading "Customer Login" by default
  expect(screen.getByText(/customer login/i)).toBeInTheDocument();
});
