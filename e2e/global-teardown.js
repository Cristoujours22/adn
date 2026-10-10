const { resetEmulatorState } = require('./support/emulators');

module.exports = async function globalTeardown() {
  await resetEmulatorState();
};
