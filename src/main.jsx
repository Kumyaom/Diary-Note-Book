import React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import NotesApp from "./App.jsx";
import { installStorage } from "./storage.js";

installStorage(); // window.storage -> IndexedDB on the phone (survives restarts, works offline)

// Make the native plugins reachable where the app looks for them (window.Capacitor.Plugins.X).
Capacitor.Plugins = Capacitor.Plugins || {};
Capacitor.Plugins.App = Capacitor.Plugins.App || CapApp;
Capacitor.Plugins.LocalNotifications = Capacitor.Plugins.LocalNotifications || LocalNotifications;
Capacitor.Plugins.BiometricAuth = Capacitor.Plugins.BiometricAuth || BiometricAuth;

if (Capacitor.isNativePlatform()) {
  // WebViews cannot "download" a blob, so exported files are written to the app cache and handed to
  // Android's share sheet (Save to Files / Drive / email ...).
  const origClick = HTMLAnchorElement.prototype.click;
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  HTMLAnchorElement.prototype.click = function patchedClick(...args) {
    if (this.hasAttribute("download") && String(this.href).startsWith("blob:")) {
      const name = (this.getAttribute("download") || "file").replace(/[^\w.\- ]+/g, "_");
      const pending = fetch(this.href); // started now, before the page revokes the temporary URL
      (async () => {
        try {
          const blob = await (await pending).blob();
          const path = `exports/${Date.now()}-${name}`;
          await Filesystem.writeFile({ path, data: await blobToBase64(blob), directory: Directory.Cache, recursive: true });
          const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
          await Share.share({ title: name, url: uri, dialogTitle: name });
        } catch (e) {
          /* user closed the share sheet or sharing is unavailable */
        }
      })();
      return undefined;
    }
    return origClick.apply(this, args);
  };

  // Hardware / gesture Back: close the top dialog, else go back one screen, else leave the app.
  const visible = (el) => !!(el && (el.offsetParent || getComputedStyle(el).position === "fixed"));
  CapApp.addListener("backButton", () => {
    const overlays = Array.from(document.querySelectorAll('[style*="position: fixed"][style*="inset: 0"]')).filter(
      (el) => /rgba\(0, 0, 0/.test(el.style.background || "") && el.children.length
    );
    if (overlays.length) {
      overlays[overlays.length - 1].click();
      return;
    }
    const backs = Array.from(document.querySelectorAll('[aria-label="Back"],[aria-label="Close search"]')).filter(visible);
    if (backs.length) {
      backs[backs.length - 1].click();
      return;
    }
    CapApp.exitApp();
  });
}

createRoot(document.getElementById("root")).render(React.createElement(NotesApp));
