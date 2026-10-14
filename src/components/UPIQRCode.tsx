import React, { useMemo } from 'react';
import { generateQRMatrix } from '../utils/qrMatrix';

interface UPIQRCodeProps {
  upiUri: string;
  size?: number;
  payeeName?: string;
  vpa?: string;
  amount?: number;
}

export function UPIQRCode({
  upiUri,
  size = 220,
  payeeName,
  vpa,
  amount,
}: UPIQRCodeProps) {
  const matrix = useMemo(() => {
    try {
      return generateQRMatrix(upiUri);
    } catch (e) {
      console.warn('Failed to generate offline QR matrix', e);
      return null;
    }
  }, [upiUri]);

  const numModules = matrix ? matrix.length : 29;
  const quietZone = 3;
  const totalModules = numModules + quietZone * 2;
  const cellSize = size / totalModules;

  return (
    <div className="flex flex-col items-center bg-white rounded-2xl p-5 border border-emerald-100 shadow-md text-center max-w-[320px] mx-auto select-none">
      {payeeName && (
        <div className="mb-3 text-center">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate max-w-[260px]">
            {payeeName}
          </h3>
          {vpa && (
            <p className="text-xs font-semibold text-slate-500 truncate max-w-[260px]">
              UPI ID: {vpa}
            </p>
          )}
        </div>
      )}

      {/* SVG QR Code */}
      <div className="relative rounded-xl overflow-hidden bg-white p-1 border border-slate-100">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
        >
          <rect width={size} height={size} fill="#FFFFFF" />

          {matrix &&
            matrix.map((row, r) =>
              row.map((isDark, c) => {
                if (!isDark) return null;
                const x = (c + quietZone) * cellSize;
                const y = (r + quietZone) * cellSize;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x}
                    y={y}
                    width={cellSize + 0.3}
                    height={cellSize + 0.3}
                    fill="#0F172A"
                    rx={cellSize > 5 ? 1 : 0}
                  />
                );
              })
            )}

          {/* Central UPI Logo Badge */}
          <g transform={`translate(${size / 2 - 16}, ${size / 2 - 16})`}>
            <rect
              x={0}
              y={0}
              width={32}
              height={32}
              rx={8}
              fill="#FFFFFF"
              stroke="#087F5B"
              strokeWidth={2}
            />
            {/* Rupee Symbol */}
            <path
              d="M10 9h12M10 13h12M10 17h5a3.5 3.5 0 0 0 3.5-3.5M15 17l6 7"
              stroke="#087F5B"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Amount Pill */}
      {amount && amount > 0 ? (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-1.5 text-center">
          <span className="block text-[10px] font-bold text-emerald-800 tracking-wider">AMOUNT TO PAY</span>
          <span className="text-xl font-black text-emerald-700">₹{amount.toLocaleString('en-IN')}</span>
        </div>
      ) : (
        <div className="mt-3 bg-slate-100 rounded-lg px-3 py-1 text-slate-600 text-xs font-semibold">
          Scan with any UPI app
        </div>
      )}

      {/* Partners Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 w-full text-center">
        <p className="text-[10px] font-bold tracking-wide text-slate-400">
          GPay · PhonePe · Paytm · BHIM · CRED
        </p>
      </div>
    </div>
  );
}
