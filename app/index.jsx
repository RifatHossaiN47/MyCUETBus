import { useRouter } from "expo-router";
import {
  Alert,
  ImageBackground,
  Linking,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.config";
import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const APP_VERSION = "3.0.0"; // Make this a constant for easier maintenance

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    checkForUpdates();

    // Check authentication state on app load
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");

      if (user && user.emailVerified) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
      setHasCheckedAuth(true);
    });

    return () => unsubscribe();
  }, []);

  // Enhanced version checking with better error handling
  const checkForUpdates = async () => {
    setUpdateChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("https://mycuetbus.web.app/version.json", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();
      const { version, updateUrl, releaseNotes } = data;

      if (!version || !updateUrl) {
        throw new Error("Invalid version data");
      }

      // Better version comparison
      if (compareVersions(version, APP_VERSION) > 0) {
        setUpdateAvailable(true);
        showUpdateAlert(version, updateUrl, releaseNotes);
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);

      // Only show error alert for non-timeout/network errors in development
      if (__DEV__ && error.name !== "AbortError") {
        Alert.alert(
          "Update Check Failed",
          "Could not check for app updates. Please check your internet connection.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setUpdateChecking(false);
    }
  };

  // Better version comparison function
  const compareVersions = (version1, version2) => {
    const v1parts = version1.split(".").map(Number);
    const v2parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    return 0;
  };

  // Enhanced update alert
  const showUpdateAlert = (newVersion, updateUrl, releaseNotes) => {
    Alert.alert(
      "🚀 Update Available",
      `Version ${newVersion} is now available!\n\n${
        releaseNotes || "Bug fixes and improvements."
      }`,
      [
        {
          text: "Later",
          style: "cancel",
          onPress: () => setUpdateAvailable(false),
        },
        {
          text: "Update Now",
          style: "default",
          onPress: () => {
            Linking.openURL(updateUrl).catch(() => {
              Alert.alert(
                "Error",
                "Could not open update link. Please try downloading from the website manually."
              );
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const goingchecker = () => {
    if (isAuthenticated) {
      router.replace("/tabs/homes");
    } else {
      router.replace("/signIN");
    }
  };

  // Auto-redirect with better timing
  useEffect(() => {
    if (hasCheckedAuth && !isLoading && isAuthenticated && !updateAvailable) {
      const timer = setTimeout(() => {
        router.replace("/tabs/homes");
      }, 2000); // Increased to 2 seconds for better UX

      return () => clearTimeout(timer);
    }
  }, [hasCheckedAuth, isLoading, isAuthenticated, updateAvailable, router]);

  if (isLoading) {
    return (
      <ImageBackground
        source={require("../assets/images/projectimages/Splash Screen.png")}
        className="flex-1 w-full h-full"
        resizeMode="stretch"
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white text-lg font-semibold mt-4">
            {updateChecking ? "Checking for updates..." : "Loading..."}
          </Text>
          {updateChecking && (
            <Text className="text-white/70 text-sm mt-2">
              Please wait while we check for the latest version
            </Text>
          )}
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/projectimages/Splash Screen.png")}
      className="flex-1 w-full h-full"
      resizeMode="stretch"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Update indicator */}
      {updateAvailable && (
        <View className="absolute top-12 left-4 right-4 z-10">
          <View className="bg-orange-500 p-3 rounded-lg flex-row items-center">
            <MaterialIcons name="system-update" size={20} color="white" />
            <Text className="text-white font-medium ml-2 flex-1">
              Update available! Tap to download.
            </Text>
            <TouchableOpacity onPress={() => checkForUpdates()}>
              <MaterialIcons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="flex-1 justify-end items-center pb-8">
        <TouchableOpacity
          className="bg-indigo-600 py-4 px-8 rounded-xl w-4/5 items-center shadow-lg"
          onPress={goingchecker}
          activeOpacity={0.8}
          style={{
            elevation: 8,
            shadowColor: "#4338ca",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Text className="text-white font-bold text-xl">
            {isAuthenticated ? "Continue to App" : "Let's Get Started"}
          </Text>
          {isAuthenticated && (
            <Text className="text-indigo-100 text-sm mt-1">Welcome back!</Text>
          )}
        </TouchableOpacity>

        <View className="mt-4 items-center">
          <Text className="text-lg text-green-800 font-semibold">
            Version {APP_VERSION}
          </Text>
          {updateChecking && (
            <View className="flex-row items-center mt-2">
              <ActivityIndicator size="small" color="#059669" />
              <Text className="text-green-700 ml-2 text-sm">
                Checking updates...
              </Text>
            </View>
          )}
        </View>
      </View>
    </ImageBackground>
  );
}
