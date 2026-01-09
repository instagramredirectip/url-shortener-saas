import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

const AnalyticsCard = ({ data, shortUrl }) => {
  return (
    <div className="mt-6 p-6 bg-white rounded-xl border border-gray-100 shadow-inner">
      <div className="grid md:grid-cols-2 gap-10">
        
        {/* Left: Chart Section */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            Performance (Last 7 Days)
          </h4>
          <div className="h-48 w-full">
            {data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#4F46E5" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <span className="text-sm">No clicks yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: QR Code Section */}
        <div className="flex flex-col items-center justify-center md:border-l md:border-gray-100 md:pl-10">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 self-start w-full text-center md:text-left">
            Scan to Visit
          </h4>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <QRCodeSVG value={shortUrl} size={140} level="H" />
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">
            Right-click the QR code to save it
          </p>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsCard;