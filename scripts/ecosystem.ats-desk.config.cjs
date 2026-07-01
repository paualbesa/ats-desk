// PM2: un solo proceso "ats-desk" que ejecuta hbbs + hbbr.
// Uso: pm2 start scripts/ecosystem.ats-desk.config.cjs
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const HOME = process.env.HOME || '/home/ats-server';

module.exports = {
  apps: [
    {
      name: 'ats-desk',
      script: path.join(REPO, 'scripts/ats-desk-server.sh'),
      interpreter: 'bash',
      cwd: REPO,
      env: {
        RELAY_HOST: process.env.RELAY_HOST || '',
        RELAY_PORT: process.env.RELAY_PORT || '21117',
        ATS_DESK_BIN_DIR: process.env.ATS_DESK_BIN_DIR || path.join(HOME, 'bin'),
        ATS_DESK_DATA_DIR: process.env.ATS_DESK_DATA_DIR || path.join(HOME, 'rustdesk-data'),
      },
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      watch: false,
    },
  ],
};
