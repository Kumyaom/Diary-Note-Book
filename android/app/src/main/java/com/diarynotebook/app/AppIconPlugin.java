package com.diarynotebook.app;

import android.content.ComponentName;
import android.content.pm.PackageManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Switches the launcher icon between the light and dark logo by enabling one activity-alias. */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {
    private static final String[][] ALIASES = {
        {"notebook_light", ".NotebookLight"},
        {"notebook_dark", ".NotebookDark"}
    };

    @PluginMethod
    public void change(PluginCall call) {
        String name = call.getString("name");
        boolean known = false;
        for (String[] a : ALIASES) {
            if (a[0].equals(name)) known = true;
        }
        if (!known) {
            call.reject("This icon can't be used as the launcher icon");
            return;
        }
        try {
            PackageManager pm = getContext().getPackageManager();
            String pkg = getContext().getPackageName();
            // Enable the wanted entry first so there is always a launcher entry, then disable the other.
            for (String[] a : ALIASES) {
                if (a[0].equals(name)) {
                    pm.setComponentEnabledSetting(new ComponentName(pkg, pkg + a[1]),
                        PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                }
            }
            for (String[] a : ALIASES) {
                if (!a[0].equals(name)) {
                    pm.setComponentEnabledSetting(new ComponentName(pkg, pkg + a[1]),
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                }
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Couldn't change the icon");
        }
    }
}
