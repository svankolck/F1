'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AvatarUploadProps {
    userId: string;
    onUpload: (url: string) => void;
}

export default function AvatarUpload({ userId, onUpload }: AvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleUpload = useCallback(async (file: File) => {
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) return;
        if (file.size > 2 * 1024 * 1024) return; // 2MB max

        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Upload failed:', uploadError);
            return;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Add cache-buster to force refresh
        const url = `${data.publicUrl}?t=${Date.now()}`;

        // Update profile
        await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', userId);

        onUpload(url);
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
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-f1-red flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
                title="Foto uploaden"
            >
                <span className="material-icons text-sm text-white">photo_camera</span>
            </button>
        </>
    );
}
