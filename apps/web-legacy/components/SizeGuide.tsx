import React, { useState } from 'react';

interface SizeGuideProps {
    category?: string;
    onClose?: () => void;
}

const SizeGuide: React.FC<SizeGuideProps> = ({ category, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState(category || 'Top');

    const sizeCharts = {
        Top: {
            sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            measurements: [
                { label: 'Chest (inches)', values: [32, 34, 36, 40, 44, 48] },
                { label: 'Waist (inches)', values: [26, 28, 30, 34, 38, 42] },
                { label: 'Length (inches)', values: [26, 27, 28, 29, 30, 31] },
            ],
        },
        Bottom: {
            sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            measurements: [
                { label: 'Waist (inches)', values: [26, 28, 30, 32, 36, 40] },
                { label: 'Hip (inches)', values: [34, 36, 38, 40, 44, 48] },
                { label: 'Inseam (inches)', values: [28, 29, 30, 31, 32, 33] },
            ],
        },
        Dress: {
            sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            measurements: [
                { label: 'Bust (inches)', values: [32, 34, 36, 38, 42, 46] },
                { label: 'Waist (inches)', values: [24, 26, 28, 30, 34, 38] },
                { label: 'Hip (inches)', values: [34, 36, 38, 40, 44, 48] },
                { label: 'Length (inches)', values: [36, 37, 38, 39, 40, 41] },
            ],
        },
        Shoes: {
            sizes: ['US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
            measurements: [
                { label: 'EU Size', values: [38, 39, 40, 41, 42, 43] },
                { label: 'UK Size', values: [5, 6, 7, 8, 9, 10] },
                { label: 'Length (cm)', values: [24, 25, 26, 27, 28, 29] },
            ],
        },
    };

    const chart = sizeCharts[selectedCategory as keyof typeof sizeCharts] || sizeCharts.Top;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Size Guide</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Category
                </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {Object.keys(sizeCharts).map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                                Size
                            </th>
                            {chart.sizes.map((size) => (
                                <th
                                    key={size}
                                    className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700"
                                >
                                    {size}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {chart.measurements.map((measurement, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                                    {measurement.label}
                                </td>
                                {measurement.values.map((value, valIndex) => (
                                    <td
                                        key={valIndex}
                                        className="border border-gray-300 px-4 py-2 text-center text-gray-600"
                                    >
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How to Measure</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Use a flexible measuring tape</li>
                    <li>Measure over undergarments</li>
                    <li>Keep the tape level and snug, not tight</li>
                    <li>For best fit, measure at the fullest part</li>
                </ul>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p>
                    <strong>Note:</strong> Sizes may vary by brand. If you're between sizes, we recommend sizing up.
                </p>
            </div>
        </div>
    );
};

export default SizeGuide;
