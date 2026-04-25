import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface SelectedPhoto {
  id: string;
  uri: string;
  type: 'photo' | 'gallery';
  size?: number;
}

interface PhotoPickerProps {
  onPhotosSelected: (photos: SelectedPhoto[]) => void;
  maxPhotos?: number;
  onError?: (error: Error) => void;
}

const { width } = Dimensions.get('window');
const photoSize = (width - 48) / 3;

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  onPhotosSelected,
  maxPhotos = 5,
  onError,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [galleryPermission, setGalleryPermission] = useState<boolean | null>(null);

  React.useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus.granted);

      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setGalleryPermission(galleryStatus.granted);
    } catch (err) {
      console.error('Failed to check permissions:', err);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert(
        'Camera Permission',
        'OpenTrails needs camera access to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: checkPermissions },
        ]
      );
      return;
    }

    if (selectedPhotos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0] as any;
        const newPhoto: SelectedPhoto = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'photo',
          size: asset.fileSize,
        };
        const updated = [...selectedPhotos, newPhoto];
        setSelectedPhotos(updated);
        onPhotosSelected(updated);
      }
    } catch (err: any) {
      const error = new Error(`Failed to take photo: ${err.message}`);
      onError?.(error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (!galleryPermission) {
      Alert.alert(
        'Gallery Permission',
        'OpenTrails needs access to your photo library.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: checkPermissions },
        ]
      );
      return;
    }

    if (selectedPhotos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        const remaining = maxPhotos - selectedPhotos.length;
        const newPhotos = result.assets.slice(0, remaining).map((asset: any) => ({
          id: Date.now().toString() + Math.random(),
          uri: asset.uri,
          type: 'gallery' as const,
          size: asset.fileSize,
        }));

        const updated = [...selectedPhotos, ...newPhotos];
        setSelectedPhotos(updated);
        onPhotosSelected(updated);

        if (updated.length >= maxPhotos) {
          Alert.alert('Photo Limit Reached', `You've reached the maximum of ${maxPhotos} photos.`);
        }
      }
    } catch (err: any) {
      const error = new Error(`Failed to pick photos: ${err.message}`);
      onError?.(error);
      Alert.alert('Error', 'Failed to pick photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    const updated = selectedPhotos.filter((p) => p.id !== photoId);
    setSelectedPhotos(updated);
    onPhotosSelected(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos ({selectedPhotos.length}/{maxPhotos})</Text>

      {/* Photo Selection Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            loading && styles.buttonDisabled,
            selectedPhotos.length >= maxPhotos && styles.buttonDisabled,
          ]}
          onPress={handleTakePhoto}
          disabled={loading || selectedPhotos.length >= maxPhotos}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>📸</Text>
              <Text style={styles.buttonText}>Take Photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            loading && styles.buttonDisabled,
            selectedPhotos.length >= maxPhotos && styles.buttonDisabled,
          ]}
          onPress={handlePickFromGallery}
          disabled={loading || selectedPhotos.length >= maxPhotos}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🖼️</Text>
              <Text style={styles.buttonText}>From Gallery</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Selected Photos Grid */}
      {selectedPhotos.length > 0 && (
        <View>
          <Text style={styles.selectedTitle}>Selected Photos</Text>
          <View style={styles.photosGrid}>
            {selectedPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(photo.id)}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Photos help other hikers identify trails and current conditions. Include scenic views,
          wildlife, or trail markers.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoItem: {
    width: photoSize,
    height: photoSize,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  removeIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
});
