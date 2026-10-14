import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, G, Circle, Path } from 'react-native-svg';
import { generateQRMatrix } from '@/utils/qrMatrix';
import { useApp } from '@/context/AppContext';

interface UPIQRCodeProps {
  upiUri: string;
  size?: number;
  payeeName?: string;
  vpa?: string;
  amount?: number;
}

export function UPIQRCode({
  upiUri,
  size = 230,
  payeeName,
  vpa,
  amount,
}: UPIQRCodeProps) {
  const { colors } = useApp();

  const matrix = useMemo(() => {
    try {
      return generateQRMatrix(upiUri);
    } catch (e) {
      console.warn('Failed to generate offline QR matrix, using fallback', e);
      return null;
    }
  }, [upiUri]);

  const numModules = matrix ? matrix.length : 29;
  const quietZone = 3; // Standard quiet zone
  const totalModules = numModules + quietZone * 2;
  const cellSize = size / totalModules;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      {/* Merchant Header */}
      {payeeName ? (
        <View style={styles.header}>
          <Text style={styles.payeeName} numberOfLines={1}>
            {payeeName}
          </Text>
          {vpa ? (
            <Text style={styles.vpaText} numberOfLines={1}>
              UPI ID: {vpa}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* SVG QR Code */}
      <View style={[styles.qrWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* White background */}
          <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />

          {/* QR Modules */}
          {matrix ? (
            <G>
              {matrix.map((row, r) =>
                row.map((isDark, c) => {
                  if (!isDark) return null;
                  const x = (c + quietZone) * cellSize;
                  const y = (r + quietZone) * cellSize;
                  return (
                    <Rect
                      key={`${r}-${c}`}
                      x={x}
                      y={y}
                      width={cellSize + 0.3} // Tiny overlap avoids rendering slivers
                      height={cellSize + 0.3}
                      fill="#111827"
                      rx={cellSize > 5 ? 1 : 0}
                    />
                  );
                })
              )}
            </G>
          ) : null}

          {/* Central UPI Logo Badge */}
          <G transform={`translate(${size / 2 - 18}, ${size / 2 - 18})`}>
            <Rect
              x={0}
              y={0}
              width={36}
              height={36}
              rx={9}
              fill="#FFFFFF"
              stroke="#087F5B"
              strokeWidth={2}
            />
            {/* Rupee Symbol */}
            <Path
              d="M12 11h12M12 15h12M12 19h5a4 4 0 0 0 4-4M17 19l6 8"
              stroke="#087F5B"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        </Svg>
      </View>

      {/* Amount Pill */}
      {amount && amount > 0 ? (
        <View style={styles.amountPill}>
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
        </View>
      ) : (
        <View style={styles.scanNotice}>
          <Text style={styles.scanNoticeText}>Scan with any UPI app</Text>
        </View>
      )}

      {/* Supported UPI Partners footer */}
      <View style={styles.footer}>
        <Text style={styles.partnerText}>GPay · PhonePe · Paytm · BHIM · CRED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
  },
  header: {
    alignItems: 'center',
    gap: 2,
  },
  payeeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  vpaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  amountPill: {
    backgroundColor: '#DDF7EA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#087F5B22',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#07533F',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#07533F',
    letterSpacing: -0.5,
  },
  scanNotice: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scanNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  partnerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
});
