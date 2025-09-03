import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import "nativewind";
import { Link, useRouter } from "expo-router";
import { auth } from "../firebase.config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

// Validation Schema using Yup
const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters"),
  email: yup
    .string()
    .required("Email is required")
    .matches(
      /^u\d{7}@student\.cuet\.ac\.bd$/,
      "Email must follow the format uXXXXXXX@student.cuet.ac.bd"
    ),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

const signUP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signupSchema),
  });

  const router = useRouter();

  // Handle Form Submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // Update profile with name and user role
      await updateProfile(userCredential.user, {
        displayName: data.name,
        photoURL: "user",
      });

      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      Alert.alert(
        "Account Created Successfully!",
        "Please check your email and verify your account before signing in.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/signIN")
          }
        ]
      );
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center p-5">
      <View className="flex-1 justify-center items-center bg-blue-900 max-h-32 mb-10 border border-4">
        <Text className="text-5xl font-bold text-center text-white w-4/5">
          SIGN UP
        </Text>
      </View>

      {/* Name Field */}
      <Text className="text-lg mb-2">Name:</Text>
      <Controller
        name="name"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border p-3 rounded-md mb-2 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!isLoading}
          />
        )}
      />
      {errors.name && (
        <Text className="text-red-500 mb-2">{errors.name.message}</Text>
      )}

      {/* Email Field */}
      <Text className="text-lg mb-2">Email:</Text>
      <Controller
        name="email"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border p-3 rounded-md mb-2 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="u2004129@student.cuet.ac.bd"
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!isLoading}
          />
        )}
      />
      {errors.email && (
        <Text className="text-red-500 mb-2">{errors.email.message}</Text>
      )}

      {/* Password Field */}
      <Text className="text-lg mb-2">Password:</Text>
      <Controller
        name="password"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border p-3 rounded-md mb-2 ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!isLoading}
          />
        )}
      />
      {errors.password && (
        <Text className="text-red-500 mb-2">{errors.password.message}</Text>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        className={`p-3 rounded-md mt-3 ${
          isLoading ? "bg-gray-400" : "bg-blue-500"
        }`}
        disabled={isLoading}
      >
        <Text className="text-white text-center text-lg">
          {isLoading ? "Creating Account..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <Text className="text-center mt-5">
        Already have an account?{" "}
        <Link href="/signIN" className="text-center text-blue-500">
          Sign In :)
        </Link>
      </Text>
    </View>
  );
};

export default signUP;
