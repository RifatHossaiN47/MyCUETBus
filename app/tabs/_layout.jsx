import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Drawer } from "expo-router/drawer";
import {
  Entypo,
  FontAwesome5,
  FontAwesome6,
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { DrawerItemList } from "@react-navigation/drawer";
import { auth } from "../../firebase.config";
import { router, usePathname } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";

const TabLayout = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isEditProfilePage = pathname === "/tabs/profilething/editprofile";

  const handleLogout = async () => {
    if (loggingOut) return;

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut(auth);
            Alert.alert("Logout", "You have been successfully logged out");
            router.replace("/");
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
            console.error("Logout error:", error);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(
        "Layout auth state:",
        currentUser ? "User present" : "No user"
      );

      setUser(currentUser);

      if (!currentUser) {
        setIsLoading(false);
        router.replace("/");
      } else if (!currentUser.emailVerified) {
        setIsLoading(false);
        Alert.alert(
          "Email Not Verified",
          "Please verify your email to continue using the app.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/signIN"),
            },
          ]
        );
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-lg text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Redirecting...</Text>
      </View>
    );
  }

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#059669",
        },
        headerTintColor: "white",
        headerTitleAlign: "center",
        overlayColor: "rgba(0,0,0,0.4)",
        gestureEnabled: true,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        drawerInactiveBackgroundColor: "transparent",
        drawerActiveBackgroundColor: "#3B82F6",
        drawerInactiveTintColor: "#374151",
        drawerActiveTintColor: "white",
        drawerLabelStyle: {
          fontWeight: "600",
          marginLeft: 15, // INCREASED spacing between icon and text
          fontSize: 16,
        },
        drawerItemStyle: {
          marginVertical: 4, // Space between drawer items
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        drawerStyle: {
          backgroundColor: "white",
          width: 320,
        },
      }}
      drawerContent={(props) => (
        <View style={{ flex: 1 }}>
          {/* FIXED Header Section - User Profile */}
          <View className="bg-green-50 p-6 border-b border-gray-200">
            <View className="items-center">
              <MaterialIcons
                name="security"
                size={80}
                color="#059669"
                className="mb-4"
              />
              <Text className="text-2xl font-bold text-center text-gray-900 mb-2">
                {user?.displayName || "User"}
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                {user?.email}
              </Text>
              {user?.photoURL === "admin" && (
                <View className="bg-orange-100 px-3 py-1 rounded-full mt-2">
                  <Text className="text-orange-800 text-xs font-semibold">
                    Admin
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* SCROLLABLE Middle Section - Navigation Items ONLY */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            <DrawerItemList {...props} />
          </ScrollView>

          {/* FIXED Footer Section - Logout & Credits */}
          <View className="border-t border-gray-200 p-4">
            <TouchableOpacity
              className="bg-red-500 flex-row justify-center items-center py-3 rounded-lg mb-4"
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.8}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="logout" size={20} color="white" />
                  <Text className="text-white font-semibold ml-3">Logout</Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 text-center italic">
              Developed by MD. Rifat Hossain{"\n"}CUET CSE-2004129
            </Text>
          </View>
        </View>
      )}
    >
      {/* All your drawer screens remain the same */}
      <Drawer.Screen
        name="homes"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Entypo name="home" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="notices"
        options={{
          title: "Notices",
          drawerIcon: ({ color, size }) => (
            <Fontisto name="bell-alt" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="addnotice"
        options={{
          title: user?.photoURL === "admin" ? "Add Notice" : "",
          drawerItemStyle:
            user?.photoURL === "admin" ? {} : { display: "none" },
          drawerIcon: ({ color, size }) =>
            user?.photoURL === "admin" ? (
              <Ionicons name="add-circle" size={size} color={color} />
            ) : null,
          headerRight: () =>
            user?.photoURL === "admin" ? (
              <View className="flex-row items-center mr-4 bg-orange-500 px-2 py-1 rounded">
                <MaterialIcons
                  name="admin-panel-settings"
                  size={16}
                  color="white"
                />
                <Text className="text-white text-xs ml-1 font-medium">
                  Admin
                </Text>
              </View>
            ) : null,
        }}
      />

      <Drawer.Screen
        name="schedule"
        options={{
          title: "Schedule",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="schedule" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="trackBus"
        options={{
          title: "Track Bus Location",
          drawerIcon: ({ color, size }) => (
            <FontAwesome6
              name="location-crosshairs"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="shareLocation"
        options={{
          title: "Share Bus Location",
          drawerIcon: ({ color, size }) => (
            <Entypo name="share" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="contactus"
        options={{
          title: "Contact Us",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="contact-support" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="profilething"
        options={{
          title: "Profile",
          headerShown: !isEditProfilePage,
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Drawer>
  );
};

export default TabLayout;
