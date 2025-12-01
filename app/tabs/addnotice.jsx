import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import "nativewind";
import { useRouter } from "expo-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebase.config";
import { MaterialIcons } from "@expo/vector-icons";

// Enhanced validation schema
const addNoticeSchema = yup.object().shape({
  date: yup
    .string()
    .required("Date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in the format YYYY-MM-DD")
    .test("future-date", "Date cannot be in the past", function (value) {
      if (!value) return false;
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate >= today;
    }),
  title: yup
    .string()
    .required("Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title cannot exceed 100 characters"),
  notice: yup
    .string()
    .required("Notice content is required")
    .min(10, "Notice must be at least 10 characters")
    .max(1000, "Notice cannot exceed 1000 characters"),
});

const AddNotice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(addNoticeSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      title: "",
      notice: "",
    },
  });

  const watchedNotice = watch("notice", "");
  const characterCount = watchedNotice ? watchedNotice.length : 0;

  // Admin verification
  useEffect(() => {
    const checkAdminStatus = () => {
      const user = auth.currentUser;
      if (user && user.photoURL === "admin") {
        setIsAdmin(true);
      } else {
        Alert.alert(
          "Access Denied",
          "You don't have permission to add notices.",
          [{ text: "OK", onPress: () => router.replace("/tabs/homes") }]
        );
      }
    };

    checkAdminStatus();
  }, []);

  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Re-verify admin status before submission
      await auth.currentUser.reload();
      const user = auth.currentUser;

      if (!user || user.photoURL !== "admin") {
        Alert.alert("Access Denied", "You no longer have admin privileges.", [
          { text: "OK", onPress: () => router.replace("/tabs/homes") },
        ]);
        throw new Error("Unauthorized access");
      }

      const docRef = await addDoc(collection(db, "notices"), {
        title: data.title.trim(),
        notice: data.notice.trim(),
        date: data.date,
        createdAt: serverTimestamp(),
        createdBy: {
          uid: user.uid,
          name: user.displayName || "Admin",
          email: user.email,
        },
        priority: "normal",
        isActive: true,
      });

      Alert.alert("Success!", "Notice has been added successfully!", [
        {
          text: "Add Another",
          onPress: () =>
            reset({
              date: new Date().toISOString().split("T")[0],
              title: "",
              notice: "",
            }),
        },
        {
          text: "View Notices",
          onPress: () => router.push("/tabs/notices"),
        },
      ]);
    } catch (error) {
      console.error("Error adding notice:", error);
      Alert.alert("Error", "Failed to add notice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <MaterialIcons name="block" size={64} color="#ef4444" />
        <Text className="text-lg text-gray-600 mt-4">
          Checking permissions...
        </Text>
      </View>
    );
  }

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
        {/* Fixed Header */}
        <View className="bg-blue-600 p-6 pt-12 shadow-sm">
          <View className="flex-row items-center">
            <MaterialIcons name="add-circle" size={28} color="white" />
            <Text className="text-2xl font-bold text-white ml-2">
              Add Notice
            </Text>
          </View>
          <Text className="text-blue-100 mt-1">
            Create and publish new notices
          </Text>
        </View>

        {/* Form Content */}
        <View className="flex-1 p-6">
          {/* Date Field */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-700 mb-2">
              📅 Notice Date
            </Text>
            <Controller
              name="date"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border-2 p-4 rounded-xl bg-white text-gray-900 ${
                    errors.date ? "border-red-400" : "border-gray-200"
                  } focus:border-blue-500`}
                  placeholder="YYYY-MM-DD"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.date && (
              <Text className="text-red-500 mt-1 ml-2">
                {errors.date.message}
              </Text>
            )}
          </View>

          {/* Title Field */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-700 mb-2">
              📝 Notice Title
            </Text>
            <Controller
              name="title"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    className={`border-2 p-4 rounded-xl bg-white text-gray-900 ${
                      errors.title ? "border-red-400" : "border-gray-200"
                    } focus:border-blue-500`}
                    placeholder="Enter notice title..."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    maxLength={100}
                    autoCapitalize="sentences"
                  />
                  <Text className="text-gray-500 text-sm mt-1 ml-2">
                    {value?.length || 0}/100 characters
                  </Text>
                </View>
              )}
            />
            {errors.title && (
              <Text className="text-red-500 mt-1 ml-2">
                {errors.title.message}
              </Text>
            )}
          </View>

          {/* Notice Content Field */}
          <View className="mb-6 flex-1">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold text-gray-700">
                📄 Notice Content
              </Text>
              <Text
                className={`text-sm ${
                  characterCount > 900 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {characterCount}/1000
              </Text>
            </View>
            <Controller
              name="notice"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border-2 p-4 rounded-xl bg-white text-gray-900 ${
                    errors.notice ? "border-red-400" : "border-gray-200"
                  } focus:border-blue-500`}
                  placeholder="Enter your notice content here..."
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isLoading}
                  maxLength={1000}
                  autoCapitalize="sentences"
                  style={{ minHeight: 120 }}
                />
              )}
            />
            {errors.notice && (
              <Text className="text-red-500 mt-1 ml-2">
                {errors.notice.message}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() =>
                reset({
                  date: new Date().toISOString().split("T")[0],
                  title: "",
                  notice: "",
                })
              }
              className="flex-1 bg-gray-500 p-4 rounded-xl flex-row justify-center items-center"
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              className={`flex-1 p-4 rounded-xl flex-row justify-center items-center ${
                isLoading || !isDirty ? "bg-gray-400" : "bg-blue-600"
              }`}
              disabled={isLoading || !isDirty}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="publish" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Add Notice
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddNotice;
