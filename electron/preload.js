// preload script which basically runs before the renderer process

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform
});
