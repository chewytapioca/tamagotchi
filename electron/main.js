// Tamago desktop pet — frameless, transparent, always-on-top window that
// loads the app's /overlay route so only the pet floats on your desktop.
const { app, BrowserWindow, Tray, Menu, nativeImage, screen, shell } = require('electron')
const path = require('path')

// Where to load the pet from. Point this at your dev server or deployed site:
//   TAMAGO_URL=https://your-app.vercel.app npm run desktop
const BASE_URL = process.env.TAMAGO_URL || 'http://localhost:3000'
const OVERLAY_URL = `${BASE_URL.replace(/\/$/, '')}/overlay`

const WIN_W = 220
const WIN_H = 250

let win = null
let tray = null
let clickThrough = false

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay()
  // tuck into the bottom-right corner by default
  const x = workArea.x + workArea.width - WIN_W - 24
  const y = workArea.y + workArea.height - WIN_H - 24

  win = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    x, y,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // float above almost everything, and show on every macOS space
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.loadURL(OVERLAY_URL)
}

function applyClickThrough(on) {
  clickThrough = on
  if (win) win.setIgnoreMouseEvents(on, { forward: true })
  refreshTrayMenu()
}

// a tiny built-in tray icon (replace electron/icon.png for something cuter)
function trayIcon() {
  const file = path.join(__dirname, 'icon.png')
  const img = nativeImage.createFromPath(file)
  if (!img.isEmpty()) return img
  // fallback: 1x1 pink dot so the tray still appears
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4z8BQDwAFhAGAjbBSEwAAAABJRU5ErkJggg==',
  )
}

function refreshTrayMenu() {
  if (!tray) return
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: win && win.isVisible() ? 'Hide pet' : 'Show pet', click: toggleVisible },
    { label: 'Click-through mode', type: 'checkbox', checked: clickThrough,
      click: (item) => applyClickThrough(item.checked) },
    { label: 'Open full app', click: () => shell.openExternal(BASE_URL) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]))
}

function toggleVisible() {
  if (!win) return
  if (win.isVisible()) win.hide()
  else win.show()
  refreshTrayMenu()
}

app.whenReady().then(() => {
  createWindow()
  tray = new Tray(trayIcon())
  tray.setToolTip('Tamago')
  tray.on('click', toggleVisible)
  refreshTrayMenu()

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

// keep running in the tray even with no windows (it's a desktop pet)
app.on('window-all-closed', () => { /* stay alive in the tray */ })
