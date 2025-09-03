import React from "react";
import { Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#3B82F6",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
        headerTitleAlign: "center", // Fixed typo
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="editprofile"
        options={{
          title: "Edit Profile",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
};

export default ProfileLayout;
