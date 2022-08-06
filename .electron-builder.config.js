const pkg = require('./package.json');
if (process.env.VITE_APP_VERSION === undefined) {
  const now = new Date();
  process.env.VITE_APP_VERSION =
    pkg.version ||
    `${now.getUTCFullYear() - 2000}.${
      now.getUTCMonth() + 1
    }.${now.getUTCDate()}-${now.getUTCHours() * 60 + now.getUTCMinutes()}`;
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  productName: '打工人的Excel',
  asar: false,
  publish: {
    provider: 'github',
    owner: 'yeojongki',
    repo: 'electron-excel-seach',
  },
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  files: ['packages/**/dist/**'],
  extraMetadata: {
    version: process.env.VITE_APP_VERSION,
  },
  npmRebuild: false,
  win: {
    verifyUpdateCodeSignature: false,
  },
  mac: {
    target: ['dmg', 'zip'],
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
  },
};

module.exports = config;
