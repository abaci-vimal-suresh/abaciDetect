import * as React from 'react';
import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import ReactDOM from 'react-dom';
import useDarkMode from '../../../hooks/useDarkMode';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Option {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
}

export interface MultiSelectDropdownProps {
    options: Option[];
    value?: string[];
    onChange?: (selected: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    label?: string;
    maxSelected?: number;
    disabled?: boolean;
    clearable?: boolean;
    selectAll?: boolean;
    className?: string;
}

// ─── Portal Panel ─────────────────────────────────────────────────────────────

interface PanelProps {
    anchorRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    children: React.ReactNode;
    darkModeStatus: boolean;
}

const Panel: React.FC<PanelProps> = ({ anchorRef, onClose, children, darkModeStatus }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [flip, setFlip] = useState(false);

    useEffect(() => {
        const update = () => {
            if (!anchorRef.current) return;
            const r = anchorRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - r.bottom;
            setFlip(spaceBelow < 200 && r.top > spaceBelow);
            setRect(r);
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [anchorRef]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            const panel = document.getElementById('msd-portal-panel');
            if (!anchorRef.current?.contains(target) && !panel?.contains(target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [anchorRef, onClose]);

    if (!rect) return null;

    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        left: rect.left,
        width: rect.width,
        backgroundColor: darkModeStatus ? '#212529' : '#ffffff',
        border: darkModeStatus ? '1px solid #34393F' : '1px solid #ededed',
        borderRadius: '4px',
        boxShadow: darkModeStatus
            ? '0 4px 16px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        fontSize: '13px',
        fontWeight: 600,
        ...(flip
            ? { bottom: window.innerHeight - rect.top + 2 }
            : { top: rect.bottom + 2 }),
    };

    return ReactDOM.createPortal(
        <div id="msd-portal-panel" style={panelStyle}>
            {children}
        </div>,
        document.body
    );
};

// ─── MultiSelectDropdown ──────────────────────────────────────────────────────

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    options,
    value = [],
    onChange,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    label,
    maxSelected,
    disabled = false,
    clearable = true,
    selectAll = true,
    className = '',
}) => {
    const { darkModeStatus } = useDarkMode();

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);

    const triggerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // ── Derived ───────────────────────────────────────────────────────────────
    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase())
    );
    const groups = filtered.reduce<Record<string, Option[]>>((acc, opt) => {
        const g = opt.group ?? '__none__';
        (acc[g] = acc[g] || []).push(opt);
        return acc;
    }, {});
    const hasGroups = Object.keys(groups).some(k => k !== '__none__');
    const flatFiltered = hasGroups ? Object.values(groups).flat() : filtered;

    const selected = new Set(value);
    const enabledFiltered = filtered.filter(o => !o.disabled);
    const allFilteredSelected =
        enabledFiltered.length > 0 && enabledFiltered.every(o => selected.has(o.value));
    const atMax = maxSelected !== undefined && selected.size >= maxSelected;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggle = useCallback((val: string) => {
        if (!onChange) return;
        if (selected.has(val)) onChange(value.filter(v => v !== val));
        else if (!atMax) onChange([...value, val]);
    }, [onChange, value, selected, atMax]);

    const handleSelectAll = () => {
        if (!onChange) return;
        if (allFilteredSelected) {
            const removeSet = new Set(enabledFiltered.map(o => o.value));
            onChange(value.filter(v => !removeSet.has(v)));
        } else {
            const toAdd = enabledFiltered.filter(o => !selected.has(o.value)).map(o => o.value);
            const combined = [...value, ...toAdd];
            onChange(maxSelected !== undefined ? combined.slice(0, maxSelected) : combined);
        }
    };

    const close = useCallback(() => {
        setOpen(false);
        setQuery('');
        setFocusedIndex(-1);
        setIsFocused(false);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 30);
    }, [open]);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        switch (e.key) {
            case 'Enter':
            case ' ':
                if (!open) setOpen(true);
                else if (focusedIndex >= 0 && !flatFiltered[focusedIndex]?.disabled)
                    toggle(flatFiltered[focusedIndex].value);
                e.preventDefault(); break;
            case 'Escape': close(); break;
            case 'ArrowDown':
                if (!open) setOpen(true);
                else setFocusedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
                e.preventDefault(); break;
            case 'ArrowUp':
                setFocusedIndex(i => Math.max(i - 1, 0));
                e.preventDefault(); break;
        }
    };

    // ── Styles (matching ReactSelectWithState exactly) ─────────────────────────
    const dm = darkModeStatus;

    const controlStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        minHeight: '40px',
        padding: '0 8px',
        backgroundColor: dm ? '#212529' : '#F8F9FA',
        border: dm
            ? '1px solid #34393F'
            : isFocused || open
                ? '1px solid #DFDFDF'
                : '1px solid #ededed',
        borderRadius: '4px',
        boxShadow: isFocused || open
            ? dm ? '0 0 0 3px #35373C' : '0 0 0 3px #DFDFDF'
            : 'none',
        fontWeight: 600,
        fontSize: '13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        width: '100%',
        boxSizing: 'border-box',
        userSelect: 'none',
        position: 'relative',
    };

    const tagStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px 2px 8px',
        backgroundColor: dm ? '#35373C' : '#EFF2F7',
        color: dm ? 'white' : 'black',
        borderRadius: '3px',
        fontSize: '11px',
        fontWeight: 600,
        maxWidth: '120px',
    };

    const tagLabelStyle: React.CSSProperties = {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    };

    const tagRemoveStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '14px',
        height: '14px',
        border: 'none',
        background: 'transparent',
        color: dm ? '#aaa' : '#666',
        cursor: 'pointer',
        padding: 0,
        fontSize: '10px',
        flexShrink: 0,
        borderRadius: '2px',
    };

    const searchInputStyle: React.CSSProperties = {
        border: 'none',
        outline: 'none',
        backgroundColor: dm ? '#212529' : '#ffffff',
        color: dm ? 'white' : 'black',
        fontSize: '13px',
        fontWeight: 400,
        padding: '8px 10px',
        width: '100%',
        borderBottom: dm ? '1px solid #34393F' : '1px solid #ededed',
        boxSizing: 'border-box',
    };

    const listStyle: React.CSSProperties = {
        maxHeight: '150px',       // matches your react-select maxHeight: 150px
        overflowY: 'auto',
        padding: '4px 0',
    };

    const groupLabelStyle: React.CSSProperties = {
        padding: '6px 10px 2px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: dm ? '#888' : '#999',
    };

    const toolbarStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        borderBottom: dm ? '1px solid #34393F' : '1px solid #ededed',
    };

    const toolbarBtnStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '11px',
        fontWeight: 600,
        color: '#6c5dd3',
        cursor: 'pointer',
        padding: '2px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    };

    const countStyle: React.CSSProperties = {
        fontSize: '11px',
        color: dm ? '#888' : '#999',
        fontWeight: 400,
    };

    const emptyStyle: React.CSSProperties = {
        padding: '12px 10px',
        textAlign: 'center',
        fontSize: '13px',
        color: dm ? '#888' : '#999',
        fontWeight: 400,
    };

    const maxNoticeStyle: React.CSSProperties = {
        padding: '5px 10px',
        fontSize: '11px',
        color: dm ? '#888' : '#999',
        borderTop: dm ? '1px solid #34393F' : '1px solid #ededed',
        textAlign: 'center',
    };

    // ── Tags ──────────────────────────────────────────────────────────────────
    const TAG_LIMIT = 2;
    const selectedLabels = value.map(v => options.find(o => o.value === v)?.label ?? v);
    const visibleTags = selectedLabels.slice(0, TAG_LIMIT);
    const overflow = selectedLabels.length - TAG_LIMIT;

    return (
        <div
            className={className}
            style={{ position: 'relative', width: '100%' }}
            onKeyDown={handleKeyDown}
        >
            {/* ── Trigger / Control ────────────────────────────────────────── */}
            <div
                ref={triggerRef}
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                tabIndex={disabled ? -1 : 0}
                style={controlStyle}
                onClick={() => !disabled && (setOpen(o => !o), setIsFocused(true))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => { if (!open) setIsFocused(false); }}
            >
                {/* Tags + placeholder */}
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', minWidth: 0 }}>
                    {value.length === 0 ? (
                        <span style={{ color: dm ? '#6c757d' : '#adb5bd', fontWeight: 400, fontSize: '13px' }}>
                            {placeholder}
                        </span>
                    ) : (
                        <>
                            {visibleTags.map((lbl, i) => (
                                <span key={value[i]} style={tagStyle}>
                                    <span style={tagLabelStyle}>{lbl}</span>
                                    {!disabled && (
                                        <button
                                            style={tagRemoveStyle}
                                            onClick={e => {
                                                e.stopPropagation();
                                                onChange?.(value.filter((_, idx) => idx !== i));
                                            }}
                                            tabIndex={-1}
                                        >×</button>
                                    )}
                                </span>
                            ))}
                            {overflow > 0 && (
                                <span style={{ fontSize: '11px', color: dm ? '#888' : '#999', fontWeight: 400 }}>
                                    +{overflow} more
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Right-side controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, paddingLeft: '4px' }}>
                    {/* Clear all */}
                    {clearable && value.length > 0 && !disabled && (
                        <>
                            <button
                                style={{
                                    background: 'none', border: 'none', padding: '0 2px',
                                    cursor: 'pointer', color: dm ? '#6c757d' : '#cccccc',
                                    fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center',
                                }}
                                onClick={e => { e.stopPropagation(); onChange?.([]); }}
                                tabIndex={-1}
                                aria-label="Clear all"
                            >×</button>
                            {/* Separator — matches react-select */}
                            <div style={{
                                width: '1px', height: '20px',
                                backgroundColor: dm ? '#34393F' : '#e0e0e0',
                                margin: '0 2px',
                            }} />
                        </>
                    )}
                    {/* Chevron — matches react-select dropdown indicator */}
                    <svg
                        style={{
                            color: dm ? '#6c757d' : '#cccccc',
                            transform: open ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                        }}
                        height="20" width="20" viewBox="0 0 20 20" focusable="false"
                    >
                        <path
                            d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.787-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            </div>

            {/* ── Portal Panel ─────────────────────────────────────────────── */}
            {open && (
                <Panel anchorRef={triggerRef as React.RefObject<HTMLElement>} onClose={close} darkModeStatus={dm}>

                    {/* Search input */}
                    <input
                        ref={searchRef}
                        style={searchInputStyle}
                        type="text"
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={e => { setQuery(e.target.value); setFocusedIndex(-1); }}
                        onKeyDown={e => e.stopPropagation()}
                    />

                    {/* Select all toolbar */}
                    {(selectAll || maxSelected !== undefined) && filtered.length > 0 && (
                        <div style={toolbarStyle}>
                            {selectAll && (
                                <button style={toolbarBtnStyle} onClick={handleSelectAll}>
                                    {allFilteredSelected ? 'Deselect all' : 'Select all'}
                                </button>
                            )}
                            <span style={countStyle}>
                                {selected.size}{maxSelected !== undefined ? `/${maxSelected}` : ''} selected
                            </span>
                        </div>
                    )}

                    {/* Options list */}
                    <div style={listStyle} role="listbox" aria-multiselectable="true">
                        {filtered.length === 0 ? (
                            <div style={emptyStyle}>No options</div>
                        ) : hasGroups ? (
                            Object.entries(groups).map(([group, opts]) => (
                                <div key={group}>
                                    {group !== '__none__' && (
                                        <div style={groupLabelStyle}>{group}</div>
                                    )}
                                    {opts.map(opt => {
                                        const flatIdx = flatFiltered.indexOf(opt);
                                        return (
                                            <OptionRow
                                                key={opt.value}
                                                option={opt}
                                                isSelected={selected.has(opt.value)}
                                                isFocused={focusedIndex === flatIdx}
                                                isDisabled={opt.disabled || (!selected.has(opt.value) && atMax)}
                                                onToggle={toggle}
                                                onHover={() => setFocusedIndex(flatIdx)}
                                                darkModeStatus={dm}
                                            />
                                        );
                                    })}
                                </div>
                            ))
                        ) : (
                            flatFiltered.map((opt, idx) => (
                                <OptionRow
                                    key={opt.value}
                                    option={opt}
                                    isSelected={selected.has(opt.value)}
                                    isFocused={focusedIndex === idx}
                                    isDisabled={opt.disabled || (!selected.has(opt.value) && atMax)}
                                    onToggle={toggle}
                                    onHover={() => setFocusedIndex(idx)}
                                    darkModeStatus={dm}
                                />
                            ))
                        )}
                    </div>

                    {atMax && <div style={maxNoticeStyle}>Max {maxSelected} items selected</div>}

                </Panel>
            )}
        </div>
    );
};

// ─── Option Row ───────────────────────────────────────────────────────────────

interface OptionRowProps {
    option: Option;
    isSelected: boolean;
    isFocused: boolean;
    isDisabled: boolean;
    onToggle: (val: string) => void;
    onHover: () => void;
    darkModeStatus: boolean;
}

const OptionRow: React.FC<OptionRowProps> = ({
    option, isSelected, isFocused, isDisabled, onToggle, onHover, darkModeStatus: dm,
}) => {
    const rowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 10px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.4 : 1,
        // Matches your react-select option exactly:
        backgroundColor: isSelected
            ? dm ? '#35373C' : '#EFF2F7'
            : isFocused
                ? dm ? '#35373C' : '#EFF2F7'
                : 'transparent',
        color: dm ? 'white' : 'black',
        fontSize: '13px',
        fontWeight: 600,
        userSelect: 'none',
        transition: 'background-color 0.1s',
    };

    const checkboxStyle: React.CSSProperties = {
        width: '14px',
        height: '14px',
        flexShrink: 0,
        borderRadius: '3px',
        border: isSelected
            ? '2px solid #6c5dd3'
            : dm ? '2px solid #34393F' : '2px solid #cccccc',
        backgroundColor: isSelected ? '#6c5dd3' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.1s, border-color 0.1s',
    };

    return (
        <div
            role="option"
            aria-selected={isSelected}
            style={rowStyle}
            onClick={() => !isDisabled && onToggle(option.value)}
            onMouseEnter={onHover}
        >
            <div style={checkboxStyle}>
                {isSelected && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {option.label}
            </span>
        </div>
    );
};

export default MultiSelectDropdown;