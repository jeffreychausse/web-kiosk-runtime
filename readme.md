Install Electron

npm install electron --save-dev

Run the following command instead of npm start to start main.js

sudo env PATH=$PATH XDG_RUNTIME_DIR=/run/user/0 WAYLAND_DISPLAY=wayland-0 dbus-run-session -- ./node_modules/.bin/electron . --no-sandbox --ozone-platform=wayland --ignore-gpu-blocklist --disable-gpu-sandbox --gpu-no-context-lost

With tasktoolkit, run:

sudo env LD_LIBRARY_PATH="/home/mofa/kiosk-app/@momentfactory_node-mf-tasktoolkit-dll-3.8.3/@momentfactory_node-mf-tasktoolkit-dll-3.8.3/package/bin/Ubuntu/x64/" PATH=$PATH XDG_RUNTIME_DIR=/run/user/0 WAYLAND_DISPLAY=wayland-0 dbus-run-session -- ./node_modules/.bin/electron . --no-sandbox --ozone-platform=wayland --ignore-gpu-blocklist --disable-gpu-sandbox --gpu-no-context-lost
