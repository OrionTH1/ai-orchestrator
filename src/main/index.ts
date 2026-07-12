import { fileURLToPath } from 'node:url'
import { CONSTANTS, PLATFORM } from '@shared/constants'
import { app, BrowserWindow } from 'electron'

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (CONSTANTS.IS_DEV) {
    window.webContents.openDevTools()
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(
      fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
    )
  }
}

app.on('web-contents-created', (_event, contents) => {
  // Block navigating the window away from the app shell outside development.
  contents.on('will-navigate', (event) => {
    if (!CONSTANTS.IS_DEV) event.preventDefault()
  })
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!PLATFORM.IS_MAC) app.quit()
})
