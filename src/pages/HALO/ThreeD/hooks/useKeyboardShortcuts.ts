/**
 * Keyboard Shortcuts Hook
 * 
 * Purpose: Fixes Issue #9 (limited keyboard shortcuts)
 * 
 * Problem:
 * - Only ESC key works
 * - Power users want Ctrl+S, Ctrl+Z, Delete, etc.
 * - Slow workflow
 * 
 * Solution:
 * - Comprehensive keyboard shortcut system
 * - Platform-aware (Ctrl vs Cmd)
 * - Customizable handlers
 */

import { useEffect, useCallback, useRef } from 'react';

// ============================================
// HANDLER TYPES
// ============================================

export interface ShortcutHandlers {
    onSave?: () => void;
    onCancel?: () => void;
    onEscape?: () => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onToggleDrawMode?: () => void;
    onSelectAll?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onDuplicate?: () => void;
    onHelp?: () => void;
}

export interface ShortcutOptions {
    /**
     * Enable shortcuts globally or only when specific element is focused
     */
    enabled?: boolean;

    /**
     * Prevent shortcuts when user is typing in input/textarea
     */
    preventInInputs?: boolean;

    /**
     * Show console logs for debugging
     */
    debug?: boolean;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for managing keyboard shortcuts in wall drawing system
 * 
 * Usage:
 * ```typescript
 * useKeyboardShortcuts({
 *     onSave: handleSave,
 *     onUndo: handleUndo,
 *     onDelete: handleDelete
 * }, {
 *     enabled: isDrawingMode,
 *     preventInInputs: true
 * });
 * ```
 */
export function useKeyboardShortcuts(
    handlers: ShortcutHandlers,
    options: ShortcutOptions = {}
) {
    const {
        enabled = true,
        preventInInputs = true,
        debug = false
    } = options;

    // Store handlers in ref to avoid effect re-runs
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    // ============================================
    // KEYBOARD EVENT HANDLER
    // ============================================

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Skip if user is typing in input/textarea
        if (preventInInputs && isTypingInInput(event)) {
            return;
        }

        const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
        const modKey = ctrlKey || metaKey; // Cmd on Mac, Ctrl on Windows/Linux

        if (debug) {
            console.log('Keyboard shortcut:', { key, ctrlKey, metaKey, shiftKey, altKey });
        }

        // ============================================
        // SAVE: Ctrl/Cmd + S
        // ============================================
        if (modKey && key.toLowerCase() === 's') {
            event.preventDefault();
            if (debug) console.log('Shortcut: Save');
            handlersRef.current.onSave?.();
            return;
        }

        // ============================================
        // UNDO: Ctrl/Cmd + Z
        // ============================================
        if (modKey && !shiftKey && key.toLowerCase() === 'z') {
            event.preventDefault();
            if (debug) console.log('Shortcut: Undo');
            handlersRef.current.onUndo?.();
            return;
        }

        // ============================================
        // REDO: Ctrl/Cmd + Shift + Z  OR  Ctrl/Cmd + Y
        // ============================================
        if ((modKey && shiftKey && key.toLowerCase() === 'z') ||
            (modKey && key.toLowerCase() === 'y')) {
            event.preventDefault();
            if (debug) console.log('Shortcut: Redo');
            handlersRef.current.onRedo?.();
            return;
        }

        // ============================================
        // ESCAPE: Cancel
        // ============================================
        if (key === 'Escape') {
            event.preventDefault();
            if (debug) console.log('Shortcut: Escape/Cancel');
            handlersRef.current.onEscape?.();
            handlersRef.current.onCancel?.();
            return;
        }

        // ============================================
        // DELETE/BACKSPACE: Delete selected item
        // ============================================
        if (key === 'Delete' || key === 'Backspace') {
            // Only trigger if NOT in input field
            if (!isTypingInInput(event)) {
                event.preventDefault();
                if (debug) console.log('Shortcut: Delete');
                handlersRef.current.onDelete?.();
            }
            return;
        }

        // ============================================
        // D: Toggle drawing mode
        // ============================================
        if (!modKey && !shiftKey && !altKey && key.toLowerCase() === 'd') {
            event.preventDefault();
            if (debug) console.log('Shortcut: Toggle Draw Mode');
            handlersRef.current.onToggleDrawMode?.();
            return;
        }

        // ============================================
        // SELECT ALL: Ctrl/Cmd + A
        // ============================================
        if (modKey && key.toLowerCase() === 'a') {
            // Only prevent default if handler exists
            if (handlersRef.current.onSelectAll) {
                event.preventDefault();
                if (debug) console.log('Shortcut: Select All');
                handlersRef.current.onSelectAll();
            }
            return;
        }

        // ============================================
        // COPY: Ctrl/Cmd + C
        // ============================================
        if (modKey && key.toLowerCase() === 'c') {
            if (handlersRef.current.onCopy) {
                event.preventDefault();
                if (debug) console.log('Shortcut: Copy');
                handlersRef.current.onCopy();
            }
            return;
        }

        // ============================================
        // PASTE: Ctrl/Cmd + V
        // ============================================
        if (modKey && key.toLowerCase() === 'v') {
            if (handlersRef.current.onPaste) {
                event.preventDefault();
                if (debug) console.log('Shortcut: Paste');
                handlersRef.current.onPaste();
            }
            return;
        }

        // ============================================
        // DUPLICATE: Ctrl/Cmd + D
        // ============================================
        if (modKey && key.toLowerCase() === 'd') {
            if (handlersRef.current.onDuplicate) {
                event.preventDefault();
                if (debug) console.log('Shortcut: Duplicate');
                handlersRef.current.onDuplicate();
            }
            return;
        }

        // ============================================
        // HELP: ? or F1
        // ============================================
        if (key === '?' || key === 'F1') {
            event.preventDefault();
            if (debug) console.log('Shortcut: Help');
            handlersRef.current.onHelp?.();
            return;
        }

    }, [enabled, preventInInputs, debug]);

    // ============================================
    // ATTACH/DETACH EVENT LISTENER
    // ============================================

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, handleKeyDown]);
}



function isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;

    if (!target) return false;

    const tagName = target.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = target.contentEditable === 'true';

    return isInput || isContentEditable;
}


export function getModKeyLabel(): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? 'Cmd' : 'Ctrl';
}

export function formatShortcut(keys: string[]): string {
    const modKey = getModKeyLabel();
    return keys.map(k => k === 'Mod' ? modKey : k).join('+');
}


export const AVAILABLE_SHORTCUTS = [
    { keys: ['Mod', 'S'], description: 'Save changes', handler: 'onSave' },
    { keys: ['Mod', 'Z'], description: 'Undo', handler: 'onUndo' },
    { keys: ['Mod', 'Shift', 'Z'], description: 'Redo', handler: 'onRedo' },
    { keys: ['Mod', 'Y'], description: 'Redo (alternative)', handler: 'onRedo' },
    { keys: ['Escape'], description: 'Cancel/Close', handler: 'onCancel' },
    { keys: ['Delete'], description: 'Delete selected', handler: 'onDelete' },
    { keys: ['Backspace'], description: 'Delete selected (alternative)', handler: 'onDelete' },
    { keys: ['D'], description: 'Toggle drawing mode', handler: 'onToggleDrawMode' },
    { keys: ['Mod', 'A'], description: 'Select all', handler: 'onSelectAll' },
    { keys: ['Mod', 'C'], description: 'Copy', handler: 'onCopy' },
    { keys: ['Mod', 'V'], description: 'Paste', handler: 'onPaste' },
    { keys: ['Mod', 'D'], description: 'Duplicate', handler: 'onDuplicate' },
    { keys: ['?'], description: 'Show help', handler: 'onHelp' },
    { keys: ['F1'], description: 'Show help (alternative)', handler: 'onHelp' },
];


export function getShortcutReference() {
    return AVAILABLE_SHORTCUTS.map(shortcut => ({
        shortcut: formatShortcut(shortcut.keys),
        description: shortcut.description,
        handler: shortcut.handler
    }));
}