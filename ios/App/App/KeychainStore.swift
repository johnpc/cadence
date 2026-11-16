import Foundation
import Security

/// One string in the iOS Keychain (a generic-password item). Pure Security
/// framework — no Capacitor — so AppTests runs it directly; SecureSessionPlugin
/// is the thin JS-facing wrapper.
///
/// Accessible after first unlock, this device only: background audio and a
/// Bluetooth-launched resume can read it while the phone is locked, and it never
/// syncs to iCloud or restores onto another device.
struct KeychainStore {
    let service: String
    let account: String

    enum Failure: Error, Equatable {
        /// The device hasn't been unlocked since boot — transient; retry later.
        case locked
        /// Anything else (e.g. a build without the Keychain entitlement, -34018).
        case unavailable(OSStatus)
    }

    private var base: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    static func failure(_ status: OSStatus) -> Failure {
        status == errSecInteractionNotAllowed ? .locked : .unavailable(status)
    }

    /// The stored string, or nil when nothing is stored.
    func read() -> Result<String?, Failure> {
        var query = base
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return .success(nil) }
        guard status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) else {
            return .failure(Self.failure(status))
        }
        return .success(value)
    }

    func write(_ value: String) -> Result<Void, Failure> {
        SecItemDelete(base as CFDictionary)
        var item = base
        item[kSecValueData as String] = Data(value.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(item as CFDictionary, nil)
        return status == errSecSuccess ? .success(()) : .failure(Self.failure(status))
    }

    func delete() -> Result<Void, Failure> {
        let status = SecItemDelete(base as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound ? .success(()) : .failure(Self.failure(status))
    }
}
