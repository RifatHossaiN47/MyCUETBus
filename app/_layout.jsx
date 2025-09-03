import { Stack } from "expo-router";
import { Slot } from "expo-router";

// Import your global CSS file
import "../global.css";

// export default Slot;

export default function RootLayout() {
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
