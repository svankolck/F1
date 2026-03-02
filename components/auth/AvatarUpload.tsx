'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AvatarUploadProps {
    userId: string;
    onUpload: (url: string) => void;
}

export default function AvatarUpload({ userId, onUpload }: AvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = useCallback(async (file: File) => {
        if (!file) return;
        setError(null);

        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Max file size is 2MB.');
            return;
        }

        setUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop() || 'jpg';
            const filePath = `${userId}/avatar.${fileExt}`;

            // Step 1: Upload file
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Avatar upload error:', uploadError);
                setError(`Upload failed: ${uploadError.message}`);
                setUploading(false);
                return;
            }

            // Step 2: Get public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const url = `${data.publicUrl}?t=${Date.now()}`;

            // Step 3: Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('id', userId);

            if (updateError) {
                console.error('Profile update error:', updateError);
                setError('Photo uploaded but profile update failed.');
                setUploading(false);
                return;
            }

            onUpload(url);
        } catch (err) {
            console.error('Avatar upload exception:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setUploading(false);
            // Reset file input so the same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [userId, onUpload]);

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                }}
            />
            <button
                onClick={() => {
                    setError(null);
                    fileInputRef.current?.click();
                }}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-f1-red flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                title="Upload photo"
            >
                {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <span className="material-icons text-sm text-white">photo_camera</span>
                )}
            </button>
            {error && (
                <p
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-red-400 text-[11px] text-center w-48 leading-tight"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </>
    );
}
