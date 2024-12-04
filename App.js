import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [detectionResults, setDetectionResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri); // Save the image URI
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

const uploadImage = async () => {
  if (!image) {
    Alert.alert("No Image", "Please take an image first.");
    return;
  }

  setLoading(true);
  setDetectionResults([]);

  const formData = new FormData();
  formData.append("file", {
    uri: image,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  try {
    const response = await axios.post("http://192.168.0.118:5000/detect", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = response.data;
    setDetectionResults(data.detections);

    if (data.image_url) {
      // Set processed image
      setImage(`http://192.168.0.118:5000/${data.image_url}`);
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    Alert.alert("Error", "Failed to upload image.");
  } finally {
    setLoading(false);
  }
};


  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Object Detection App</Text>
      <TouchableOpacity style={styles.button} onPress={takePicture}>
        <Text style={styles.buttonText}>Take Picture</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {image && (
        <TouchableOpacity style={styles.button} onPress={uploadImage}>
          <Text style={styles.buttonText}>Detect Objects</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {detectionResults.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.subtitle}>Detections:</Text>
          {detectionResults.map((det, index) => (
            <Text key={index}>
              {det.name} ({Math.round(det.confidence * 100)}%) - Box: ({det.x1},{" "}
              {det.y1}) to ({det.x2}, {det.y2})
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    marginVertical: 20,
  },
  results: {
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
