const fs = require('node:fs/promises');
const path = require('node:path');
const { withDangerousMod } = require('expo/config-plugins');

module.exports = (config, { icon }) => withDangerousMod(config, ['android', async (mod) => {
  const { projectRoot, platformProjectRoot } = mod.modRequest;
  const drawable = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable-nodpi');
  await fs.mkdir(drawable, { recursive: true });
  // React Native Firebase references this resource from the generated manifest.
  await fs.copyFile(path.resolve(projectRoot, icon), path.join(drawable, 'notification_icon.png'));
  return mod;
}]);
