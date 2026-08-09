// PM2: sirve desk-web/dist (útil si nginx hace proxy a :3080)
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.DESK_WEB_PORT || 3080;

module.exports = {
  apps: [
    {
      name: 'desk-web',
      script: 'npx',
      args: `serve -s ${path.join(ROOT, 'desk-web/dist')} -l ${PORT}`,
      cwd: ROOT,
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
    },
  ],
};
