package com.dhwanipay.paymentlistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo native module that bridges Android NotificationListenerService broadcasts
 * to the React Native / JS layer via EventEmitter.
 */
class PaymentListenerModule : Module() {
    private var receiver: BroadcastReceiver? = null
    private var registeredContext: Context? = null

    override fun definition() = ModuleDefinition {
        Name("PaymentListener")

        Events("onPaymentReceived")

        AsyncFunction("isPermissionGranted") {
            try {
                val ctx = appContext.reactContext?.applicationContext ?: appContext.reactContext ?: return@AsyncFunction false
                val enabledListeners = Settings.Secure.getString(
                    ctx.contentResolver,
                    "enabled_notification_listeners"
                ) ?: ""
                enabledListeners.contains(ctx.packageName)
            } catch (t: Throwable) {
                Log.w("PaymentListenerModule", "Error checking permission: ${t.message}")
                false
            }
        }

        AsyncFunction("openPermissionSettings") {
            try {
                val ctx = appContext.currentActivity ?: appContext.reactContext ?: return@AsyncFunction false
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                ctx.startActivity(intent)
                true
            } catch (t: Throwable) {
                Log.w("PaymentListenerModule", "Error opening settings: ${t.message}")
                false
            }
        }

        OnCreate {
            try {
                val ctx = appContext.reactContext?.applicationContext ?: appContext.reactContext ?: return@OnCreate

                val br = object : BroadcastReceiver() {
                    override fun onReceive(context: Context?, intent: Intent?) {
                        try {
                            if (intent?.action != "in.dhwanipay.app.PAYMENT_RECEIVED") return

                            val amount = intent.getDoubleExtra("amount", 0.0)
                            val source = intent.getStringExtra("source") ?: "UPI"
                            val payer = intent.getStringExtra("payer") ?: ""
                            val utr = intent.getStringExtra("utr") ?: ""
                            val announcedNatively = intent.getBooleanExtra("announcedNatively", false)

                            if (amount <= 0) return

                            sendEvent(
                                "onPaymentReceived", mapOf(
                                    "amount" to amount,
                                    "source" to source,
                                    "payer" to payer,
                                    "utr" to utr,
                                    "announcedNatively" to announcedNatively
                                )
                            )
                        } catch (t: Throwable) {
                            Log.w("PaymentListenerModule", "Error handling broadcast: ${t.message}")
                        }
                    }
                }

                val filter = IntentFilter("in.dhwanipay.app.PAYMENT_RECEIVED")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    ctx.registerReceiver(br, filter, Context.RECEIVER_NOT_EXPORTED)
                } else {
                    @Suppress("UnspecifiedRegisterReceiverFlag")
                    ctx.registerReceiver(br, filter)
                }
                receiver = br
                registeredContext = ctx
            } catch (t: Throwable) {
                Log.w("PaymentListenerModule", "Failed to register receiver in OnCreate: ${t.message}")
            }
        }

        OnDestroy {
            try {
                val r = receiver
                val ctx = registeredContext ?: appContext.reactContext?.applicationContext ?: appContext.reactContext
                if (r != null && ctx != null) {
                    ctx.unregisterReceiver(r)
                }
            } catch (_: Throwable) {
                // Already unregistered or context destroyed
            } finally {
                receiver = null
                registeredContext = null
            }
        }
    }
}
