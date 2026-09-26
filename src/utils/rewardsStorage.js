import AsyncStorage from '@react-native-async-storage/async-storage';

const KINDNESS_POINTS_KEY = '@lightsafe_kindness_points';
const DEFAULT_POINTS = 380;

/**
 * Gets the current total kindness points.
 */
export async function getKindnessPoints() {
  try {
    const val = await AsyncStorage.getItem(KINDNESS_POINTS_KEY);
    if (val !== null) {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? DEFAULT_POINTS : parsed;
    }
    return DEFAULT_POINTS;
  } catch (err) {
    console.warn('Error reading kindness points:', err);
    return DEFAULT_POINTS;
  }
}

/**
 * Adds points to the user's total kindness points and returns the new total.
 */
export async function addKindnessPoints(pointsToAdd = 50) {
  try {
    const current = await getKindnessPoints();
    const updated = current + pointsToAdd;
    await AsyncStorage.setItem(KINDNESS_POINTS_KEY, updated.toString());
    return updated;
  } catch (err) {
    console.warn('Error saving kindness points:', err);
    return DEFAULT_POINTS + pointsToAdd;
  }
}
