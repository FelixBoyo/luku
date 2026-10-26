import React, { useState } from 'react';
import { Product } from '../types';
import { uploadProductImage } from '../services/imageService';
import Button from './common/Button';
import Spinner from './common/Spinner';

interface ProductFormProps {
    product?: Product;
    businessId: string;
    onSubmit: (productData: any) => Promise<void>;
    onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
    product,
    businessId,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || 0,
        category: product?.category || '',
        color: product?.color || '',
        style: product?.style || '',
        season: product?.season || '',
        size: product?.size || '',
        stock_quantity: product?.stock_quantity || 0,
        is_featured: product?.is_featured || false,
        is_active: product?.is_active !== undefined ? product.is_active : true,
        tags: (product as any)?.tags || [],
    });
    const [tagInput, setTagInput] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>(product?.image_urls || []);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>((product as any)?.tags || []);

    const categories = [
        'Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessories', 'Bag', 'Jewelry',
    ];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'];
    const styles = [
        'Casual', 'Formal', 'Sporty', 'Vintage', 'Bohemian', 'Minimalist', 'Streetwear', 'Classic',
    ];

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
            [name]: name === 'price' || name === 'stock_quantity' ? Number(value) : value,
        }));
    };

    const handleImageUrlsChange = (urls: string[]) => {
        setImageUrls(urls);
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(file => uploadProductImage(file, businessId));
            const uploadedUrls = await Promise.all(uploadPromises);
            setImageUrls(prev => [...prev, ...uploadedUrls]);
        } catch (err: any) {
            setError(err.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (imageUrls.length === 0) {
            setError('Please add at least one product image');
            return;
        }

        setUploading(true);
        try {
            await onSubmit({
                ...formData,
                image_urls: imageUrls,
                tags: tags,
            });
        } catch (err: any) {
            setError(err.message || 'Failed to save product');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        min="0"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select size</option>
                        {sizes.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Style <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="style"
                        value={formData.style}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select style</option>
                        {styles.map((style) => (
                            <option key={style} value={style}>
                                {style}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Season <span className="text-red-500">*</span>
                </label>
                <select
                    name="season"
                    value={formData.season}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">Select season</option>
                    {seasons.map((season) => (
                        <option key={season} value={season}>
                            {season}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Product Images ({imageUrls.length}/5)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md border border-gray-300"
                            />
                            <button
                                type="button"
                                onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {imageUrls.length < 5 && (
                        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-indigo-500 transition-colors">
                            <div className="text-center">
                                {uploading ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="mt-2 block text-sm text-gray-600">Add Image</span>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileInput}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (for better searchability)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                className="text-indigo-700 hover:text-indigo-900"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = tagInput.trim();
                                if (trimmed && !tags.includes(trimmed)) {
                                    setTags([...tags, trimmed]);
                                    setTagInput('');
                                }
                            }
                        }}
                        placeholder="Add a tag and press Enter"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            const trimmed = tagInput.trim();
                            if (trimmed && !tags.includes(trimmed)) {
                                setTags([...tags, trimmed]);
                                setTagInput('');
                            }
                        }}
                    >
                        Add Tag
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Feature this product</span>
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active listing</span>
                </label>
            </div>

            <div className="flex justify-end space-x-4">
                <Button type="button" onClick={onCancel} variant="secondary">
                    Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                    {uploading ? <Spinner /> : product ? 'Update Product' : 'Create Product'}
                </Button>
            </div>
        </form>
    );
};

export default ProductForm;

