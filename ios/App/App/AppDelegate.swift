import UIKit
import Capacitor
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    
    var window: UIWindow?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Setup push notifications
        setupPushNotifications(application)
        
        // Configure app appearance
        configureAppearance()
        
        return true
    }
    
    // MARK: - Push Notifications Setup
    private func setupPushNotifications(_ application: UIApplication) {
        // Set notification center delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Request user notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                    print("✅ Push notifications authorized")
                } else if let error = error {
                    print("❌ Push notification error: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // MARK: - App Appearance Configuration
    private func configureAppearance() {
        // Set app-wide appearance
        if #available(iOS 15.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(named: "PrimaryBackground") ?? .systemBackground
            UINavigationBar.appearance().standardAppearance = appearance
            UINavigationBar.appearance().scrollEdgeAppearance = appearance
        }
        
        // Configure tab bar appearance
        if #available(iOS 15.0, *) {
            let tabBarAppearance = UITabBarAppearance()
            tabBarAppearance.configureWithOpaqueBackground()
            UITabBar.appearance().standardAppearance = tabBarAppearance
            UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
        }
    }
    
    // MARK: - Remote Notifications
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("✅ Device token: \(token)")
        
        // Send device token to backend
        NotificationCenter.default.post(name: NSNotification.Name("deviceTokenUpdated"), object: token)
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
    }
    
    // MARK: - User Notification Center Delegate
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        // Handle foreground notifications
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
        
        // Post notification to JavaScript layer
        NotificationCenter.default.post(name: NSNotification.Name("notificationReceived"), object: userInfo)
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle notification tap
        NotificationCenter.default.post(name: NSNotification.Name("notificationTapped"), object: userInfo)
        
        completionHandler()
    }
    
    // MARK: - Background Tasks
    func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // Handle background fetch
        NotificationCenter.default.post(name: NSNotification.Name("backgroundFetchTriggered"), object: nil)
        completionHandler(.newData)
    }
    
    // MARK: - URL Handling for Deep Links
    func application(_ app: UIApplication,
                    open url: URL,
                    options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle deep links
        if url.scheme == "newomen" {
            NotificationCenter.default.post(name: NSNotification.Name("deepLinkReceived"), object: url)
            return true
        }
        
        return false
    }
    
    // MARK: - Scene Delegate
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
