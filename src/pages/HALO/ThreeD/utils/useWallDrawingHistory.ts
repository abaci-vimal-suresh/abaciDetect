
import { useState, useCallback } from 'react';



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

export function useWallDrawingHistory() {
    const [history, setHistory] = useState<DrawingAction[]>([]);

    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    const [currentState, setCurrentState] = useState<WallDrawingState>({
        firstPoint: null,
        previewEndPoint: null
    });


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


    const updatePreviewEndPoint = useCallback((point: { x: number; y: number; z: number } | null) => {
        setCurrentState(prev => ({
            ...prev,
            previewEndPoint: point
        }));
    }, []);


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


    const undo = useCallback(() => {
        if (currentIndex <= 0) {
            return;
        }

        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);

        const newState = rebuildStateFromHistory(history.slice(0, newIndex + 1));
        setCurrentState(newState);
    }, [currentIndex, history]);


    const redo = useCallback(() => {
        if (currentIndex >= history.length - 1) {
            return;
        }

        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        const newState = rebuildStateFromHistory(history.slice(0, newIndex + 1));
        setCurrentState(newState);
    }, [currentIndex, history]);


    const clear = useCallback(() => {
        setHistory([]);
        setCurrentIndex(-1);
        setCurrentState({
            firstPoint: null,
            previewEndPoint: null
        });
    }, []);



    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;
    const hasFirstPoint = currentState.firstPoint !== null;
    const hasPreviewEndPoint = currentState.previewEndPoint !== null;



    return {
        currentState,
        firstPoint: currentState.firstPoint,
        previewEndPoint: currentState.previewEndPoint,

        recordSetFirstPoint,
        recordClearFirstPoint,
        updatePreviewEndPoint,
        recordCreateWall,
        recordCancel,

        undo,
        redo,
        clear,

        canUndo,
        canRedo,
        hasFirstPoint,
        hasPreviewEndPoint,
        history,
        currentIndex
    };
}


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

            default:
                break;
        }
    }

    return state;
}


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