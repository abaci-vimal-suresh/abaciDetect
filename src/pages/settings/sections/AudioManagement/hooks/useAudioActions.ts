import { useAddSoundFile, useDeleteSoundFile } from '../../../../../api/sensors.api';
import Swal from 'sweetalert2';
import useDarkMode from '../../../../../hooks/useDarkMode';

export function useAudioActions() {
    const { darkModeStatus } = useDarkMode();

    // ── Mutations ────────────────────────────────────────────────────────────
    const addSoundMutation = useAddSoundFile();
    const deleteSoundMutation = useDeleteSoundFile();

    // ── Swal Theme ───────────────────────────────────────────────────────────
    const swalTheme = {
        background: darkModeStatus ? '#1a1a1a' : '#fff',
        color: darkModeStatus ? '#fff' : '#000',
    };

    // ── Handlers ─────────────────────────────────────────────────────────────

    // Upload Sound File
    const handleUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        onDone?: () => void,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.wav')) {
            Swal.fire({
                title: 'Invalid File Type',
                text: 'Please upload a .wav file only.',
                icon: 'error',
                ...swalTheme,
            });
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        addSoundMutation.mutate(formData, {
            onSuccess: () => {
                e.target.value = '';
                onDone?.();
            },
            onError: () => {
                Swal.fire({
                    title: 'Upload Failed',
                    text: 'Failed to upload the sound file. Please try again.',
                    icon: 'error',
                    ...swalTheme,
                });
            },
        });
    };

    // Delete Sound File (Swal confirm — same pattern as useAreaActions / useUserActions)
    const handleDeleteSound = (sound: { id: number; name: string }) => {
        Swal.fire({
            title: 'Delete Sound File?',
            text: `Are you sure you want to delete "${sound.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2',
            },
            ...swalTheme,
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSoundMutation.mutate(sound.id, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Sound file has been deleted.',
                            icon: 'success',
                            ...swalTheme,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to delete sound file. Please try again.',
                            icon: 'error',
                            ...swalTheme,
                        });
                    },
                });
            }
        });
    };

    return {
        // Mutations (for loading / pending states)
        addSoundMutation,
        deleteSoundMutation,

        // Handlers
        handleUpload,
        handleDeleteSound,

        // Utils
        darkModeStatus,
        swalTheme,
    };
}
