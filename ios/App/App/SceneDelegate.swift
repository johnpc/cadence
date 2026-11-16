import UIKit
import Capacitor

/// The UIScene life cycle — REQUIRED for apps built with the iOS 27 SDK (without
/// it UIKit refuses to launch the app: "UIScene life cycle is required for apps
/// built with this SDK"). The scene owns the window now; this delegate hands it
/// to AppDelegate (so `appDelegate.window` keeps working for the audio-session
/// and JS-bridge code there) and forwards the foreground/background and URL
/// events that scenes receive INSTEAD of the app delegate.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    private var app: AppDelegate? { UIApplication.shared.delegate as? AppDelegate }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // The window is created from the Main storyboard (UISceneStoryboardFile);
        // share it with the app delegate, which bridges into the web view.
        app?.window = window
        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
        if let activity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        }
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        app?.didEnterBackground()
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        app?.applicationDidBecomeActiveResume()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
