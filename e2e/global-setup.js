const { seedEmulatorData } = require('./support/emulators');

module.exports = async function globalSetup() {
  await seedEmulatorData();
};
