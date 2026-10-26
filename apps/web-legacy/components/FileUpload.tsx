import React, { useState, useRef, useCallback } from 'react';
import PlusIcon from './icons/PlusIcon';
import Button from './common/Button';
import OutfitPreviewModal from './OutfitPreviewModal';
import { detectOutfitItems } from '../services/geminiService';
import { cropImage } from '../utils/imageCropper';

interface FileUploadProps {
    onImagesUpload: (
        images: { base64Image: string; mimeType: string }[]
    ) => void;
    isLoading: boolean;
}

interface DetectedItem {
    itemName: string;
    category: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

const FileUpload: React.FC<FileUploadProps> = ({
    onImagesUpload,
    isLoading,
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [previewImage, setPreviewImage] = useState<{
        url: string;
        base64: string;
        mimeType: string;
    } | null>(null);
    const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
    const [pendingImages, setPendingImages] = useState<
        { base64Image: string; mimeType: string }[]
    >([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
        async (files: FileList) => {
            const imageFiles = Array.from(files).filter((file) =>
                file.type.startsWith('image/')
            );
            if (imageFiles.length === 0) return;

            const fileReadPromises = imageFiles.map((file) => {
                return new Promise<{ base64Image: string; mimeType: string }>(
                    (resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                                const base64String =
                                    reader.result.split(',')[1];
                                resolve({
                                    base64Image: base64String,
                                    mimeType: file.type,
                                });
                            } else {
                                reject(
                                    new Error(
                                        `Failed to read file: ${file.name}`
                                    )
                                );
                            }
                        };
                        reader.onerror = (error) => reject(error);
                        reader.readAsDataURL(file);
                    }
                );
            });

            try {
                const imageData = await Promise.all(fileReadPromises);

                // For single image uploads, check if it has multiple items
                if (imageData.length === 1) {
                    setIsDetecting(true);
                    const detection = await detectOutfitItems(
                        imageData[0].base64Image,
                        imageData[0].mimeType
                    );

                    if (
                        detection.hasMultipleItems &&
                        detection.items.length >= 2
                    ) {
                        // Show preview modal
                        setPreviewImage({
                            url: `data:${imageData[0].mimeType};base64,${imageData[0].base64Image}`,
                            base64: imageData[0].base64Image,
                            mimeType: imageData[0].mimeType,
                        });
                        setDetectedItems(detection.items);
                        setPendingImages(imageData);
                        setIsDetecting(false);
                        return;
                    }
                }

                // Multiple images or single item - upload directly
                onImagesUpload(imageData);
            } catch (error) {
                console.error('Error processing files:', error);
                // On error, just upload normally
                Promise.all(fileReadPromises)
                    .then((imageData) => {
                        onImagesUpload(imageData);
                    })
                    .catch((err) => {
                        console.error('Error reading files:', err);
                    });
            } finally {
                setIsDetecting(false);
            }
        },
        [onImagesUpload]
    );

    const handleConfirmSeparate = async () => {
        if (!previewImage) return;

        setIsDetecting(true);
        try {
            // Crop each item and create separate images
            const croppedImages = await Promise.all(
                detectedItems.map((item) =>
                    cropImage(
                        previewImage.base64,
                        previewImage.mimeType,
                        item.boundingBox
                    )
                )
            );

            // Upload the separated items
            onImagesUpload(croppedImages);
            handleCloseModal();
        } catch (error) {
            console.error('Error separating items:', error);
            // Fallback to single upload on error
            onImagesUpload(pendingImages);
            handleCloseModal();
        } finally {
            setIsDetecting(false);
        }
    };

    const handleConfirmSingle = () => {
        // Upload as single item
        onImagesUpload(pendingImages);
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setPreviewImage(null);
        setDetectedItems([]);
        setPendingImages([]);
        setIsDetecting(false);
    };

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                dragActive
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 bg-white'
            }`}
        >
            <input
                ref={inputRef}
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleChange}
                disabled={isLoading || isDetecting}
                multiple
            />
            <div className="flex flex-col items-center space-y-4">
                <div className="bg-indigo-100 rounded-full p-3">
                    <PlusIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="text-gray-600">
                    <span
                        className="font-semibold text-indigo-600 cursor-pointer"
                        onClick={onButtonClick}
                    >
                        Click to upload files
                    </span>{' '}
                    or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                <Button
                    onClick={onButtonClick}
                    isLoading={isLoading || isDetecting}
                    disabled={isLoading || isDetecting}
                    variant="secondary"
                >
                    {isDetecting
                        ? 'Detecting items...'
                        : isLoading
                        ? 'Analyzing...'
                        : 'Add Items'}
                </Button>
            </div>

            {previewImage !== null && detectedItems.length > 0 && (
                <OutfitPreviewModal
                    imageUrl={previewImage.url}
                    detectedItems={detectedItems}
                    onConfirmSeparate={handleConfirmSeparate}
                    onConfirmSingle={handleConfirmSingle}
                    onCancel={handleCloseModal}
                    isProcessing={isDetecting}
                />
            )}
        </div>
    );
};

export default FileUpload;
