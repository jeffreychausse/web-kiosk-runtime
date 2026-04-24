Install Electron

npm install electron --save-dev

Run the following command instead of npm start to start main.js

sudo env PATH=$PATH XDG_RUNTIME_DIR=/run/user/0 WAYLAND_DISPLAY=wayland-0 dbus-run-session -- ./node_modules/.bin/electron . --no-sandbox --ozone-platform=wayland --ignore-gpu-blocklist --disable-gpu-sandbox --gpu-no-context-lost

With tasktoolkit, run:

sudo env LD_LIBRARY_PATH="/home/mofa/kiosk-app/lib" PATH=$PATH XDG_RUNTIME_DIR=/run/user/0 WAYLAND_DISPLAY=wayland-0 dbus-run-session -- ./node_modules/.bin/electron . --no-sandbox --ozone-platform=wayland --ignore-gpu-blocklist --disable-gpu-sandbox --gpu-no-context-lost