const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const appNodeModules = path.resolve(__dirname, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

module.exports = {
  watchFolders: [workspaceRoot, workspaceNodeModules],
  resolver: {
    nodeModulesPaths: [appNodeModules, workspaceNodeModules],
  },
};
