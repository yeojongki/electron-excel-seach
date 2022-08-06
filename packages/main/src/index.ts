import { app, dialog, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import './security-restrictions';
import { restoreOrCreateWindow } from '/@/mainWindow';

/**
 * Prevent multiple instances
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

/**
 * Disable Hardware Acceleration for more power-save
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * @see https://www.electronjs.org/docs/v14-x-y/api/app#event-activate-macos Event: 'activate'
 */
app.on('activate', restoreOrCreateWindow);

/**
 * Create app window when background process will be ready
 */

autoUpdater.autoDownload = false;
if (import.meta.env.DEV) {
  autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}

app
  .whenReady()
  .then(restoreOrCreateWindow)
  .then(() => {
    autoUpdater.on('error', (error) => {
      dialog.showErrorBox('更新失败', JSON.stringify(error));
    });

    autoUpdater.on('download-progress', (progress) => {
      const window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      window?.setProgressBar(progress.percent);
    });

    autoUpdater.on('update-downloaded', () => {
      dialog
        .showMessageBox({
          title: '安装更新',
          message: '新版本已下载完成, 是否退出应用并更新',
          buttons: ['是', '否'],
        })
        .then(({ response }) => {
          if (response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
    });

    autoUpdater.on('update-available', () => {
      dialog
        .showMessageBox({
          type: 'info',
          title: '发现新版本',
          message: '是否立即更新',
          buttons: ['是', '否'],
        })
        .then(({ response }) => {
          if (response === 0) {
            // 执行更新
            autoUpdater.downloadUpdate();
          } else {
            // 取消更新
          }
        });
    });

    // 开发环境设置为 true 调试更新
    const oldIsPackaged = app.isPackaged;
    if (import.meta.env.DEV) {
      Object.defineProperty(app, 'isPackaged', {
        get() {
          return true;
        },
      });
    }
    autoUpdater
      .checkForUpdatesAndNotify()
      .then((res) => {
        console.log(res);
      })
      .finally(() => {
        if (import.meta.env.DEV) {
          Object.defineProperty(app, 'isPackaged', {
            get() {
              return oldIsPackaged;
            },
          });
        }
      });
  })
  .catch((e) => {
    console.error('Failed create window or check updates:');
    console.error(e);
  });

/**
 * Install Vue.js or some other devtools in development mode only
 */
if (import.meta.env.DEV) {
  app
    .whenReady()
    .then(() => import('electron-devtools-installer'))
    .then(({ default: installExtension, VUEJS3_DEVTOOLS }) =>
      installExtension(VUEJS3_DEVTOOLS, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      }),
    )
    .catch((e) => console.error('Failed install extension:', e));
}

/**
 * Check new app version
 */
app.whenReady();
