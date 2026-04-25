import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { PhotoPicker, SelectedPhoto } from './PhotoPicker';

interface Review {
  rating: number;
  text: string;
  photos: SelectedPhoto[];
  trailId: string;
  trailName: string;
}

interface ReviewFormProps {
  trailId: string;
  trailName: string;
  onReviewSubmit: (review: Review) => Promise<void>;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  trailId,
  trailName,
  onReviewSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please select a rating before submitting');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Missing Review', 'Please write a review before submitting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const review: Review = {
        rating,
        text: reviewText.trim(),
        photos: selectedPhotos,
        trailId,
        trailName,
      };

      await onReviewSubmit(review);

      // Reset form
      setRating(0);
      setReviewText('');
      setSelectedPhotos([]);

      Alert.alert('Success', '✅ Your review has been posted!');
      onCancel();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const isValid = rating > 0 && reviewText.trim().length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Trail</Text>
        <TouchableOpacity onPress={onCancel} disabled={loading}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Trail Info */}
        <View style={styles.trailInfo}>
          <Text style={styles.trailLabel}>Trail</Text>
          <Text style={styles.trailName}>{trailName}</Text>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating *</Text>
          <Text style={styles.ratingLabel}>How was your experience?</Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => setRating(star)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating ? styles.starFilled : styles.starEmpty,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <View style={styles.ratingDescriptionContainer}>
              <Text style={styles.ratingDescription}>
                {rating === 1 && '😔 Not recommended'}
                {rating === 2 && '😕 Below average'}
                {rating === 3 && '😐 Average'}
                {rating === 4 && '😊 Good experience'}
                {rating === 5 && '🤩 Loved it!'}
              </Text>
            </View>
          )}
        </View>

        {/* Review Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review *</Text>
          <Text style={styles.textHint}>
            Share what you liked, trail conditions, wildlife, or any tips for other hikers
          </Text>

          <TextInput
            style={[styles.textInput, error && styles.inputError]}
            placeholder="Write your review here... (minimum 10 characters)"
            placeholderTextColor="#999"
            value={reviewText}
            onChangeText={(text) => {
              setReviewText(text);
              setError(null);
            }}
            editable={!loading}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />

          <View style={styles.characterCount}>
            <Text style={styles.characterText}>
              {reviewText.length}/500 characters
            </Text>
            {reviewText.trim().length < 10 && reviewText.length > 0 && (
              <Text style={styles.characterWarning}>
                (At least 10 characters required)
              </Text>
            )}
          </View>
        </View>

        {/* Photo Picker */}
        <View style={styles.section}>
          <PhotoPicker
            onPhotosSelected={setSelectedPhotos}
            maxPhotos={5}
            onError={(error) => setError(error.message)}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, loading && styles.buttonDisabled]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              (!isValid || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>✓ Post Review</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            ℹ️ Reviews help the community. Be honest and constructive. Reviews should be about your
            personal experience on this trail.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trailInfo: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  trailLabel: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
    fontWeight: '600',
  },
  trailName: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 6,
  },
  star: {
    fontSize: 32,
  },
  starFilled: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: '#d1d5db',
  },
  ratingDescriptionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    alignItems: 'center',
  },
  ratingDescription: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
  },
  textHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  characterCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  characterText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  characterWarning: {
    fontSize: 12,
    color: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  helpContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
});
