#!/usr/bin/env python3
import gi
import socket
import os

gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk

def calculate_font_sizes():
    """
    Calculate adaptive font sizes based on display resolution.
    Uses the smaller screen dimension to handle both landscape and portrait orientations.
    Reference: 1080 pixels = base font sizes (title: 64, text: 48)
    """
    try:
        display = Gdk.Display.get_default()
        if display is None:
            return 64, 48  # Fallback to defaults
        
        # Try to get the primary monitor, fall back to first monitor
        monitor = display.get_primary_monitor()
        if monitor is None:
            monitor = display.get_monitor(0)
        if monitor is None:
            return 64, 48  # Fallback to defaults
        
        geometry = monitor.get_geometry()
        width, height = geometry.width, geometry.height
        
        # Use smaller dimension for scaling (works for both orientations)
        min_dimension = min(width, height)
        
        # Reference: 1080 pixels = base font sizes
        scale_factor = min_dimension / 1080.0
        
        # Calculate adaptive font sizes
        title_font_size = int(64 * scale_factor)
        text_font_size = int(48 * scale_factor)
        
        # Clamp to reasonable bounds
        title_font_size = max(24, min(128, title_font_size))
        text_font_size = max(18, min(96, text_font_size))
        
        return title_font_size, text_font_size
        
    except Exception:
        # If anything goes wrong, return defaults
        return 64, 48

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

        # 4. Calculate adaptive font sizes based on screen resolution
        title_font, text_font = calculate_font_sizes()

        # 5. Create a vertical box to hold and center our text
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        vbox.set_valign(Gtk.Align.CENTER)
        vbox.set_halign(Gtk.Align.CENTER)
        self.add(vbox)

        # 6. Add the formatted text labels with adaptive font sizes
        lbl_title = Gtk.Label()
        lbl_title.set_markup(f"<span foreground='#55aaff' font='{title_font}'>No App Running...</span>")
        vbox.pack_start(lbl_title, False, False, 0)

        lbl_host = Gtk.Label()
        lbl_host.set_markup(f"<span foreground='white' font='{text_font}'>Hostname: {hostname}</span>")
        vbox.pack_start(lbl_host, False, False, 0)

        lbl_ip = Gtk.Label()
        lbl_ip.set_markup(f"<span foreground='#00ffaa' font='{text_font}'>IP Address: {ip}</span>")
        vbox.pack_start(lbl_ip, False, False, 0)

# 7. Start the native Wayland app
win = SplashScreen()
win.connect("destroy", Gtk.main_quit)
win.show_all()
Gtk.main()