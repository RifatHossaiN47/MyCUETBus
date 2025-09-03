import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { db } from "../../../firebase.config";
export default function condir() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const directoryCollection = collection(db, "condir");
        const q = query(directoryCollection, orderBy("order", "asc")); // Query to fetch data in order
        const querySnapshot = await getDocs(q);

        const fetchedData = [];
        querySnapshot.forEach((doc) => {
          fetchedData.push({ id: doc.id, ...doc.data() });
        });

        setData(fetchedData); // Update the state with fetched data
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading contact directory...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-center mb-4 text-blue-600">
        Transport Section Contact Directory
      </Text>
      {data.map((item) => (
        <View
          key={item.id}
          className="mb-4 p-4 border border-gray-300 rounded-lg"
        >
          <Text className="text-lg font-semibold text-gray-700">
            Name: {item.name}
          </Text>
          <Text className="text-gray-600">Position: {item.position}</Text>
          <Text className="text-gray-600">Phone: {item.phone}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
