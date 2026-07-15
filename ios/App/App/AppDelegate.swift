import UIKit
import Capacitor
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Play audio in the background and drive the lock screen / Control Center.
        // The `.playback` category keeps the WKWebView's <audio> alive when the
        // app is backgrounded and routes W3C MediaSession metadata + remote
        // commands to the Now Playing info center.
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set audio session category: \(error)")
        }
        // iOS pauses the WKWebView's <audio> on an interruption (Siri, a phone
        // call) but never auto-resumes it — the user would have to tap play
        // again. Observe the interruption notification and, when it ENDS with the
        // system's "should resume" hint, tell the web player to resume via a JS
        // event (see useAudioInterruptionResume).
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
        return true
    }

    // On interruption END, reactivate the audio session and — only when iOS
    // signals `.shouldResume` — dispatch a JS event so the web player resumes the
    // track it was on. We resume via the web layer (not the raw element) so the
    // player's state stays consistent. `.began` needs no handling: iOS has
    // already paused the element and MediaSession reflects it.
    @objc func handleAudioInterruption(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            AVAudioSession.InterruptionType(rawValue: raw) == .ended
        else {
            nativeLog("interruption", "began")
            return
        }
        nativeLog("interruption", "ended")
        let shouldResume: Bool
        if let optsRaw = info[AVAudioSessionInterruptionOptionKey] as? UInt {
            shouldResume = AVAudioSession.InterruptionOptions(rawValue: optsRaw).contains(.shouldResume)
        } else {
            shouldResume = false
        }
        guard shouldResume else { return }
        try? AVAudioSession.sharedInstance().setActive(true)
        nudgeWebPlayerToResume()
    }

    // Tell the web player to re-assert playback (it only acts if it still intends
    // to be playing — see useAudioInterruptionResume). Used both on interruption
    // end and on foreground: Siri's interruption-ended notification is unreliable
    // in a WKWebView, so returning to the app is a safety net that re-establishes
    // audio output iOS silently dropped.
    func nudgeWebPlayerToResume() {
        DispatchQueue.main.async {
            let vc = self.window?.rootViewController as? CAPBridgeViewController
            vc?.webView?.evaluateJavaScript(
                "window.dispatchEvent(new Event('cadence:audiointerruptionended'))",
                completionHandler: nil
            )
        }
    }

    // Record a native-side event into the web diagnostics log (opt-in on the JS
    // side; a no-op when the global isn't installed). Keeps native audio-session
    // events in the same timeline as the JS player events for diagnosis.
    func nativeLog(_ category: String, _ message: String) {
        DispatchQueue.main.async {
            let vc = self.window?.rootViewController as? CAPBridgeViewController
            let c = category.replacingOccurrences(of: "'", with: "")
            let m = message.replacingOccurrences(of: "'", with: "")
            vc?.webView?.evaluateJavaScript(
                "window.__cadenceNativeLog && window.__cadenceNativeLog('\(c)','\(m)')",
                completionHandler: nil
            )
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Mark that we actually left the foreground, so the next didBecomeActive
        // nudges resume only after a real background trip (see the guard there).
        wasBackgrounded = true
        // Log it so a lock-screen/background test is legible end-to-end in the
        // diagnostics: 'background entered' → progress heartbeats should KEEP
        // ticking while backgrounded (audio survives) → 'resume after background'
        // on return. If the heartbeats stop right after this, background audio is
        // still being suspended and we know exactly where to look.
        nativeLog("background", "entered")
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    // True only between entering the background and the next foreground, so the
    // foreground handler nudges resume ONLY after an actual background trip — not
    // on every didBecomeActive (which also fires for in-app returns, e.g. after a
    // Control Center peek). Nudging on every activation, plus setActive(true) then,
    // itself paused playback → the "click play twice" behaviour.
    private var wasBackgrounded = false

    func applicationDidBecomeActiveResume() {
        guard wasBackgrounded else { return }
        wasBackgrounded = false
        // Do NOT setActive(true) here — device logs showed it fires an
        // AVAudioSession interruption that pauses the WKWebView's <audio>. Just ask
        // the web player to resume; it no-ops unless it still intends to play.
        nativeLog("foreground", "resume after background")
        nudgeWebPlayerToResume()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        applicationDidBecomeActiveResume()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
