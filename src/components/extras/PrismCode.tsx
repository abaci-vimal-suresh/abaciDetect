import React, { FC, useEffect, useRef, CSSProperties } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // Default theme
import 'prismjs/components/prism-jsx.min';
import classNames from 'classnames';

interface IPrismCodeProps {
    code: string;
    language?: string;
    className?: string;
    rounded?: number | string;
    style?: CSSProperties;
}

const PrismCode: FC<IPrismCodeProps> = ({ code, language = 'javascript', className, rounded, style }) => {
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [code, language]);

    return (
        <pre
            className={classNames(className, `language-${language}`)}
            style={{
                ...(rounded !== undefined ? { borderRadius: rounded } : {}),
                ...style,
            }}>
            <code ref={codeRef} className={`language-${language}`}>
                {code}
            </code>
        </pre>
    );
};

export default PrismCode;
