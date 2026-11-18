import { render, screen } from '@testing-library/react';
import App from './App';

test('routes unauthenticated users to the ADN login', async () => {
  render(<App />);

  expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
});
