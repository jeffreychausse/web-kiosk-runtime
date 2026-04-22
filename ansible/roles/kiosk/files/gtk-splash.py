#!/usr/bin/env python3
import gi
import socket
import os

gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk

class SplashScreen(Gtk.Window):
    def __init__(self):
        super().__init__(title="Kiosk Splash")
        
        # 1. Force the window to be fullscreen
        self.fullscreen()
        
        # 2. Paint the background black using CSS
        css_provider = Gtk.CssProvider()
        css_provider.load_from_data(b"window { background-color: black; }")
        self.get_style_context().add_provider(css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)

        # 3. Grab Hostname and IP cleanly
        hostname = os.uname()[1]
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
        except Exception:
            ip = "No Network"

        # 4. Create a vertical box to hold and center our text
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        vbox.set_valign(Gtk.Align.CENTER)
        vbox.set_halign(Gtk.Align.CENTER)
        self.add(vbox)

        # 5. Add the formatted text labels
        lbl_title = Gtk.Label()
        lbl_title.set_markup("<span foreground='#55aaff' font='64'>No App Running...</span>")
        vbox.pack_start(lbl_title, False, False, 0)

        lbl_host = Gtk.Label()
        lbl_host.set_markup(f"<span foreground='white' font='48'>Hostname: {hostname}</span>")
        vbox.pack_start(lbl_host, False, False, 0)

        lbl_ip = Gtk.Label()
        lbl_ip.set_markup(f"<span foreground='#00ffaa' font='48'>IP Address: {ip}</span>")
        vbox.pack_start(lbl_ip, False, False, 0)

# 6. Start the native Wayland app
win = SplashScreen()
win.connect("destroy", Gtk.main_quit)
win.show_all()
Gtk.main()