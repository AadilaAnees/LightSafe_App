import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Polygon, Circle } from 'react-native-svg';

export default function LightSafeLogo({ size = 160, showText = true }) {
  // Brand Color Palette matching your LightSafe app theme
  const TEAL = '#3A7D7C';  // Safety / Trust / SOS primary
  const ROSE = '#D44D5C';  // Sisterhood / Care / Primary Red-Pink
  const LIGHT_ROSE = '#FCE7F3';

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        {/* Background Subtle Glow Circle */}
        <Circle cx="100" cy="100" r="90" fill={LIGHT_ROSE} opacity={0.3} />

        {/* Outer Interlocking Hands Forming Heart Outer Contour */}
        <G>
          {/* Left Teal Hand Contour */}
          <Path
            d="M98 165 C85 155 40 120 35 80 C30 50 55 30 78 42 C92 50 98 62 98 62 C98 62 102 52 110 46 C100 42 85 38 72 45 C50 56 42 85 58 115 C70 138 92 155 98 165 Z"
            fill={TEAL}
          />
          {/* Left Hand Fingers Sweeping Inward */}
          <Path
            d="M45 85 C42 100 55 125 95 155 C90 148 70 128 62 110 C55 95 52 82 45 85 Z"
            fill={TEAL}
          />

          {/* Right Rose Hand Contour Interlocking */}
          <Path
            d="M102 165 C115 155 160 120 165 80 C170 50 145 30 122 42 C108 50 102 62 102 62 C102 62 98 52 90 46 C100 42 115 38 128 45 C150 56 158 85 142 115 C130 138 108 155 102 165 Z"
            fill={ROSE}
          />
          {/* Right Hand Fingers Sweeping Inward */}
          <Path
            d="M155 85 C158 100 145 125 105 155 C110 148 130 128 138 110 C145 95 148 82 155 85 Z"
            fill={ROSE}
          />
        </G>

        {/* Center Protection Shield Outline */}
        <Path
          d="M100 60 L128 72 V100 C128 118 115 132 100 138 C85 132 72 118 72 100 V72 L100 60 Z"
          fill="none"
          stroke={TEAL}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Spark / Light Beacon */}
        <G>
          {/* Main 4-point Spark Star */}
          <Path
            d="M100 80 L103 93 L116 96 L103 99 L100 112 L97 99 L84 96 L97 93 Z"
            fill={ROSE}
          />
          {/* Diagonal Light Rays */}
          <Circle cx="90" cy="86" r="2" fill={ROSE} />
          <Circle cx="110" cy="86" r="2" fill={ROSE} />
          <Circle cx="90" cy="106" r="2" fill={ROSE} />
          <Circle cx="110" cy="106" r="2" fill={ROSE} />
        </G>
      </Svg>

      {/* Matching Typography */}
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.brandText, { color: TEAL }]}>Light</Text>
          <Text style={[styles.brandText, { color: ROSE }]}>Safe</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justify: 'center',
  },
  textRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});