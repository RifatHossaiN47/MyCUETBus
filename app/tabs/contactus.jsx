import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import Profilecard from "../../components/profilecard";
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons";

const ContactUs = () => {
  const openEmail = (email) => {
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert("Error", "Could not open email client")
    );
  };

  const openURL = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open browser")
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Header Section */}
      <View className="bg-blue-600 p-6 pt-12">
        <View className="flex-row items-center mb-2">
          <MaterialIcons name="contact-support" size={28} color="white" />
          <Text className="text-2xl font-bold text-white ml-2">
            Contact & Help
          </Text>
        </View>
        <Text className="text-blue-100">
          Get in touch with us for support and feedback
        </Text>
      </View>

      {/* Developer Information */}
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          Meet the Developer
        </Text>
        <Profilecard
          image="rifathossain"
          name="MD. Rifat Hossain"
          id="2004129"
        />
      </View>

      {/* App Usage Guidelines */}
      <View className="mx-4 mb-6">
        <View className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <Feather name="info" size={24} color="#3B82F6" />
            <Text className="text-xl font-bold text-gray-800 ml-2">
              App Usage Guidelines
            </Text>
          </View>

          {/* Bus Location Sharing Guidelines */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-700 mb-3">
              📍 Bus Location Sharing
            </Text>
            <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <Text className="text-amber-800 font-medium mb-2">
                ⚠️ Important Guidelines:
              </Text>
              <Text className="text-amber-700 leading-6">
                • When a student shares a bus location, other students should
                avoid sharing the same bus location{"\n"}• This prevents
                duplicate entries and ensures accurate tracking{"\n"}• Always
                check if someone already shared the location before adding new
                one
              </Text>
            </View>
          </View>

          {/* API Limitations */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-700 mb-3">
              🗺️ Map Service Limitations
            </Text>
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <Text className="text-blue-800 font-medium mb-2">
                Mapbox Free Tier Limits:
              </Text>
              <Text className="text-blue-700 leading-6">
                •{" "}
                <Text className="font-semibold">
                  50,000 map views per month
                </Text>{" "}
                (shared across all users){"\n"}•{" "}
                <Text className="font-semibold">
                  100,000 address searches per month
                </Text>
                {"\n"}•{" "}
                <Text className="font-semibold">6,000 requests per minute</Text>{" "}
                rate limit{"\n"}• Please use the map feature optimally to stay
                within limits{"\n"}• Avoid unnecessary zooming and panning
              </Text>
            </View>
            <View className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Text className="text-green-800 font-medium mb-2">
                💡 Optimization Tips:
              </Text>
              <Text className="text-green-700 leading-6">
                • Only open map when necessary{"\n"}• Use search instead of
                scrolling around{"\n"}• Close map when done viewing{"\n"}• Share
                locations only when bus position changes significantly
              </Text>
            </View>
          </View>

          {/* Future Plans */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-700 mb-3">
              🚀 Future Improvements
            </Text>
            <View className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <Text className="text-purple-800 font-medium mb-2">
                🔮 Coming Soon:
              </Text>
              <Text className="text-purple-700 leading-6">
                • <Text className="font-semibold">GPS Trackers in Buses:</Text>{" "}
                We're planning to install GPS trackers in CUET buses for
                continuous location tracking{"\n"}•{" "}
                <Text className="font-semibold">Real-time Updates:</Text> This
                will eliminate the need for manual location sharing{"\n"}•{" "}
                <Text className="font-semibold">Automated System:</Text> Buses
                will automatically update their locations{"\n"}•{" "}
                <Text className="font-semibold">Better Accuracy:</Text> More
                precise and real-time location data
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Feedback & Bug Reports */}
      <View className="mx-4 mb-6">
        <View className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="feedback" size={24} color="#059669" />
            <Text className="text-xl font-bold text-gray-800 ml-2">
              Feedback & Bug Reports
            </Text>
          </View>

          <Text className="text-gray-600 mb-4 leading-6">
            Found a bug? Have an improvement idea? Your feedback helps make this
            app better for everyone!
          </Text>

          <View className="space-y-3">
            <TouchableOpacity
              className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-center"
              onPress={() =>
                openEmail(
                  "rifat8851@gmail.com?subject=CUET Bus App - Bug Report"
                )
              }
              activeOpacity={0.8}
            >
              <MaterialIcons name="bug-report" size={20} color="#DC2626" />
              <View className="flex-1 ml-3">
                <Text className="text-red-800 font-medium">Report a Bug</Text>
                <Text className="text-red-600 text-sm">
                  Tell us what went wrong
                </Text>
              </View>
              <Feather name="external-link" size={16} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-row items-center"
              onPress={() =>
                openEmail(
                  "rifat8851@gmail.com?subject=CUET Bus App - Feature Request"
                )
              }
              activeOpacity={0.8}
            >
              <MaterialIcons name="lightbulb" size={20} color="#2563EB" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-800 font-medium">
                  Suggest Feature
                </Text>
                <Text className="text-blue-600 text-sm">
                  Share your improvement ideas
                </Text>
              </View>
              <Feather name="external-link" size={16} color="#2563EB" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-50 border border-green-200 rounded-lg p-4 flex-row items-center"
              onPress={() =>
                openEmail(
                  "rifat8851@gmail.com?subject=CUET Bus App - General Inquiry"
                )
              }
              activeOpacity={0.8}
            >
              <MaterialIcons name="help" size={20} color="#059669" />
              <View className="flex-1 ml-3">
                <Text className="text-green-800 font-medium">General Help</Text>
                <Text className="text-green-600 text-sm">
                  Ask questions or get support
                </Text>
              </View>
              <Feather name="external-link" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Links */}
      <View className="mx-4 mb-6">
        <View className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Quick Links:
          </Text>
          <View className="space-y-3">
            <TouchableOpacity
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
              onPress={() =>
                openURL("https://www.facebook.com/rifathossain4777")
              }
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="school" size={20} color="#6B7280" />
                <Text className="text-gray-700 ml-3 font-medium">
                  Facebook Connect
                </Text>
              </View>
              <Feather name="external-link" size={16} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
              onPress={() => openURL("https://mapbox.com")}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="map" size={20} color="#6B7280" />
                <Text className="text-gray-700 ml-3 font-medium">
                  Mapbox (Our Map Provider)
                </Text>
              </View>
              <Feather name="external-link" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View className="mx-4 mb-4">
        <View className=" p-6 rounded-xl">
          <Text className="text-blue-600 text-center font-bold text-lg mb-2">
            CUET Bus Tracking App
          </Text>
          <Text className="text-gray-300 text-center text-sm">
            Made with ❤️ for CUET students
          </Text>
          <Text className="text-gray-400 text-center text-xs mt-2">
            Version 2.0.0 • Built with React Native & Expo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ContactUs;
