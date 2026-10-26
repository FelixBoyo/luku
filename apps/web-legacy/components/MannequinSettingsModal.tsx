import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { saveMannequinSettings } from '../store/slices/tryOnSlice';
import { MannequinSettings } from '../types';
import Button from './common/Button';

interface MannequinSettingsModalProps {
    onClose: () => void;
    currentSettings: MannequinSettings | null;
    userId: string;
}

const MannequinSettingsModal: React.FC<MannequinSettingsModalProps> = ({
    onClose,
    currentSettings,
    userId,
}) => {
    const dispatch = useAppDispatch();

    const [bodyType, setBodyType] = useState<MannequinSettings['body_type']>(
        currentSettings?.body_type || 'average'
    );
    const [height, setHeight] = useState(currentSettings?.height_cm || 170);
    const [chest, setChest] = useState<number | undefined>(
        currentSettings?.chest_cm
    );
    const [waist, setWaist] = useState<number | undefined>(
        currentSettings?.waist_cm
    );
    const [hips, setHips] = useState<number | undefined>(
        currentSettings?.hips_cm
    );
    const [skinTone, setSkinTone] = useState<MannequinSettings['skin_tone']>(
        currentSettings?.skin_tone || 'medium'
    );
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Validation function for measurements
    const validateMeasurements = (): string | null => {
        if (
            chest !== undefined &&
            chest !== null &&
            (chest < 70 || chest > 150)
        ) {
            return 'Chest measurement must be between 70-150cm';
        }
        if (
            waist !== undefined &&
            waist !== null &&
            (waist < 50 || waist > 130)
        ) {
            return 'Waist measurement must be between 50-130cm';
        }
        if (hips !== undefined && hips !== null && (hips < 70 || hips > 150)) {
            return 'Hips measurement must be between 70-150cm';
        }
        return null;
    };

    // Handle measurement changes with validation
    const handleMeasurementChange = (
        field: 'chest' | 'waist' | 'hips',
        value: string
    ) => {
        const numValue = value ? Number(value) : undefined;

        if (field === 'chest') setChest(numValue);
        if (field === 'waist') setWaist(numValue);
        if (field === 'hips') setHips(numValue);

        // Clear validation error when user starts typing
        setValidationError(null);
    };

    const handleSave = async () => {
        // Validate measurements before saving
        const error = validateMeasurements();
        if (error) {
            setValidationError(error);
            return;
        }

        setSaving(true);
        try {
            await dispatch(
                saveMannequinSettings({
                    userId,
                    settings: {
                        body_type: bodyType,
                        height_cm: height,
                        chest_cm: chest,
                        waist_cm: waist,
                        hips_cm: hips,
                        skin_tone: skinTone,
                    },
                })
            ).unwrap();
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                style={{ margin: 0 }}
            >
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Customize Your Mannequin
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Set your measurements for accurate outfit visualization
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Validation Error Banner */}
                    {validationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800 font-medium">
                                {validationError}
                            </p>
                        </div>
                    )}

                    {/* Body Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Body Type
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(
                                [
                                    'slim',
                                    'average',
                                    'athletic',
                                    'plus-size',
                                ] as const
                            ).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setBodyType(type)}
                                    className={`p-3 rounded-lg border-2 capitalize transition-all ${
                                        bodyType === type
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Height */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Height: {height}cm (
                            {Math.floor(height / 30.48 / 12)}'
                            {Math.round((height / 30.48) % 12)}")
                        </label>
                        <input
                            type="range"
                            min="140"
                            max="210"
                            value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>140cm (4'7")</span>
                            <span>210cm (6'11")</span>
                        </div>
                    </div>

                    {/* Measurements */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chest (cm){' '}
                                <span className="text-gray-500 text-xs">
                                    70-150
                                </span>
                            </label>
                            <input
                                type="number"
                                value={chest || ''}
                                onChange={(e) =>
                                    handleMeasurementChange(
                                        'chest',
                                        e.target.value
                                    )
                                }
                                placeholder="Optional"
                                min="70"
                                max="150"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    chest !== undefined &&
                                    (chest < 70 || chest > 150)
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Waist (cm){' '}
                                <span className="text-gray-500 text-xs">
                                    50-130
                                </span>
                            </label>
                            <input
                                type="number"
                                value={waist || ''}
                                onChange={(e) =>
                                    handleMeasurementChange(
                                        'waist',
                                        e.target.value
                                    )
                                }
                                placeholder="Optional"
                                min="50"
                                max="130"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    waist !== undefined &&
                                    (waist < 50 || waist > 130)
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300'
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hips (cm){' '}
                                <span className="text-gray-500 text-xs">
                                    70-150
                                </span>
                            </label>
                            <input
                                type="number"
                                value={hips || ''}
                                onChange={(e) =>
                                    handleMeasurementChange(
                                        'hips',
                                        e.target.value
                                    )
                                }
                                placeholder="Optional"
                                min="70"
                                max="150"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    hips !== undefined &&
                                    (hips < 70 || hips > 150)
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Skin Tone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Skin Tone
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {(
                                [
                                    'fair',
                                    'light',
                                    'medium',
                                    'tan',
                                    'brown',
                                    'dark',
                                ] as const
                            ).map((tone) => (
                                <button
                                    key={tone}
                                    onClick={() => setSkinTone(tone)}
                                    className={`p-3 rounded-lg border-2 capitalize transition-all ${
                                        skinTone === tone
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Tip:</strong> Optional measurements (chest,
                            waist, hips) help create more accurate
                            visualizations. Height and body type are used if
                            specific measurements aren't provided.
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !!validateMeasurements()}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MannequinSettingsModal;
