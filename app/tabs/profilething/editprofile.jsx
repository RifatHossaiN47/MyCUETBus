import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { auth } from "../../../firebase.config";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { updateProfile, updatePassword } from "firebase/auth";

const editProfileSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .nullable(),
  newPassword: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long")
    .nullable(),
  confirmPassword: yup.string().when("newPassword", {
    is: (val) => val && val.length > 0,
    then: (schema) =>
      schema
        .required("Please confirm your new password")
        .oneOf([yup.ref("newPassword")], "Passwords must match"),
    otherwise: (schema) => schema.nullable(),
  }),
});

const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const currentUser = auth.currentUser;

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      name: currentUser?.displayName || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");
  const watchedName = watch("name");

  const onSubmit = async (data) => {
    const { name, newPassword } = data;
    const trimmedName = name?.trim();

    // Check if anything actually changed
    const nameChanged = trimmedName && trimmedName !== currentUser.displayName;
    const passwordChanged = newPassword?.trim();

    if (!nameChanged && !passwordChanged) {
      Alert.alert(
        "No Changes",
        "Please make at least one change to update your profile."
      );
      return;
    }

    setLoading(true);

    try {
      // Update display name if changed
      if (nameChanged) {
        await updateProfile(currentUser, {
          displayName: trimmedName,
        });
      }

      // Update password if provided
      if (passwordChanged) {
        await updatePassword(currentUser, newPassword);
      }

      Alert.alert("Success", "Your profile has been updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            reset();
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Update error:", error);
      let errorMessage = "Failed to update profile. Please try again.";

      if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "For security reasons, please sign out and sign in again to make these changes.";
      } else if (error.code === "auth/weak-password") {
        errorMessage =
          "Password is too weak. Please choose a stronger password.";
      } else if (error.code === "auth/invalid-display-name") {
        errorMessage = "Display name contains invalid characters.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    isDirty &&
    ((watchedName?.trim() && watchedName.trim() !== currentUser?.displayName) ||
      newPassword?.trim());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-center text-gray-900 mb-2">
              Edit Profile
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Update your account information
            </Text>

            {/* Current User Info */}
            <View className="bg-blue-50 p-4 rounded-xl mb-6">
              <Text className="text-blue-800 font-medium mb-2">
                Current Information
              </Text>
              <Text className="text-blue-600">
                Name: {currentUser?.displayName || "No name set"}
              </Text>
              <Text className="text-blue-600">Email: {currentUser?.email}</Text>
            </View>

            {/* Name Field */}
            <View className="mb-6">
              <Text className="text-lg font-medium text-gray-700 mb-2">
                Display Name
              </Text>
              <Controller
                name="name"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <TextInput
                      className={`border-2 p-4 rounded-xl text-lg ${
                        errors.name ? "border-red-500" : "border-gray-200"
                      } focus:border-blue-500 bg-white`}
                      placeholder="Enter your display name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      maxLength={50}
                      autoCapitalize="words"
                    />
                    <Text className="text-gray-500 text-sm mt-1 ml-2">
                      {value?.length || 0}/50 characters
                    </Text>
                  </View>
                )}
              />
              {errors.name && (
                <Text className="text-red-500 mt-1 ml-2">
                  {errors.name.message}
                </Text>
              )}
            </View>

            {/* Password Section */}
            <View className="border-t border-gray-200 pt-6">
              <Text className="text-lg font-medium text-gray-700 mb-4">
                Change Password
              </Text>

              <Controller
                name="newPassword"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="mb-4">
                    <Text className="text-gray-600 mb-2">New Password</Text>
                    <View className="relative">
                      <TextInput
                        className={`border-2 p-4 pr-12 rounded-xl ${
                          errors.newPassword
                            ? "border-red-500"
                            : "border-gray-200"
                        } focus:border-blue-500 bg-white`}
                        placeholder="Enter new password (optional)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showPassword}
                        maxLength={128}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        className="absolute right-4 top-4"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={24}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.newPassword && (
                      <Text className="text-red-500 mt-1 ml-2">
                        {errors.newPassword.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {newPassword && (
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="mb-4">
                      <Text className="text-gray-600 mb-2">
                        Confirm New Password
                      </Text>
                      <View className="relative">
                        <TextInput
                          className={`border-2 p-4 pr-12 rounded-xl ${
                            errors.confirmPassword
                              ? "border-red-500"
                              : "border-gray-200"
                          } focus:border-blue-500 bg-white`}
                          placeholder="Confirm new password"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          className="absolute right-4 top-4"
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          <Ionicons
                            name={showConfirmPassword ? "eye-off" : "eye"}
                            size={24}
                            color="#666"
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword && (
                        <Text className="text-red-500 mt-1 ml-2">
                          {errors.confirmPassword.message}
                        </Text>
                      )}
                    </View>
                  )}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-gray-200 py-4 rounded-xl"
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text className="text-gray-800 text-center font-semibold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                className={`flex-1 py-4 rounded-xl ${
                  hasChanges && !loading ? "bg-blue-600" : "bg-gray-400"
                }`}
                disabled={loading || !hasChanges}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    {hasChanges ? "Update Profile" : "No Changes"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfile;
