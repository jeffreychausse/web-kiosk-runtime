# Kiosk App

An Electron-based kiosk application that displays web content in fullscreen mode. It includes an HTTP API for remote URL control and integration with Moment Factory's Control Center via Tasktoolkit.

## Architecture

```
kiosk-app/
├── main.js                    # Application entry point
├── config.js                  # Centralized configuration (reads from env)
├── kiosk-controller.js        # Electron window management
├── api-server.js              # Express HTTP API server
├── tasktoolkit-integration.js # Control Center integration
├── error.html                 # Fallback/waiting screen
├── .env                       # Environment configuration (create from .env.example)
├── .env.example               # Environment template
└── lib/tasktoolkit/           # Tasktoolkit native library
```

## Prerequisites

- Node.js (v18+)
- Linux with Wayland display server (Ubuntu Frame)
- For Tasktoolkit: native library in `lib/tasktoolkit/`

## Installation

```bash
cd kiosk-app
npm install
```

This installs all dependencies defined in `package.json`:
- `electron` - Chromium-based desktop app framework
- `express` - HTTP API server
- `electron-store` - Persistent settings storage
- `electron-log` - File logging
- `dotenv` - Environment variable loading
- `koffi` - FFI for native library (Tasktoolkit)

## Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```env
   # API Server
   PORT=3333

   # Tasktoolkit Configuration
   TASKTOOLKIT_PROJECT_ID=your-project-id
   TASKTOOLKIT_MQTT_BROKER=your-mqtt-broker-ip
   TASKTOOLKIT_DATASTORE_HOST=your-datastore-host-ip
   TASKTOOLKIT_SOFTWARE_NAME=KioskApp
   TASKTOOLKIT_SOFTWARE_DISPLAY_NAME=Kiosk Application
   TASKTOOLKIT_CATALOG_NAME=Kiosk Application
   TASKTOOLKIT_LOCAL_IP=0.0.0.0
   TASKTOOLKIT_UPDATE_INTERVAL_MS=5000
   ```

## Running the App

### Manual startup (without Tasktoolkit)

```bash
cd kiosk-app
sudo env PATH=$PATH XDG_RUNTIME_DIR=/run/user/0 WAYLAND_DISPLAY=wayland-0 \
  dbus-run-session -- ./node_modules/.bin/electron . \
  --no-sandbox --ozone-platform=wayland \
  --ignore-gpu-blocklist --disable-gpu-sandbox --gpu-no-context-lost
```

### Manual startup (with Tasktoolkit)

The Tasktoolkit native library requires `LD_LIBRARY_PATH` to be set:

```bash
cd kiosk-app
sudo env LD_LIBRARY_PATH="/home/mofa/kiosk-app/lib" PATH=$PATH \
  XDG_RUNTIME_DIR=/run/user/0 WAYLAND_DISPLAY=wayland-0 \
  dbus-run-session -- ./node_modules/.bin/electron . \
  --no-sandbox --ozone-platform=wayland \
  --ignore-gpu-blocklist --disable-gpu-sandbox --gpu-no-context-lost
```

## HTTP API (tasks also exposed to the Control Center)

The app exposes an HTTP API on the configured `PORT` (default: 3333).

### Set URL
```bash
curl -X POST http://localhost:3333/url -H "Content-Type: application/json" -d '{"url": "https://example.com"}'
```

### Get Current URL
```bash
curl http://localhost:3333/url
```

## Logs

Logs are written to the Electron default log location:
- Linux: `~/.config/kiosk-app/logs/`

Log file location is printed on startup.

## Systemd Service

For production deployment, copy the whole folder to /opt and use the provided `kiosk-app.service` systemd unit file.