import React, { FC, HTMLAttributes } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

interface IPlaceholderImageProps extends HTMLAttributes<HTMLSpanElement> {
    width?: number | string;
    height?: number | string;
    className?: string;
    text?: string;
}

const PlaceholderImage: FC<IPlaceholderImageProps> = ({ width, height, className, text, ...props }) => {
    return (
        <span
            className={classNames('d-inline-block bg-light text-center', className)}
            style={{
                width,
                height,
                lineHeight: typeof height === 'number' ? `${height}px` : height,
                fontSize: 'calc(1rem + 1vw)',
                color: 'var(--bs-gray-400)',
                ...props.style,
            }}
            {...props}>
            {text || (
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='50%'
                    height='50%'
                    fill='currentColor'
                    className='bi bi-image'
                    viewBox='0 0 16 16'>
                    <path d='M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z' />
                    <path d='M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z' />
                </svg>
            )}
        </span>
    );
};

PlaceholderImage.propTypes = {
    // @ts-ignore
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    // @ts-ignore
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    text: PropTypes.string,
};

PlaceholderImage.defaultProps = {
    width: 100,
    height: 100,
    className: undefined,
    text: undefined,
};

export default PlaceholderImage;
