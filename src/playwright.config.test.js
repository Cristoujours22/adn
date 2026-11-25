const fs = require('fs');
const path = require('path');

describe('Playwright web server safety', () => {
  test('always starts its own emulator-backed application server', () => {
    const configSource = fs.readFileSync(
      path.resolve(__dirname, '../playwright.config.js'),
      'utf8'
    );

    expect(configSource).toMatch(/reuseExistingServer:\s*false/);
    expect(configSource).toMatch(
      /command:\s*['"][^'"]*REACT_APP_USE_FIREBASE_EMULATORS=true[^'"]*['"]/
    );
  });
});
