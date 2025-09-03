import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  AppState,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { ref, set, remove } from "firebase/database";
import { auth, database } from "../../firebase.config";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";
import RNPickerSelect from "react-native-picker-select";

/** Firebase RTDB does not allow: . # $ / [ ] */
const sanitizeKey = (name) => (name ?? "").replace(/[.#$/\[\]]/g, "_");

const shareLocation = () => {
  const [busName, setBusName] = useState(null);
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5000);

  const locationInterval = useRef(null);
  const isUpdatingRef = useRef(false);
  const sharingActive = useRef(false);
  const isStoppingRef = useRef(false);
  const previousBusNameRef = useRef("");
  const intervalRef = useRef(5000);

  const router = useRouter();

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

  // Stop sharing if app goes background/inactive
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        if (sharingActive.current) {
          console.log("App going to background, stopping location sharing");
          stopSharing();
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove?.();

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

  // Remove old bus key if user changes bus while sharing
  useEffect(() => {
    if (
      isSharing &&
      busName &&
      previousBusNameRef.current &&
      busName !== previousBusNameRef.current
    ) {
      const oldKey = sanitizeKey(previousBusNameRef.current);
      remove(ref(database, `buses/${oldKey}`)).catch((error) =>
        console.error("Error removing old bus location:", error)
      );
    }
    previousBusNameRef.current = busName;
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
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 5000,
      });

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
    console.log("Stopping location sharing...");

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

    setIsSharing(false);
    previousBusNameRef.current = null;

    setTimeout(() => {
      isStoppingRef.current = false;
    }, 1000);
  };

  const shareLocations = async () => {
    if (!busName) {
      Alert.alert("Error", "Please select a bus name.");
      return;
    }

    try {
      isStoppingRef.current = false;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to share your location."
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

      console.log("Starting location sharing...");
      setIsSharing(true);
      sharingActive.current = true;
      previousBusNameRef.current = busName;

      await updateLocation();
      locationInterval.current = setInterval(
        () => updateLocation(),
        intervalRef.current
      );
    } catch (error) {
      console.error("Error starting location sharing:", error);
      Alert.alert(
        "Error",
        "Failed to start location sharing. Please try again."
      );
      setIsSharing(false);
      sharingActive.current = false;
      isStoppingRef.current = false;
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-xl font-bold mb-2">Select Bus Name:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <RNPickerSelect
          onValueChange={(value) => setBusName(value)}
          items={vehicleData}
          placeholder={{
            label: "Select a bus...",
            value: null,
            color: "#9EA0A4",
          }}
          value={busName}
          style={{
            inputIOS: {
              fontSize: 16,
              padding: 10,
              borderWidth: 1,
              borderColor: "gray",
              borderRadius: 5,
              backgroundColor: "#f0f0f0",
              color: "black",
              width: 300,
            },
            inputAndroid: {
              fontSize: 16,
              padding: 10,
              borderWidth: 1,
              borderColor: "gray",
              borderRadius: 5,
              backgroundColor: "#f0f0f0",
              color: "black",
              width: 300,
            },
          }}
        />
      )}

      {!isSharing ? (
        <TouchableOpacity
          className="bg-blue-500 w-full p-3 items-center rounded-md mt-4"
          onPress={shareLocations}
        >
          <Text className="text-white text-lg">Share Location</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="bg-red-500 w-full p-3 items-center rounded-md mt-4"
          onPress={stopSharing}
        >
          <Text className="text-white text-lg">Stop Sharing</Text>
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
