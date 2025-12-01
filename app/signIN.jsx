import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import "nativewind";
import { Link, useRouter } from "expo-router";
import { auth } from "../firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";

// Validation Schema using Yup
const signInSchema = yup.object().shape({
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

const signIN = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signInSchema),
  });

  const router = useRouter();

  // Handle Form Submission
  const onSubmit = async (data) => {
    setIsLoading(true);

    // Check network connectivity first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (networkError) {
      setIsLoading(false);
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again."
      );
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      if (userCredential.user.emailVerified) {
        console.log("User signed in successfully");
        router.replace("/tabs/homes");
      } else {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before signing in. Check your inbox for the verification link."
        );
      }
    } catch (error) {
      console.error("Sign in error:", error);
      let errorMessage = "Failed to sign in. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage =
          "No account found with this email. Please sign up first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage =
          "This account has been disabled. Please contact support.";
      }

      Alert.alert("Sign In Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center p-5">
      <View className="flex-1 justify-center items-center bg-blue-900 max-h-32 mb-10 border-4">
        <Text className="text-5xl font-bold text-center text-white w-4/5">
          SIGN IN
        </Text>
      </View>

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
          {isLoading ? "Signing In..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          Alert.prompt(
            "Forgot Password?",
            "Enter your email address to receive a password reset link:",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Send Reset Link",
                onPress: async (email) => {
                  if (!email || !email.includes("@student.cuet.ac.bd")) {
                    Alert.alert(
                      "Error",
                      "Please enter a valid CUET student email."
                    );
                    return;
                  }
                  try {
                    const { sendPasswordResetEmail } = await import(
                      "firebase/auth"
                    );
                    await sendPasswordResetEmail(auth, email);
                    Alert.alert(
                      "Email Sent",
                      "Password reset link has been sent to your email."
                    );
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      error.code === "auth/user-not-found"
                        ? "No account found with this email."
                        : "Failed to send reset email. Please try again."
                    );
                  }
                },
              },
            ],
            "plain-text"
          );
        }}
        className="mt-3"
      >
        <Text className="text-center text-blue-500">Forgot Password?</Text>
      </TouchableOpacity>

      <Text className="text-center mt-5">
        Don't have an account?{" "}
        <Link href="/signUP" className="text-center text-blue-500">
          Sign Up ~_~
        </Link>
      </Text>
    </View>
  );
};

export default signIN;
