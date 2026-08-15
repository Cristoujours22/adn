import React from 'react'; import { render, waitFor, act } from '@testing-library/react'; import ServicesCarousel from './ServicesCarousel';

test('real unmocked Slick responds to desktop and narrow breakpoints', async () => {
  window.innerWidth = 1200;
  const records = [];
  window.matchMedia = (media) => { const record = { matches: window.innerWidth <= 600, media, listener: null, addListener: (listener) => { record.listener = listener; }, addEventListener: (event, listener) => { record.listener = listener; }, removeListener: () => {}, removeEventListener: () => {} }; records.push(record); return record; };
  const { container } = render(<ServicesCarousel speed={0} services={[{ serviceId: 'a', nomenclatura: 'A' }, { serviceId: 'b', nomenclatura: 'B' }, { serviceId: 'c', nomenclatura: 'C' }]} onSelect={jest.fn()} />);
  const visible = () => [...container.querySelectorAll('[aria-hidden="false"]')].map((node) => node.textContent);
  expect(visible()).toHaveLength(3);
  window.innerWidth = 480;
  await act(async () => { records.forEach((record) => { record.matches = record.media.includes('max-width'); record.listener?.({ matches: record.matches }); }); window.dispatchEvent(new Event('resize')); });
  await waitFor(() => expect(visible()).toHaveLength(1));
});
