import Capacitor
import Foundation

/// Stores the signed-in Jellyfin session (token + user) in the iOS Keychain
/// (KeychainStore) instead of Capacitor Preferences (plain UserDefaults, readable
/// from an unencrypted backup). JS: `SecureSession.get/set/remove`
/// (src/lib/sessionPersistence.ts), which also migrates an existing Preferences
/// session here once. Rejections carry a code: "locked" (transient, JS retries)
/// or "unavailable" (JS falls back to Preferences so launch never hangs).
@objc(SecureSessionPlugin)
public class SecureSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SecureSessionPlugin"
    public let jsName = "SecureSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
    ]

    private let store = KeychainStore(service: "com.johncorser.cadence.session", account: "session")

    private func reject(_ call: CAPPluginCall, _ action: String, _ failure: KeychainStore.Failure) {
        switch failure {
        case .locked: call.reject("keychain \(action) failed: device locked", "locked")
        case .unavailable(let status): call.reject("keychain \(action) failed (\(status))", "unavailable")
        }
    }

    @objc func get(_ call: CAPPluginCall) {
        switch store.read() {
        case .success(let value): call.resolve(["value": value ?? NSNull()])
        case .failure(let f): reject(call, "read", f)
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let value = call.getString("value") else { return call.reject("value is required") }
        switch store.write(value) {
        case .success: call.resolve()
        case .failure(let f): reject(call, "write", f)
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        switch store.delete() {
        case .success: call.resolve()
        case .failure(let f): reject(call, "delete", f)
        }
    }
}
