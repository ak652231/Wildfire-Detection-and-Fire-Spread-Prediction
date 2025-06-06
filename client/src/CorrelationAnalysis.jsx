import React from 'react';
import { 
    BarChart, 
    Bar, 
    Line,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    ResponsiveContainer,
    ComposedChart
} from 'recharts';

export default function CorrelationAnalysis({ currentData, historicalData }) {
    if (!historicalData || !currentData) {
        return (
            <div className="p-6 bg-gray-100 rounded-lg shadow-inner">
                <p className="text-gray-600 text-center font-semibold">
                    Historical comparison data not available for this location.
                </p>
            </div>
        );
    }

    const comparisonData = [
        {
            category: 'NBR',
            Historical: Number(historicalData.nbr),
            Current: Number(currentData.nbr),
            Change: Number((currentData.nbr - historicalData.nbr).toFixed(2))
        },
        {
            category: 'Temperature',
            Historical: Number(historicalData.temperature),
            Current: Number(currentData.temperature),
            Change: Number((currentData.temperature - historicalData.temperature).toFixed(2))
        },
        {
            category: 'Humidity',
            Historical: Number(historicalData.humidity),
            Current: Number(currentData.humidity),
            Change: Number((currentData.humidity - historicalData.humidity).toFixed(2))
        }
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800">{`${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value.toFixed(2)}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                    Environmental Conditions Comparison
                </h3>
                
                <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={comparisonData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 30
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Historical" fill="#8884d8" />
                            <Bar yAxisId="left" dataKey="Current" fill="#82ca9d" />
                            <Line yAxisId="right" type="monotone" dataKey="Change" stroke="#ff7300" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Analysis Date Comparison
                    </h4>
                    <div className="flex justify-between text-sm text-gray-600">
                        <p>Historical: {historicalData.date}</p>
                        <p>Current: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="mt-6 text-sm text-gray-600">
                    <p><strong>Note:</strong> NBR (Normalized Burn Ratio) values typically range from -1 to 1. The chart uses a secondary axis (right) to better visualize these small-scale changes.</p>
                </div>
            </div>
        </div>
    );
}