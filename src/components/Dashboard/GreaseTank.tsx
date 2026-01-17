import React, { useEffect, useRef } from 'react';
import './tankstyle.css'; // External CSS for better separation
import { getThemeColors, shadeColor } from '../../utils/themeColors';

const { primary, secondary } = getThemeColors();;

const GreaseTank = ({ percent, value, max }) => {
  const tankRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (tankRef.current) {
      tankRef.current.style.top = `calc(100% - ${percent}%)`;
    }
    if (labelRef.current) {
      labelRef.current.textContent = `${percent}%`;
      labelRef.current.style.bottom = `${percent}%`;
    }
  }, [percent]);

  return (
    <div className="water-tank">
      <div className="liquid">
        <svg className="water" ref={tankRef} viewBox="0 0 200 100">
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={shadeColor(primary, -50)} />
              <stop offset="16%" stopColor={shadeColor(primary, -25)} />
              <stop offset="36%" stopColor={primary} />
              <stop offset="54%" stopColor={secondary} />
              <stop offset="72%" stopColor={shadeColor(secondary, -15)} />
              <stop offset="87%" stopColor={shadeColor(secondary, -30)} />
              <stop offset="100%" stopColor={shadeColor(secondary, -45)} />
            </linearGradient>
          </defs>
          <path
            fill="url(#waterGradient)"
            d="
              M 0,0 v 100 h 200 v -100 
              c -10,0 -15,5 -25,5 c -10,0 -15,-5 -25,-5
              c -10,0 -15,5 -25,5 c -10,0 -15,-5 -25,-5
              c -10,0 -15,5 -25,5 c -10,0 -15,-5 -25,-5
              c -10,0 -15,5 -25,5 c -10,0 -15,-5 -25,-5
            "
          />
        </svg>
      </div>

      {[25, 50, 75].map((val) => (
        <div className="indicator" key={val} data-value={val} style={{ bottom: `${val}%` }} />
      ))}

      <div className="label" ref={labelRef}></div>
    </div>
  );
};

export default GreaseTank;
