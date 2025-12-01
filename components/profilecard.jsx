import {
  Image,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import React from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const Profilecard = ({ image, name, id, mail, dept }) => {
  const images = {
    pics: require("../assets/images/developers/pics.jpg"),
    shuvo: require("../assets/images/developers/shuvo.jpg"),
  };

  const openEmail = (email, subject = "") => {
    const emailUrl = subject
      ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
      : `mailto:${email}`;

    Linking.openURL(emailUrl).catch(() =>
      Alert.alert("Error", "Could not open email client")
    );
  };

  const personalEmail = `${mail}`;
  const studentEmail = `u${id}@student.cuet.ac.bd`;

  return (
    <View className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with gradient background */}
      <View className="bg-blue-600 p-6 items-center">
        <View className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4">
          <Image
            source={images[image]}
            resizeMode="cover"
            className="w-full h-full"
          />
        </View>
        <Text className="text-2xl font-bold text-white text-center mb-1">
          {name}
        </Text>
      </View>

      {/* Content Section */}
      <View className="p-6">
        {/* Department Info */}
        <View className="items-center mb-6">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="school" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-2 font-medium">
              Department of {dept}, CUET
            </Text>
          </View>
          <Text className="text-gray-600 text-center">
            Chittagong University of Engineering & Technology
          </Text>
        </View>

        {/* Contact Information */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
            Get in Touch
          </Text>
          <Text className="text-gray-600 text-center mb-4 text-sm">
            For queries, bug reports, feature requests, or any help:
          </Text>

          {/* Email Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-red-500 p-4 rounded-xl flex-row items-center justify-center shadow-sm"
              onPress={() => openEmail(personalEmail, "CUET Bus App - Contact")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="email" size={20} color="white" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold">Personal Email</Text>
                <Text className="text-red-100 text-sm">{personalEmail}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-500 p-4 rounded-xl flex-row items-center justify-center shadow-sm mt-2"
              onPress={() =>
                openEmail(studentEmail, "CUET Bus App - Official Contact")
              }
              activeOpacity={0.8}
            >
              <MaterialIcons name="school" size={20} color="white" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold">Student Email</Text>
                <Text className="text-indigo-100 text-sm">{studentEmail}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Response Time Info */}
        <View className="bg-green-50 border border-green-200 rounded-lg p-3">
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="access-time" size={16} color="#059669" />
            <Text className="text-green-800 text-sm ml-2 font-medium">
              Response Time: 24-48 hours
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Profilecard;
