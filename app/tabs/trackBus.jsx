import React, { useState, useEffect, useRef } from "react";
import { View, Alert, Text, TouchableOpacity } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { ref, onValue, remove, get } from "firebase/database";
import { database } from "../../firebase.config";
import { FontAwesome } from "@expo/vector-icons";
import { MAPBOX_API } from "@env";

MapboxGL.setAccessToken(MAPBOX_API);

const isFiniteLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const trackBus = () => {
  const [buses, setBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showClustering, setShowClustering] = useState(false);
  const [cleanupStats, setCleanupStats] = useState({
    lastCleanup: null,
    deletedCount: 0,
  });

  const cameraRef = useRef(null);
  const firebaseListenerRef = useRef(null);
  const cleanupInProgress = useRef(false);
  const cleanupIntervalRef = useRef(null);
  const maxRetries = 3;

  const THREE_MIN = 3 * 60 * 1000;
  const CLEANUP_INTERVAL = 60000; // Check every minute for better cleanup

  // Simple clustering function for performance
  const clusterBuses = (buses, threshold = 0.01) => {
    const clusters = [];
    const processed = new Set();

    buses.forEach((bus, index) => {
      if (processed.has(index)) return;

      const cluster = {
        latitude: bus.latitude,
        longitude: bus.longitude,
        count: 1,
        buses: [bus],
        representativeBus: bus,
      };

      // Find nearby buses
      buses.forEach((otherBus, otherIndex) => {
        if (otherIndex !== index && !processed.has(otherIndex)) {
          const distance = Math.sqrt(
            Math.pow(bus.latitude - otherBus.latitude, 2) +
              Math.pow(bus.longitude - otherBus.longitude, 2)
          );

          if (distance < threshold) {
            cluster.buses.push(otherBus);
            cluster.count++;
            processed.add(otherIndex);
          }
        }
      });

      processed.add(index);
      clusters.push(cluster);
    });

    return clusters;
  };

  // IMPROVED: Regular cleanup that runs every minute
  const performRegularCleanup = async () => {
    if (cleanupInProgress.current) return;
    cleanupInProgress.current = true;

    try {
      console.log("🧹 Starting regular cleanup...");

      // Get current bus data
      const snapshot = await get(ref(database, "buses"));
      const busData = snapshot.val();

      if (!busData) {
        cleanupInProgress.current = false;
        return;
      }

      const currentTime = Date.now();
      const cutoff = currentTime - THREE_MIN;
      const deleteTasks = [];
      let deleteCount = 0;

      Object.keys(busData).forEach((busName) => {
        const bus = busData[busName];
        const lastUpdate = bus?.timestamp ?? 0;

        if (lastUpdate < cutoff) {
          console.log(
            `🗑️ Deleting expired bus: ${busName} (last update: ${new Date(
              lastUpdate
            ).toLocaleTimeString()})`
          );
          deleteTasks.push(
            remove(ref(database, `buses/${busName}`)).catch((err) => {
              console.error(`Failed to delete ${busName}:`, err);
              return null;
            })
          );
          deleteCount++;
        }
      });

      if (deleteTasks.length > 0) {
        await Promise.allSettled(deleteTasks);
        console.log(`✅ Cleanup completed: ${deleteCount} buses deleted`);

        // Update cleanup stats
        setCleanupStats({
          lastCleanup: new Date().toLocaleTimeString(),
          deletedCount: deleteCount,
        });
      } else {
        console.log("✅ Cleanup completed: No expired buses found");
      }
    } catch (error) {
      console.error("❌ Error during regular cleanup:", error);
    } finally {
      cleanupInProgress.current = false;
    }
  };

  // Legacy cleanup for backwards compatibility
  const cleanupOldBusLocations = async (busData) => {
    if (cleanupInProgress.current) return;
    cleanupInProgress.current = true;

    // Add small random delay to prevent exact simultaneous cleanup
    const randomDelay = Math.random() * 5000; // 0-5 seconds
    await new Promise((resolve) => setTimeout(resolve, randomDelay));

    const currentTime = Date.now();
    const cutoff = currentTime - THREE_MIN;

    if (busData) {
      const tasks = [];
      let count = 0;

      Object.keys(busData).forEach((busName) => {
        const bus = busData[busName];
        const lastUpdate = bus?.timestamp ?? 0;
        if (lastUpdate < cutoff) {
          console.log(
            `🧹 Removing old bus: ${busName} (last: ${new Date(
              lastUpdate
            ).toLocaleString()})`
          );

          tasks.push(
            remove(ref(database, `buses/${busName}`)).catch((err) => {
              console.error(`Failed to remove ${busName}:`, err);
              return null;
            })
          );
          count++;
        }
      });

      if (tasks.length > 0) {
        try {
          await Promise.allSettled(tasks);
          console.log(`✅ Legacy cleanup: ${count} buses removed`);
        } catch (err) {
          console.error("❌ Error in legacy cleanup:", err);
        }
      }
    }

    cleanupInProgress.current = false;
  };

  const filterRecentBuses = (busData) => {
    const currentTime = Date.now();
    const cutoff = currentTime - THREE_MIN;

    const list = busData
      ? Object.keys(busData)
          .map((key) => ({ name: key, ...busData[key] }))
          .filter((bus) => {
            const okTime = (bus?.timestamp ?? 0) >= cutoff;
            const okCoords = isFiniteLatLng(bus?.latitude, bus?.longitude);
            return okTime && okCoords;
          })
      : [];

    return list;
  };

  // Check if clustering is needed based on bus count
  useEffect(() => {
    setShowClustering(buses.length > 20);
  }, [buses.length]);

  // IMPROVED: Setup regular cleanup interval
  useEffect(() => {
    console.log("🕐 Starting regular cleanup system...");

    // Start cleanup interval that runs every minute
    cleanupIntervalRef.current = setInterval(() => {
      performRegularCleanup();
    }, CLEANUP_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
        console.log("🛑 Cleanup interval stopped");
      }
    };
  }, []);

  // Firebase listener with retry logic
  useEffect(() => {
    const setupFirebaseListener = () => {
      const busesRef = ref(database, "buses");

      const unsubscribe = onValue(
        busesRef,
        (snapshot) => {
          const data = snapshot.val() || null;
          const busList = filterRecentBuses(data);
          setBuses(busList);
          setConnectionStatus("connected");
          setRetryCount(0);
          setLastUpdated(new Date().toLocaleTimeString());
          console.log(`Updated bus data: ${busList.length} active buses`);

          // Legacy cleanup as backup (less frequent)
          const now = new Date();
          const shouldLegacyCleanup =
            now.getMinutes() % 10 === 0 && now.getSeconds() < 10;
          if (data && shouldLegacyCleanup) {
            cleanupOldBusLocations(data);
          }
        },
        (error) => {
          console.error("Firebase error:", error);
          setConnectionStatus("error");

          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 2000;
            console.log(
              `Retrying Firebase connection in ${delay}ms (${
                retryCount + 1
              }/${maxRetries})`
            );
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, delay);
          } else {
            Alert.alert(
              "Connection Error",
              "Failed to fetch bus locations after multiple attempts. Please check your internet connection."
            );
          }
        }
      );

      firebaseListenerRef.current = unsubscribe;
    };

    setupFirebaseListener();

    return () => {
      if (firebaseListenerRef.current) {
        firebaseListenerRef.current();
        firebaseListenerRef.current = null;
      }
    };
  }, [retryCount]);

  const shareMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied."
        );
        return;
      }

      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        Alert.alert(
          "Location Services",
          "Please enable location services in your device settings."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;
      if (!isFiniteLatLng(latitude, longitude)) {
        Alert.alert(
          "Location Error",
          "Invalid coordinates returned by the device."
        );
        return;
      }

      setUserLocation({ latitude, longitude });
      setIsSharingLocation(true);

      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14,
        animationDuration: 1000,
      });

      console.log("User location updated:", { latitude, longitude });
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert(
        "Location Error",
        "Could not get your location. Please try again."
      );
    }
  };

  const stopSharingLocation = () => {
    setIsSharingLocation(false);
    setUserLocation(null);
    console.log("Stopped sharing user location");
  };

  const refreshMapData = () => {
    console.log("Refreshing map data...");
    setConnectionStatus("refreshing");
    setRetryCount(0);

    if (firebaseListenerRef.current) {
      firebaseListenerRef.current();
      firebaseListenerRef.current = null;
    }

    const busesRef = ref(database, "buses");
    const unsubscribe = onValue(
      busesRef,
      (snapshot) => {
        const data = snapshot.val() || null;
        const busList = filterRecentBuses(data);
        setBuses(busList);
        setConnectionStatus("connected");
        setLastUpdated(new Date().toLocaleTimeString());
        console.log(`Refreshed: ${busList.length} active buses`);
      },
      (error) => {
        console.error("Refresh error:", error);
        setConnectionStatus("error");
        Alert.alert("Refresh Error", "Failed to refresh bus locations.");
      }
    );

    firebaseListenerRef.current = unsubscribe;
  };

  // Manual cleanup trigger
  const manualCleanup = async () => {
    console.log("🧹 Manual cleanup triggered...");
    await performRegularCleanup();
  };

  const centerOnBuses = () => {
    if (buses.length === 0) {
      Alert.alert("No Buses", "No bus locations available to center on.");
      return;
    }

    const coordinates = buses.map((bus) => [bus.longitude, bus.latitude]);
    if (coordinates.length === 1) {
      cameraRef.current?.setCamera({
        centerCoordinate: coordinates[0],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    } else {
      const lngs = coordinates.map((c) => c[0]);
      const lats = coordinates.map((c) => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      cameraRef.current?.setCamera({
        centerCoordinate: [centerLng, centerLat],
        zoomLevel: 12,
        animationDuration: 1000,
      });
    }
  };

  const getMarkerColor = (bus) => {
    const isGPSTracker = bus.deviceType === "gps_tracker";
    const currentTime = Date.now();
    const isOld = bus.timestamp && currentTime - bus.timestamp > 60 * 1000;
    if (isOld) return "#888888";
    return isGPSTracker ? "#00AA00" : "#FF0000";
  };

  const getMarkerIcon = (bus) =>
    bus.deviceType === "gps_tracker" ? "bus" : "map-marker";

  // Render markers with clustering support
  const renderBusMarkers = () => {
    if (showClustering && buses.length > 20) {
      const clustered = clusterBuses(buses, 0.01);
      return clustered.map((cluster, index) => {
        if (cluster.count === 1) {
          const bus = cluster.representativeBus;
          return (
            <React.Fragment key={`single-bus-${bus.name}-${index}`}>
              <MapboxGL.PointAnnotation
                id={`single-bus-text-${bus.name}-${index}`}
                coordinate={[bus.longitude, bus.latitude]}
                anchor={{ x: 0.5, y: 1.2 }}
              >
                <Text
                  style={{
                    backgroundColor: "white",
                    color: getMarkerColor(bus),
                    fontSize: 8,
                    fontWeight: "bold",
                    paddingHorizontal: 3,
                    paddingVertical: 2,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: getMarkerColor(bus),
                    textAlign: "center",
                    minWidth: 60,
                  }}
                >
                  {bus.name}
                </Text>
              </MapboxGL.PointAnnotation>

              <MapboxGL.PointAnnotation
                id={`single-bus-icon-${bus.name}-${index}`}
                coordinate={[bus.longitude, bus.latitude]}
              >
                <FontAwesome
                  name={getMarkerIcon(bus)}
                  size={28}
                  color={getMarkerColor(bus)}
                />
              </MapboxGL.PointAnnotation>
            </React.Fragment>
          );
        } else {
          return (
            <MapboxGL.PointAnnotation
              key={`cluster-${index}`}
              id={`cluster-${index}`}
              coordinate={[cluster.longitude, cluster.latitude]}
            >
              <View
                style={{
                  backgroundColor: "#FF6B35",
                  borderRadius: 20,
                  padding: 8,
                  minWidth: 40,
                  minHeight: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: "white",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                >
                  {cluster.count}
                </Text>
              </View>
            </MapboxGL.PointAnnotation>
          );
        }
      });
    }

    return buses.map((bus, index) => (
      <React.Fragment key={`bus-${bus.name}-${index}`}>
        <MapboxGL.PointAnnotation
          id={`bus-text-${bus.name}-${index}`}
          coordinate={[bus.longitude, bus.latitude]}
          anchor={{ x: 0.5, y: 1.2 }}
        >
          <Text
            style={{
              backgroundColor: "white",
              color: getMarkerColor(bus),
              fontSize: 8,
              fontWeight: "bold",
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: getMarkerColor(bus),
              textAlign: "center",
              minWidth: 60,
            }}
          >
            {bus.name}
          </Text>
        </MapboxGL.PointAnnotation>

        <MapboxGL.PointAnnotation
          id={`bus-icon-${bus.name}-${index}`}
          coordinate={[bus.longitude, bus.latitude]}
        >
          <FontAwesome
            name={getMarkerIcon(bus)}
            size={28}
            color={getMarkerColor(bus)}
          />
        </MapboxGL.PointAnnotation>
      </React.Fragment>
    ));
  };

  return (
    <View className="flex-1">
      <MapboxGL.MapView style={{ flex: 1 }}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={10}
          centerCoordinate={[91.7832, 22.3569]}
        />

        {isSharingLocation && userLocation && (
          <MapboxGL.PointAnnotation
            id="user-location"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View
              style={{
                width: 20,
                height: 20,
                backgroundColor: "blue",
                borderRadius: 10,
                borderWidth: 2,
                borderColor: "white",
              }}
            />
          </MapboxGL.PointAnnotation>
        )}

        {renderBusMarkers()}
      </MapboxGL.MapView>

      <View className="absolute top-12 left-4 right-4 bg-white p-2 rounded-md">
        <Text className="text-sm">
          Status:{" "}
          <Text
            style={{
              color:
                connectionStatus === "connected"
                  ? "green"
                  : connectionStatus === "refreshing"
                  ? "orange"
                  : "red",
            }}
          >
            {connectionStatus}
          </Text>
          {retryCount > 0 && (
            <Text style={{ color: "orange" }}>
              {" "}
              (Retry {retryCount}/{maxRetries})
            </Text>
          )}
        </Text>
        <Text className="text-xs text-gray-600">
          Active Buses: {buses.length} | Last updated: {lastUpdated || "Never"}
        </Text>
        {showClustering && (
          <Text className="text-xs text-orange-600">
            🔄 Clustering enabled ({buses.length} buses)
          </Text>
        )}
        <Text className="text-xs text-blue-600">
          🧹 Auto-cleanup: Every minute | Last:{" "}
          {cleanupStats.lastCleanup || "Never"}
        </Text>
        {cleanupStats.deletedCount > 0 && (
          <Text className="text-xs text-green-600">
            ✅ Deleted {cleanupStats.deletedCount} expired buses
          </Text>
        )}
      </View>

      <View className="absolute bottom-4 right-4 space-y-2">
        <TouchableOpacity
          className="bg-purple-500 p-3 rounded-md items-center"
          onPress={centerOnBuses}
        >
          <Text className="text-white text-sm">Center on Buses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-500 p-3 rounded-md items-center"
          onPress={refreshMapData}
        >
          <Text className="text-white text-sm">Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-orange-500 p-3 rounded-md items-center"
          onPress={manualCleanup}
        >
          <Text className="text-white text-sm">Clean Old Buses</Text>
        </TouchableOpacity>

        {!isSharingLocation ? (
          <TouchableOpacity
            className="bg-green-500 p-3 rounded-md items-center"
            onPress={shareMyLocation}
          >
            <Text className="text-white text-sm">Show My Location</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-red-500 p-3 rounded-md items-center"
            onPress={stopSharingLocation}
          >
            <Text className="text-white text-sm">Hide My Location</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default trackBus;
