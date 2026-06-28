# Tamago desktop pet 🥚

Runs your pet as a floating, always-on-top desktop companion. It's a thin
Electron shell that loads the app's transparent `/overlay` route, so all the
game logic, auth, and data stay in the web app.

## Run it (dev)

1. Install deps (adds Electron):
   ```
   npm install
   ```
2. Start the web app in one terminal:
   ```
   npm run dev
   ```
3. Launch the desktop pet in another:
   ```
   npm run desktop
   ```
   Sign in inside the floating window once (it has its own cookie jar).

Point it at a deployed build instead of localhost:
```
TAMAGO_URL=https://your-app.vercel.app npm run desktop
```

## Behavior

- **Frameless + transparent + always-on-top** — only the pet shows.
- **Drag** the pet anywhere (the window surface is a drag handle).
- **Hover** the pet for a quick action bar (feed / play / hug) and its speech.
- **Click** the pet to give it a hug.
- **Tray menu**: show/hide, *Click-through mode* (lets clicks pass to the
  desktop behind the pet), open the full app, and quit. It keeps running in
  the tray after you close the window.

## Package an installer

```
npm run desktop:build
```
Outputs to `dist-desktop/` (NSIS on Windows, AppImage on Linux, dmg/zip on
macOS). Replace `electron/icon.png` with a real icon for a nicer tray/app icon
(otherwise a tiny fallback dot is used).

## Notes

- The overlay reuses `PetWithCosmetics`, so equipped hats/outfits show too.
- Stats decay + surprises still come from the same `/api/pet` endpoint.
- Want it to *wander* the screen? Animate the window with `win.setPosition`
  in `main.js` on a timer.
