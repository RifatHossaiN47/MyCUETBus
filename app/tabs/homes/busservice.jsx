import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { db } from "../../../firebase.config";
import { addDoc, collection, getDocs } from "firebase/firestore";

export default function busservice() {
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "busservice")); // Fetch from the "vehicles" collection
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setVehicleData(data); // Update state with fetched data
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vehicle data: ", error);
        setLoading(false);
      }
    };
    fetchVehicleData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading vehicle data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-center mb-4 text-blue-600">
        Driver and Helper Contact Directory
      </Text>
      {vehicleData.map((item, index) => (
        <View
          key={index}
          className="mb-4 p-4 border border-gray-300 rounded-lg bg-white shadow"
        >
          <Text className="text-lg font-semibold text-gray-700">
            Vehicle Name: {item.vehicleType}
          </Text>
          <Text className="text-gray-600">
            Registration: {item.registration}
          </Text>
          <Text className="text-gray-600">
            Driver: {item.driver.name} ({item.driver.contact})
          </Text>
          <Text className="text-gray-600">
            Helper: {item.helper.name} ({item.helper.contact})
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
