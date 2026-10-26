import React from 'react';

interface PriceRangeSliderProps {
    min: number;
    max: number;
    value: { min: number; max: number };
    onChange: (value: { min: number; max: number }) => void;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
    min,
    max,
    value,
    onChange,
}) => {
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), value.max);
        onChange({ min: newMin, max: value.max });
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), value.min);
        onChange({ min: value.min, max: newMax });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>${value.min}</span>
                <span>${value.max}</span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value.min}
                    onChange={handleMinChange}
                    className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                        background: `linear-gradient(to right, 
                            #4f46e5 0%, 
                            #4f46e5 ${((value.min - min) / (max - min)) * 100}%, 
                            #e5e7eb ${((value.min - min) / (max - min)) * 100}%, 
                            #e5e7eb 100%)`
                    }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value.max}
                    onChange={handleMaxChange}
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider"
                    style={{
                        background: `linear-gradient(to right, 
                            transparent 0%, 
                            transparent ${((value.max - min) / (max - min)) * 100}%, 
                            #4f46e5 ${((value.max - min) / (max - min)) * 100}%, 
                            #4f46e5 100%)`
                    }}
                />
            </div>
            <div className="flex gap-2">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value.min}
                    onChange={handleMinChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Min"
                />
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value.max}
                    onChange={handleMaxChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Max"
                />
            </div>
        </div>
    );
};

export default PriceRangeSlider;
