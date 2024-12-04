import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 }); // Original image size

  const screenWidth = Dimensions.get('window').width; // Get device screen width
  const maxImageWidth = screenWidth * 0.9; // Scale image to 90% of screen width

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'You need to grant permission to access the media library.'
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;

        // Use Image.getSize to retrieve image dimensions
        Image.getSize(
          uri,
          (width, height) => {
            setImageSize({ width, height }); // Save dimensions
            setImage(uri); // Save image URI
          },
          (error) => {
            console.error('Error getting image size:', error);
          }
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };


  const uploadImage = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', {
      uri: image,
      name: 'image.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await axios.post('http://192.168.0.118:5000/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data); // Save detection results
    } catch (error) {
      console.error(error);
      setResult({ error: 'Error detecting objects' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate scaling factors for the image
  const scaleFactor = imageSize.width > maxImageWidth
    ? maxImageWidth / imageSize.width
    : 1;
  const scaledImageWidth = imageSize.width * scaleFactor;
  const scaledImageHeight = imageSize.height * scaleFactor;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Object Detection App</Text>
      <Button title="Pick an image from gallery" onPress={pickImage} />
      {image && (
        <View>
          <View style={[styles.imageContainer, { width: scaledImageWidth, height: scaledImageHeight }]}>
            <Image
              source={{ uri: image }}
              style={{ width: scaledImageWidth, height: scaledImageHeight }}
            />
            {result &&
              result.map((box, index) => (
                <View
                  key={index}
                  style={[
                    styles.box,
                    {
                      left: box.x1 * scaleFactor, // Scale the bounding box coordinates
                      top: box.y1 * scaleFactor,
                      width: (box.x2 - box.x1) * scaleFactor,
                      height: (box.y2 - box.y1) * scaleFactor,
                    },
                  ]}
                >
                  <Text style={styles.label}>{`${box.name} (${Math.round(
                    box.confidence * 100
                  )}%)`}</Text>
                </View>
              ))}
          </View>
          <Button title="Detect Objects" onPress={uploadImage} />
        </View>
      )}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {result && !loading && (
        <View style={styles.result}>
          <Text style={styles.resultText}>Detection Results (JSON):</Text>
          <Text>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  box: {
    position: 'absolute',
    borderColor: 'red',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  label: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  result: {
    marginTop: 20,
  },
  resultText: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
