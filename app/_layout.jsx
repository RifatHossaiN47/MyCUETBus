import { Stack } from "expo-router";
import { Slot } from "expo-router";
import { useEffect } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import your global CSS file
import "../global.css";
import "./tasks/backgroundLocationTask";

const BACKGROUND_TASK_NAME = "MYCUETBUS_BG_LOCATION";

// export default Slot;

export default function RootLayout() {
  // Clean up orphaned background tasks on app startup
  useEffect(() => {
    const cleanup = async () => {
      try {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_TASK_NAME
        );
        if (hasStarted) {
          console.log("🧹 Cleaning up orphaned background task...");
          await Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME);
          await AsyncStorage.removeItem("BUS_NAME");
          console.log("✅ Cleanup complete");
        }
      } catch (error) {
        console.log("⚠️ Cleanup error:", error);
      }
    };
    cleanup();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "green",
        },
        headerTintColor: "white",
        headerTitleAlign: "center",

        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "index", headerShown: false }}
      />
      <Stack.Screen
        name="tabs"
        options={{ title: "Tabs", headerShown: false }}
      />
      <Stack.Screen
        name="signIN"
        options={{ title: "Sign IN", headerShown: false }}
      />
      <Stack.Screen
        name="signUP"
        options={{ title: "Sign Up", headerShown: false }}
      />
    </Stack>
  );
}
