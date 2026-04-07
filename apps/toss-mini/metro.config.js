const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const appNodeModules = path.resolve(__dirname, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

module.exports = {
  watchFolders: [workspaceRoot, workspaceNodeModules],
  // @sentry 패키지는 import.meta 구문을 포함하므로 Babel 트랜스파일 대상에 포함
  transformIgnorePatterns: ['node_modules/(?!@sentry/)'],
  resolver: {
    nodeModulesPaths: [appNodeModules, workspaceNodeModules],
  },
};
