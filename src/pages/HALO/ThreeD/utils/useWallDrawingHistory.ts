/**
 * Wall Drawing History Hook (Undo/Redo)
 * 
 * Purpose: Fixes Issue #5 (no undo/redo for wall drawing)
 * 
 * Problem:
 * - User misclicks second point → must cancel and start over
 * - Very frustrating when drawing complex floor plans
 * - No way to go back one step
 * 
 * Solution:
 * - Track history of drawing actions
 * - Allow undo to previous state
 * - Keyboard shortcut support (Ctrl+Z)
 */

import { useState, useCallback } from 'react';

// ============================================
// ACTION TYPES
// ============================================

export type DrawingActionType =
    | 'SET_FIRST_POINT'
    | 'CLEAR_FIRST_POINT'
    | 'UPDATE_PREVIEW'
    | 'CREATE_WALL'
    | 'CANCEL';

export interface DrawingAction {
    type: DrawingActionType;
    timestamp: number;
    data: any; // Action-specific payload
}

export interface FirstPointData {
    x: number;
    y: number;
    z: number;
    floorY: number;
    areaId: number;
}

// ============================================
// HISTORY STATE
// ============================================

export interface WallDrawingState {
    firstPoint: FirstPointData | null;
    previewEndPoint: { x: number; y: number; z: number } | null;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for managing wall drawing history with undo capability
 * 
 * Usage:
 * ```typescript
 * const { 
 *     currentState, 
 *     recordSetFirstPoint, 
 *     recordClearFirstPoint,
 *     undo, 
 *     canUndo,
 *     clear
 * } = useWallDrawingHistory();
 * ```
 */
export function useWallDrawingHistory() {
    // History stack (stores all actions)
    const [history, setHistory] = useState<DrawingAction[]>([]);

    // Current index in history (-1 = no actions)
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    // Current drawing state (derived from history)
    const [currentState, setCurrentState] = useState<WallDrawingState>({
        firstPoint: null,
        previewEndPoint: null
    });

    // ============================================
    // RECORD ACTIONS
    // ============================================

    /**
     * Record: User set first point
     */
    const recordSetFirstPoint = useCallback((point: FirstPointData) => {
        const action: DrawingAction = {
            type: 'SET_FIRST_POINT',
            timestamp: Date.now(),
            data: point
        };

        setHistory(prev => [...prev.slice(0, currentIndex + 1), action]);
        setCurrentIndex(prev => prev + 1);
        setCurrentState({
            firstPoint: point,
            previewEndPoint: null
        });
    }, [currentIndex]);

    /**
     * Record: User cleared first point (cancelled)
     */
    const recordClearFirstPoint = useCallback(() => {
        const action: DrawingAction = {
            type: 'CLEAR_FIRST_POINT',
            timestamp: Date.now(),
            data: null
        };

        setHistory(prev => [...prev.slice(0, currentIndex + 1), action]);
        setCurrentIndex(prev => prev + 1);
        setCurrentState({
            firstPoint: null,
            previewEndPoint: null
        });
    }, [currentIndex]);

    /**
     * Record: User updated preview endpoint (mouse move)
     * Note: We don't add this to history stack (too many events)
     */
    const updatePreviewEndPoint = useCallback((point: { x: number; y: number; z: number } | null) => {
        setCurrentState(prev => ({
            ...prev,
            previewEndPoint: point
        }));
    }, []);

    /**
     * Record: User created wall (second click)
     */
    const recordCreateWall = useCallback((wall: any) => {
        const action: DrawingAction = {
            type: 'CREATE_WALL',
            timestamp: Date.now(),
            data: wall
        };

        setHistory(prev => [...prev.slice(0, currentIndex + 1), action]);
        setCurrentIndex(prev => prev + 1);
        setCurrentState({
            firstPoint: null,
            previewEndPoint: null
        });
    }, [currentIndex]);

    /**
     * Record: User cancelled drawing mode
     */
    const recordCancel = useCallback(() => {
        const action: DrawingAction = {
            type: 'CANCEL',
            timestamp: Date.now(),
            data: null
        };

        setHistory(prev => [...prev.slice(0, currentIndex + 1), action]);
        setCurrentIndex(prev => prev + 1);
        setCurrentState({
            firstPoint: null,
            previewEndPoint: null
        });
    }, [currentIndex]);

    // ============================================
    // UNDO/REDO
    // ============================================

    /**
     * Undo last action
     * 
     * Goes back one step in history and restores previous state
     */
    const undo = useCallback(() => {
        if (currentIndex <= 0) {
            // No actions to undo
            return;
        }

        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);

        // Rebuild state from history up to newIndex
        const newState = rebuildStateFromHistory(history.slice(0, newIndex + 1));
        setCurrentState(newState);
    }, [currentIndex, history]);

    /**
     * Redo last undone action
     */
    const redo = useCallback(() => {
        if (currentIndex >= history.length - 1) {
            // No actions to redo
            return;
        }

        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        // Rebuild state from history up to newIndex
        const newState = rebuildStateFromHistory(history.slice(0, newIndex + 1));
        setCurrentState(newState);
    }, [currentIndex, history]);

    /**
     * Clear entire history
     * 
     * Resets to initial state
     */
    const clear = useCallback(() => {
        setHistory([]);
        setCurrentIndex(-1);
        setCurrentState({
            firstPoint: null,
            previewEndPoint: null
        });
    }, []);

    // ============================================
    // STATE CHECKS
    // ============================================

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;
    const hasFirstPoint = currentState.firstPoint !== null;
    const hasPreviewEndPoint = currentState.previewEndPoint !== null;

    // ============================================
    // RETURN API
    // ============================================

    return {
        // Current state
        currentState,
        firstPoint: currentState.firstPoint,
        previewEndPoint: currentState.previewEndPoint,

        // Recording actions
        recordSetFirstPoint,
        recordClearFirstPoint,
        updatePreviewEndPoint,
        recordCreateWall,
        recordCancel,

        // Undo/Redo
        undo,
        redo,
        clear,

        // State checks
        canUndo,
        canRedo,
        hasFirstPoint,
        hasPreviewEndPoint,

        // Debug info
        history,
        currentIndex
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Rebuild drawing state from action history
 * 
 * Replays all actions to compute current state
 * 
 * @param actions - Array of actions to replay
 * @returns Reconstructed state
 */
function rebuildStateFromHistory(actions: DrawingAction[]): WallDrawingState {
    let state: WallDrawingState = {
        firstPoint: null,
        previewEndPoint: null
    };

    for (const action of actions) {
        switch (action.type) {
            case 'SET_FIRST_POINT':
                state = {
                    firstPoint: action.data,
                    previewEndPoint: null
                };
                break;

            case 'CLEAR_FIRST_POINT':
            case 'CREATE_WALL':
            case 'CANCEL':
                state = {
                    firstPoint: null,
                    previewEndPoint: null
                };
                break;

            // UPDATE_PREVIEW is not in history, so we skip it
            default:
                break;
        }
    }

    return state;
}

/**
 * Get human-readable description of an action
 * 
 * @param action - Drawing action
 * @returns Description string
 */
export function getActionDescription(action: DrawingAction): string {
    switch (action.type) {
        case 'SET_FIRST_POINT':
            return 'Set first point';
        case 'CLEAR_FIRST_POINT':
            return 'Clear first point';
        case 'UPDATE_PREVIEW':
            return 'Update preview';
        case 'CREATE_WALL':
            return 'Create wall';
        case 'CANCEL':
            return 'Cancel drawing';
        default:
            return 'Unknown action';
    }
}