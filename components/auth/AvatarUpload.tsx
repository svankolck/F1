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
    const supabase = createClient();

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
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                setError(uploadError.message);
                return;
            }

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const url = `${data.publicUrl}?t=${Date.now()}`;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('id', userId);

            if (updateError) {
                setError('Photo uploaded, but profile update failed.');
                return;
            }

            onUpload(url);
        } catch {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [userId, supabase, onUpload]);

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                }}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
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
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                    {error}
                </div>
            )}
        </>
    );
}
