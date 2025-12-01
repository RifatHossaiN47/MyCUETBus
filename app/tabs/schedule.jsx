import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

export default function Shedule() {
  const [scheduleData, setScheduleData] = useState(null); // Store fetched schedule data
  const [selectedDay, setSelectedDay] = useState("Saturday");
  const [userType, setUserType] = useState("Teacher");
  const [expandedShift, setExpandedShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "schedules", "busSchedule");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setScheduleData(docSnap.data().scheduleDatas); // Load data into state
        } else {
          console.log("No schedule data found!");
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, []);

  const getSchedule = () => {
    if (!scheduleData) return [];
    return scheduleData[userType][selectedDay] || []; // Fallback to an empty array
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-lg">Loading schedule...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <View className="bg-blue-600 p-4 rounded-lg mb-4">
        <Text className="text-white text-xl font-bold text-center">
          Bus Schedule
        </Text>
      </View>

      {/* Day Selector */}
      <View className="mb-4">
        <Text className="text-lg font-bold mb-2">Select Day:</Text>
        <View className="bg-gray-300 rounded-lg">
          <Picker
            selectedValue={selectedDay}
            onValueChange={(itemValue) => setSelectedDay(itemValue)}
            className="text-gray-800"
          >
            <Picker.Item label="Saturday" value="Saturday" />
            <Picker.Item label="Sunday" value="Sunday" />
            <Picker.Item label="Monday" value="Monday" />
            <Picker.Item label="Tuesday" value="Tuesday" />
            <Picker.Item label="Wednesday" value="Wednesday" />
            <Picker.Item label="Thursday" value="Thursday" />
          </Picker>
        </View>
      </View>

      {/* User Type Selector */}
      <View className="mb-4">
        <Text className="text-lg font-bold mb-2">User Type:</Text>
        <View className="bg-gray-300 rounded-lg">
          <Picker
            selectedValue={userType}
            onValueChange={(itemValue) => setUserType(itemValue)}
            className="text-gray-800"
          >
            <Picker.Item label="Teacher" value="Teacher" />
            <Picker.Item label="Student" value="Student" />
          </Picker>
        </View>
      </View>

      {/* Schedule List */}
      {getSchedule().map((shift, index) => (
        <TouchableOpacity
          key={index}
          onPress={() =>
            setExpandedShift(expandedShift === index ? null : index)
          }
          className="mb-4 p-4 bg-gray-200 rounded-lg shadow-md"
        >
          <Text className="text-lg font-bold">{shift.shift}:</Text>
          {expandedShift === index && (
            <View className="mt-2">
              <Text className="text-gray-700">Bus No: {shift.busNo}</Text>
              <Text className="text-gray-700">
                Start Time: {shift.startTime}
              </Text>
              <Text className="text-gray-700">
                Start Place: {shift.startPlace}
              </Text>
              <Text className="text-gray-700">
                Destination: {shift.destination}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
