# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Firebase
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Expo Location & Task Manager
-keep class expo.modules.location.** { *; }
-keep class expo.modules.taskmanager.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Mapbox
-keep class com.mapbox.** { *; }
-keep class com.rnmapbox.** { *; }
-dontwarn com.mapbox.**

# Hermes Engine - Prevent type casting issues
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.bridge.ReadableNativeMap { *; }
-keep class com.facebook.react.bridge.WritableNativeMap { *; }

# Expo modules - Prevent Hermes optimization issues
-keep class expo.modules.** { *; }
-keepclassmembers class expo.modules.** { *; }

# Add any project specific keep options here:
