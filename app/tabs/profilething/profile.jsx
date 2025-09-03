import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import { auth } from "../../../firebase.config";
import { deleteUser, onAuthStateChanged, signOut } from "firebase/auth";
import { router } from "expo-router";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signIN");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            setDeleting(true);
            try {
              const currentUser = auth.currentUser;
              await deleteUser(currentUser);
              Alert.alert(
                "Account Deleted",
                "Your account has been successfully deleted."
              );
            } catch (error) {
              setDeleting(false);
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Re-authentication Required",
                  "For security reasons, please sign out and sign in again to delete your account."
                );
              } else {
                Alert.alert(
                  "Error",
                  error.message || "Failed to delete account"
                );
              }
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View className="bg-white px-6 py-8 mt-12 mx-4 rounded-xl shadow-sm">
        <View className="items-center">
          <View className="bg-blue-100 p-6 rounded-full mb-4">
            <Entypo name="user" size={60} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {user.displayName || "No Name Set"}
          </Text>
          <Text className="text-lg text-gray-600 mb-4 text-center">
            {user.email}
          </Text>
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-green-800 text-sm font-medium">
              Verified Account
            </Text>
          </View>
        </View>
      </View>

      {/* Account Info */}
      <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-600">Account Created</Text>
            <Text className="text-gray-900 font-medium">
              {user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-600">Last Sign In</Text>
            <Text className="text-gray-900 font-medium">
              {user.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-600">Email Verified</Text>
            <Text
              className={`font-medium ${
                user.emailVerified ? "text-green-600" : "text-orange-600"
              }`}
            >
              {user.emailVerified ? "Yes" : "Pending"}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="px-4 pt-6 pb-4">
        <TouchableOpacity
          className="bg-blue-600 flex-row items-center justify-center py-4 rounded-xl mb-4 shadow-sm"
          onPress={() => router.push("/tabs/profilething/editprofile")}
          activeOpacity={0.8}
        >
          <MaterialIcons name="edit" size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View className="px-4 pb-8">
        <View className="bg-red-50 border border-red-200 rounded-xl p-6">
          <Text className="text-red-800 font-semibold mb-2 text-center">
            Danger Zone
          </Text>
          <Text className="text-red-600 text-sm text-center mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </Text>
          <TouchableOpacity
            className="bg-red-600 flex-row items-center justify-center py-4 rounded-xl"
            onPress={deleteAccount}
            disabled={deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="delete-forever" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Delete Account
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default Profile;
