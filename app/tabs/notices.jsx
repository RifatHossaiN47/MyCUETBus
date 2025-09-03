import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import "nativewind";
import { db } from "../../firebase.config";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { MaterialIcons, Feather } from "@expo/vector-icons";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const fetchNotices = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const querySnapshot = await getDocs(
        query(
          collection(db, "notices"),
          where("isActive", "==", true),
          orderBy("date", "desc")
        )
      );

      const fetchedNotices = [];
      querySnapshot.forEach((doc) => {
        fetchedNotices.push({
          id: doc.id,
          ...doc.data(),
          displayDate: formatDate(doc.data().date),
        });
      });

      setNotices(fetchedNotices);
      setFilteredNotices(fetchedNotices);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching notices: ", error);
      setError("Failed to load notices. Please try again.");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      };
      return date.toLocaleDateString("en-US", options);
    } catch {
      return dateString;
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredNotices(notices);
    } else {
      const filtered = notices.filter(
        (notice) =>
          notice.title?.toLowerCase().includes(text.toLowerCase()) ||
          notice.notice?.toLowerCase().includes(text.toLowerCase()) ||
          notice.date?.includes(text)
      );
      setFilteredNotices(filtered);
    }
  };

  const handleRefresh = () => {
    fetchNotices(true);
  };

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    fetchNotices();
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-lg">Loading notices...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 justify-center items-center p-6">
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
          <Text className="text-gray-800 text-lg font-semibold mt-4 text-center">
            Oops! Something went wrong
          </Text>
          <Text className="text-gray-600 mt-2 text-center">{error}</Text>
          <TouchableOpacity
            onPress={retryFetch}
            className="bg-blue-600 px-6 py-3 rounded-xl mt-6 flex-row items-center"
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Fixed Header - No Gradient Issues */}
      <View className="bg-blue-600 p-6 pt-12 shadow-sm">
        <View className="flex-row items-center mb-4">
          <MaterialIcons name="notifications" size={28} color="white" />
          <Text className="text-white text-2xl font-bold ml-2">
            Notice Board
          </Text>
        </View>

        {/* Search Bar - Fixed Input Colors */}
        <View className="flex-row items-center bg-white/20 rounded-xl p-3 border border-white/30">
          <Feather name="search" size={20} color="white" />
          <TextInput
            className="flex-1 ml-3 text-white"
            placeholder="Search notices..."
            placeholderTextColor="#bfdbfe"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => handleSearch("")}
              activeOpacity={0.7}
            >
              <MaterialIcons name="clear" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      {filteredNotices.length === 0 ? (
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center items-center p-6">
            <MaterialIcons name="speaker-notes-off" size={64} color="#9ca3af" />
            <Text className="text-gray-600 text-lg font-semibold mt-4 text-center">
              {searchQuery ? "No notices found" : "No notices available"}
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              {searchQuery
                ? "Try searching with different keywords"
                : "Check back later for new announcements"}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Search Results Count */}
          {searchQuery !== "" && (
            <View className="mb-4 p-3 bg-blue-100 rounded-xl border border-blue-200">
              <Text className="text-blue-800 font-medium">
                Found {filteredNotices.length} notice
                {filteredNotices.length !== 1 ? "s" : ""}
                {searchQuery && ` for "${searchQuery}"`}
              </Text>
            </View>
          )}

          {/* Notices List */}
          {filteredNotices.map((notice, index) => (
            <View
              key={notice.id}
              className="bg-white p-6 mb-4 rounded-2xl shadow-sm border border-gray-100"
              style={{
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              {/* Notice Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-4">
                  {notice.title && (
                    <Text className="text-lg font-bold text-gray-800 mb-1">
                      {notice.title}
                    </Text>
                  )}
                  <View className="flex-row items-center">
                    <MaterialIcons name="event" size={16} color="#6b7280" />
                    <Text className="text-gray-600 ml-1 font-medium">
                      {notice.displayDate}
                    </Text>
                  </View>
                </View>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-600 text-xs font-semibold">
                    #{String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
              </View>

              {/* Notice Content */}
              <View className="bg-gray-50 p-4 rounded-xl">
                <Text className="text-gray-700 leading-6 text-base">
                  {notice.notice}
                </Text>
              </View>

              {/* Notice Footer */}
              {notice.createdBy && (
                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <MaterialIcons
                    name="account-circle"
                    size={16}
                    color="#9ca3af"
                  />
                  <Text className="text-gray-500 text-sm ml-1">
                    Posted by {notice.createdBy.name || "Admin"}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Footer Spacing */}
          <View className="h-4" />
        </ScrollView>
      )}
    </View>
  );
};

export default Notices;
