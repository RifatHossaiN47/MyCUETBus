import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const layouthome = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "green",
        },
        headerTintColor: "white",
        headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
        headerTileAlign: "center",
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="busservice"
        options={{ title: "Bus Service", headerShown: false }}
      />
      <Stack.Screen
        name="condir"
        options={{ title: "Management Info", headerShown: false }}
      />
      <Stack.Screen
        name="vehireg"
        options={{ title: "Vehicle Reg No.", headerShown: false }}
      />
    </Stack>
  );
};

export default layouthome;
