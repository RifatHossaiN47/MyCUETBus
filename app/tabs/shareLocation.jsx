import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  AppState,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { ref, set, remove, get } from "firebase/database";
import { auth, database } from "../../firebase.config";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKGROUND_TASK_NAME } from "../tasks/backgroundLocationTask";

/** Firebase RTDB does not allow: . # $ / [ ] */
const sanitizeKey = (name) => (name ?? "").replace(/[.#$/\[\]]/g, "_");

const shareLocation = () => {
  const [busName, setBusName] = useState(null);
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5000);
  const [isProcessing, setIsProcessing] = useState(false);

  const locationInterval = useRef(null);
  const isUpdatingRef = useRef(false);
  const sharingActive = useRef(false);
  const isStoppingRef = useRef(false);
  const previousBusNameRef = useRef("");
  const intervalRef = useRef(5000);

  const router = useRouter();

  // Check if background task is registered on mount
  useEffect(() => {
    const checkTaskRegistration = async () => {
      const isRegistered = await TaskManager.isTaskDefined(
        BACKGROUND_TASK_NAME
      );
      console.log(`📋 Background task registration check: ${isRegistered}`);
      if (!isRegistered) {
        console.error("❌ Background task not registered!");
      }
    };
    checkTaskRegistration();
  }, []);

  // Fetch bus names from Firestore
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "busservice"));
        const seen = new Set();
        const data = [];

        querySnapshot.forEach((doc) => {
          const v = doc.data()?.vehicleType;
          if (v && !seen.has(v)) {
            seen.add(v);
            data.push({ label: v, value: v });
          }
        });

        data.push({
          label: "NEED HELP!!",
          value: `NEED HELP!! ${auth.currentUser?.displayName || "Student"}`,
        });

        setVehicleData(data);
      } catch (error) {
        console.error("Error fetching vehicle data: ", error);
        Alert.alert("Error", "Failed to load vehicle data");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, []);

  // Do NOT stop in background; clean up only on unmount
  useEffect(() => {
    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }

      const key = sanitizeKey(previousBusNameRef.current || busName || "");
      if (key) {
        remove(ref(database, `buses/${key}`)).catch(() => {});
      }

      sharingActive.current = false;
      isStoppingRef.current = true;
    };
  }, [busName]);

  // Prevent changing bus while sharing
  useEffect(() => {
    if (
      isSharing &&
      busName &&
      previousBusNameRef.current &&
      busName !== previousBusNameRef.current
    ) {
      Alert.alert(
        "Cannot Change Bus",
        "Please stop sharing before selecting a different bus.",
        [
          {
            text: "OK",
            onPress: () => {
              // Revert to previous bus
              setBusName(previousBusNameRef.current);
            },
          },
        ]
      );
    }
  }, [busName, isSharing]);

  // Dynamic interval adjustment based on movement speed
  const adjustUpdateInterval = (speed) => {
    let newInterval;
    if (speed > 10) {
      // Moving fast (m/s)
      newInterval = 3000; // 3 seconds
    } else if (speed > 2) {
      // Moving slowly
      newInterval = 5000; // 5 seconds
    } else {
      // Stationary or very slow
      newInterval = 10000; // 10 seconds
    }

    if (newInterval !== intervalRef.current) {
      intervalRef.current = newInterval;
      setUpdateInterval(newInterval);
      // Restart interval with new timing
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = setInterval(
          () => updateLocation(),
          newInterval
        );
      }
    }
  };

  const updateLocation = async (retryCount = 0) => {
    if (!sharingActive.current || isStoppingRef.current || !busName) return;
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    try {
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 5000,
      };
      const location = await Location.getCurrentPositionAsync(locationOptions);

      if (!sharingActive.current || isStoppingRef.current || !busName) return;

      const key = sanitizeKey(busName);
      const busRef = ref(database, `buses/${key}`);

      await set(busRef, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
        accuracy: location.coords.accuracy,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        deviceType: "student_share",
        sharedBy: auth.currentUser?.displayName || "Student",
      });

      // Adjust update interval based on speed
      adjustUpdateInterval(location.coords.speed || 0);

      // Reset retry count on success
      retryCount = 0;
    } catch (error) {
      console.error("Location update error:", error);

      // Add retry logic for network failures
      if (
        (error.code === "DATABASE_ERROR" ||
          error.message?.includes("network")) &&
        retryCount < 3
      ) {
        console.log(`Retrying location update (${retryCount + 1}/3)...`);
        setTimeout(() => {
          updateLocation(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      if (error?.code === "E_LOCATION_TIMEOUT") {
        console.log("Location timeout, will retry on next interval");
      } else if (error?.code === "E_LOCATION_UNAVAILABLE") {
        Alert.alert(
          "Location Error",
          "GPS is not available. Please check your location settings."
        );
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const stopSharing = async () => {
    if (isProcessing) {
      console.log("⚠️ Stop operation already in progress");
      return;
    }

    if (!isSharing) {
      console.log("⚠️ Not currently sharing");
      return;
    }

    setIsProcessing(true);
    console.log("🛑 Stopping location sharing...");

    isStoppingRef.current = true;
    sharingActive.current = false;

    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
      console.log("-->Interval cleared");
    }

    // Reset interval to default
    intervalRef.current = 5000;
    setUpdateInterval(5000);

    // give any in-flight set() a moment to finish/cancel
    await new Promise((resolve) => setTimeout(resolve, 100));

    const busNameToRemove = previousBusNameRef.current || busName;
    const key = sanitizeKey(busNameToRemove || "");
    if (key) {
      try {
        await remove(ref(database, `buses/${key}`));
        console.log("-->Bus location removed from Firebase");
      } catch (error) {
        console.error("Error removing bus location: ", error);
      }
    }

    // Stop background updates task if started
    try {
      const started = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_TASK_NAME
      );
      if (started) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME);
      }
    } catch {}

    await AsyncStorage.removeItem("BUS_NAME");

    setIsSharing(false);
    previousBusNameRef.current = null;

    setTimeout(() => {
      isStoppingRef.current = false;
      setIsProcessing(false);
    }, 1000);
  };

  // Test Firebase connection: read from 'buses' (allowed by your rules) with timeout
  // NOTE: This is a soft check; on failure we log a warning but do not block sharing
  const testFirebaseConnection = async () => {
    console.log("🔗 Testing Firebase connection...");
    try {
      const busesRef = ref(database, "buses");
      await Promise.race([
        get(busesRef),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 5000)
        ),
      ]);
      console.log("✅ Firebase connection check passed");
      return true;
    } catch (error) {
      console.warn(
        "⚠️ Firebase connection check non-blocking failure:",
        error?.message || error
      );
      // Do not block sharing due to transient or environment-specific read errors
      return true;
    }
  };

  const shareLocations = async () => {
    if (isProcessing) {
      console.log("⚠️ Share operation already in progress");
      return;
    }

    if (!busName) {
      Alert.alert("Error", "Please select a bus name.");
      return;
    }

    if (!busName.trim()) {
      Alert.alert("Error", "Bus name cannot be empty.");
      return;
    }

    if (isSharing && previousBusNameRef.current === busName) {
      Alert.alert(
        "Already Sharing",
        `You are already sharing location for ${busName}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      isStoppingRef.current = false;

      // Check if user is authenticated
      if (!auth.currentUser) {
        console.error("❌ No authenticated user");
        Alert.alert(
          "Authentication Error",
          "Please sign in to share location."
        );
        return;
      }
      console.log("✅ User authenticated:", auth.currentUser.email);

      // Test Firebase connection first
      const fbConnected = await testFirebaseConnection();
      if (!fbConnected) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to Firebase. Check your internet connection."
        );
        return;
      }

      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to share your location."
        );
        return;
      }

      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== "granted") {
        Alert.alert(
          "Background Permission Needed",
          "Please grant 'Allow all the time' in App settings for continuous sharing.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                try {
                  // open app settings
                  // eslint-disable-next-line no-undef
                  Linking.openSettings?.();
                } catch {}
              },
            },
          ]
        );
        return;
      }

      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings."
        );
        return;
      }

      console.log("🚀 Starting background location sharing...");

      // Stop any existing task first (cleanup from previous session)
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_TASK_NAME
      );
      if (hasStarted) {
        console.log("🛑 Stopping existing background task...");
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME);
        // Wait for task to fully stop
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Clear old bus name and set new one
      await AsyncStorage.removeItem("BUS_NAME");
      await AsyncStorage.setItem("BUS_NAME", busName);

      // Verify the value was written
      const verifyBusName = await AsyncStorage.getItem("BUS_NAME");
      console.log(`📦 Bus name stored: ${busName}, verified: ${verifyBusName}`);

      if (verifyBusName !== busName) {
        console.error("❌ AsyncStorage verification failed!");
        Alert.alert("Error", "Failed to save bus name. Please try again.");
        return;
      }

      // Give AsyncStorage time to persist (important for background task)
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check if task is defined
      const isTaskDefined = await TaskManager.isTaskDefined(
        BACKGROUND_TASK_NAME
      );
      console.log(`Task ${BACKGROUND_TASK_NAME} defined:`, isTaskDefined);

      if (!isTaskDefined) {
        Alert.alert(
          "Error",
          "Background task not registered. Please restart the app."
        );
        return;
      }

      // Get current location and send immediately to Firebase
      try {
        console.log("📍 Getting initial location...");
        const initialLocationOptions = {
          accuracy: Location.Accuracy.High,
          timeout: 15000,
          maximumAge: 10000,
        };
        const currentLocation = await Location.getCurrentPositionAsync(
          initialLocationOptions
        );

        if (!currentLocation?.coords) {
          throw new Error("No coordinates received");
        }

        const key = sanitizeKey(busName);
        console.log(`🔑 Firebase key: buses/${key}`);

        const locationData = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || 0,
          speed: currentLocation.coords.speed || 0,
          heading: currentLocation.coords.heading || 0,
          timestamp: Date.now(),
          deviceType: "student_share",
          sharedBy:
            auth.currentUser?.displayName ||
            auth.currentUser?.email ||
            "Student",
        };

        // Validate coordinates
        if (
          Math.abs(locationData.latitude) > 90 ||
          Math.abs(locationData.longitude) > 180
        ) {
          throw new Error("Invalid coordinates received");
        }

        await set(ref(database, `buses/${key}`), locationData);
        console.log(`✅ Initial location sent for ${busName}`);
      } catch (locError) {
        console.error("❌ Failed to send initial location:", locError);

        if (locError?.code === "E_LOCATION_TIMEOUT") {
          Alert.alert(
            "Location Timeout",
            "Could not get your location. Make sure GPS is enabled and you're not indoors.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Retry", onPress: () => shareLocations() },
            ]
          );
          setIsProcessing(false);
          return;
        } else if (locError?.code === "E_LOCATION_UNAVAILABLE") {
          Alert.alert(
            "Location Unavailable",
            "GPS is not available on this device."
          );
          setIsProcessing(false);
          return;
        }

        console.warn(
          "⚠️ Initial location failed, but background updates will continue."
        );
      }

      // Start background updates with Android foreground service
      console.log("🔄 Starting background location updates...");

      // Create location options object outside to avoid Hermes casting issues
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "Sharing bus location",
          notificationBody: `Sharing for ${busName}`,
          notificationColor: "#2563EB",
        },
      };

      await Location.startLocationUpdatesAsync(
        BACKGROUND_TASK_NAME,
        locationOptions
      );

      setIsSharing(true);
      sharingActive.current = true;
      previousBusNameRef.current = busName;

      console.log("✅ Background location sharing started successfully");
      Alert.alert("Success", `Started sharing location for ${busName}`);
    } catch (error) {
      console.error("❌ Error starting location sharing:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);

      // Cleanup on error
      try {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_TASK_NAME
        );
        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME);
        }
        await AsyncStorage.removeItem("BUS_NAME");
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }

      let errorMessage = "Failed to start location sharing. Please try again.";

      if (error?.message?.includes("auth")) {
        errorMessage = "Authentication error. Please sign in again.";
      } else if (error?.message?.includes("network")) {
        errorMessage = "Network error. Check your internet connection.";
      } else if (error?.message?.includes("permission")) {
        errorMessage = "Location permission denied. Check app settings.";
      } else if (error?.message) {
        // Show actual error in dev mode
        errorMessage = `Error: ${error.message}`;
      }

      Alert.alert("Error", errorMessage);

      setIsSharing(false);
      sharingActive.current = false;
      isStoppingRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-xl font-bold mb-2">Select Bus Name:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <RNPickerSelect
          onValueChange={(value) => {
            if (isSharing) {
              Alert.alert(
                "Cannot Change Bus",
                "Please stop sharing before selecting a different bus."
              );
            } else {
              setBusName(value);
            }
          }}
          items={vehicleData}
          placeholder={{
            label: "Select a bus...",
            value: null,
            color: "#9EA0A4",
          }}
          value={busName}
          disabled={isSharing}
          style={{
            inputIOS: {
              fontSize: 16,
              padding: 10,
              borderWidth: 1,
              borderColor: isSharing ? "#d3d3d3" : "gray",
              borderRadius: 5,
              backgroundColor: isSharing ? "#e8e8e8" : "#f0f0f0",
              color: isSharing ? "#888" : "black",
              width: 300,
            },
            inputAndroid: {
              fontSize: 16,
              padding: 10,
              borderWidth: 1,
              borderColor: isSharing ? "#d3d3d3" : "gray",
              borderRadius: 5,
              backgroundColor: isSharing ? "#e8e8e8" : "#f0f0f0",
              color: "black",
              width: 300,
            },
          }}
        />
      )}

      {!isSharing ? (
        <TouchableOpacity
          className={`w-full p-3 items-center rounded-md mt-4 ${
            isProcessing ? "bg-gray-400" : "bg-blue-500"
          }`}
          onPress={shareLocations}
          disabled={isProcessing || loading}
        >
          <Text className="text-white text-lg">
            {isProcessing ? "Starting..." : "Share Location"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className={`w-full p-3 items-center rounded-md mt-4 ${
            isProcessing ? "bg-gray-400" : "bg-red-500"
          }`}
          onPress={stopSharing}
          disabled={isProcessing}
        >
          <Text className="text-white text-lg">
            {isProcessing ? "Stopping..." : "Stop Sharing"}
          </Text>
        </TouchableOpacity>
      )}

      {isSharing && (
        <View className="mt-4 p-3 bg-green-100 rounded-md">
          <Text className="text-green-800 text-center">
            📍 Sharing location for: {busName}
          </Text>
          <Text className="text-green-600 text-center text-sm mt-1">
            Updates every {updateInterval / 1000} seconds (auto-adjusts based on
            movement)
          </Text>
        </View>
      )}
    </View>
  );
};

export default shareLocation;
