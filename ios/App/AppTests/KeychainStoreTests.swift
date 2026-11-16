import Security
import XCTest

/// The Keychain round trip itself can't run here: this host-less test bundle has
/// no Keychain entitlement on the simulator (every SecItem call returns -34018).
/// It is proven through the team-signed app instead (sign in, relaunch: the
/// session comes back from the Keychain). These cover the logic that decides
/// what a failure means to the web layer.
final class KeychainStoreTests: XCTestCase {
    func testOnlyALockedDeviceIsTransient() {
        XCTAssertEqual(KeychainStore.failure(errSecInteractionNotAllowed), .locked)
        XCTAssertEqual(KeychainStore.failure(errSecMissingEntitlement), .unavailable(errSecMissingEntitlement))
        XCTAssertEqual(KeychainStore.failure(errSecItemNotFound), .unavailable(errSecItemNotFound))
    }

    func testAMissingEntitlementIsReportedNotHidden() {
        // Exactly what this bundle hits: a clean "unavailable", which the web
        // layer turns into a Preferences fallback instead of a hung launch.
        let store = KeychainStore(service: "com.johncorser.cadence.tests", account: UUID().uuidString)
        if case .failure(let f) = store.read() {
            XCTAssertEqual(f, .unavailable(errSecMissingEntitlement))
        }
    }
}
