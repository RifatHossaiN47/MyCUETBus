import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase.config";

export default function vehireg() {
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "vehireg")); // Fetch data from "vehicles" collection
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setVehicleData(data);
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
        Vehicle Types and Registration Numbers
      </Text>
      {vehicleData.map((item, index) => (
        <View
          key={item.id} // Use Firestore's unique document ID as the key
          className="mb-4 p-4 border border-gray-300 rounded-lg bg-white shadow"
        >
          <Text className="text-lg font-semibold text-gray-700">
            Vehicle Type: {item.vehicleType}
          </Text>
          <Text className="text-gray-600">
            Registration: {item.registration}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
