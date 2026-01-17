import React, { SVGProps } from 'react';

const SvgReject = (props: SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox='0 0 20 20'
        fill='currentColor'
        className='svg-icon'
        {...props}>
<path d="M6 18L18 6M18 18L6 6" stroke="#BE4E22" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
);

export default SvgReject;
