const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for DhwaniPay Android Notification Listener
 *
 * 1. Injects required permissions into AndroidManifest.xml
 * 2. Registers PaymentNotificationListenerService in the manifest
 * 3. Copies the Kotlin service source into the generated Android project
 *
 * Runs automatically during `npx expo prebuild` or EAS Build.
 */
module.exports = function withNotificationListener(config) {
  // Step 1: Manifest modifications (permissions + service registration)
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Required permissions for notification listening and WakeLock
    const requiredPermissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.WAKE_LOCK',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'android.permission.POST_NOTIFICATIONS',
    ];

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    requiredPermissions.forEach((perm) => {
      const exists = androidManifest['uses-permission'].some(
        (item) => item.$['android:name'] === perm
      );
      if (!exists) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    // Register NotificationListenerService under <application>
    const app = androidManifest.application[0];
    if (!app.service) {
      app.service = [];
    }

    const serviceName = '.PaymentNotificationListenerService';
    const existingIdx = app.service.findIndex((s) => s.$['android:name'] === serviceName);

    const serviceEntry = {
      $: {
        'android:name': serviceName,
        'android:label': 'DhwaniPay Soundbox Service',
        'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.service.notification.NotificationListenerService',
              },
            },
          ],
        },
      ],
    };

    if (existingIdx >= 0) {
      app.service[existingIdx] = serviceEntry;
    } else {
      app.service.push(serviceEntry);
    }

    return config;
  });

  // Step 2: Copy Kotlin service source to generated Android project
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      // Determine the Java/Kotlin package directory from the app's package name
      const packageName = config.android?.package || 'in.dhwanipay.app';
      const packagePath = packageName.replace(/\./g, '/');
      const targetDir = path.join(platformRoot, 'app/src/main/java', packagePath);

      fs.mkdirSync(targetDir, { recursive: true });

      // Copy PaymentNotificationListenerService.kt from android-native/
      const serviceSource = path.join(
        projectRoot,
        'android-native',
        'PaymentNotificationListenerService.kt'
      );
      const serviceTarget = path.join(targetDir, 'PaymentNotificationListenerService.kt');

      // Kotlin hard keywords cannot be used as plain package segments —
      // they must be escaped with backticks (e.g. `in`.dhwanipay.app,
      // matching Expo's own MainActivity/MainApplication templates).
      const KOTLIN_HARD_KEYWORDS = new Set([
        'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for',
        'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package',
        'return', 'super', 'this', 'throw', 'true', 'try', 'typealias',
        'typeof', 'val', 'var', 'when', 'while',
      ]);
      const escapeKotlinPackage = (pkg) =>
        pkg
          .split('.')
          .map((seg) => (KOTLIN_HARD_KEYWORDS.has(seg) ? '`' + seg + '`' : seg))
          .join('.');

      if (fs.existsSync(serviceSource)) {
        let sourceContent = fs.readFileSync(serviceSource, 'utf8');

        // Ensure the package declaration matches the app's package name
        sourceContent = sourceContent.replace(
          /^package\s+\S+/m,
          `package ${escapeKotlinPackage(packageName)}`
        );

        fs.writeFileSync(serviceTarget, sourceContent, 'utf8');
        console.log(`[withNotificationListener] Copied service to ${serviceTarget}`);
      } else {
        console.warn(
          `[withNotificationListener] Service source not found at ${serviceSource}`
        );
      }

      return config;
    },
  ]);

  return config;
};
