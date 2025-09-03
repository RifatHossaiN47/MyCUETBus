import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const home = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20 }}
    >
      <View className="flex-1 justify-center items-center">
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-blue-900 p-8 rounded-lg my-5 w-full"
          onPress={() => router.push("/tabs/homes/busservice")}
        >
          <MaterialIcons name="bus-alert" size={80} color="white" />
          <Text className="text-xl text-white">Bus Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-blue-900 p-6 rounded-lg my-5 w-full"
          onPress={() => router.push("/tabs/homes/condir")}
        >
          <FontAwesome6 name="contact-book" size={80} color="white" />
          <Text className="text-xl text-white">
            Transport Section Contact Directory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-blue-900 p-8 rounded-lg my-5 w-full"
          onPress={() => router.push("/tabs/homes/vehireg")}
        >
          <FontAwesome name="registered" size={80} color="white" />
          <Text className="text-xl text-white">
            Vehicle Types & Reg No Directory
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default home;
