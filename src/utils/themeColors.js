
export const shadeColor = (color, percent) => {
  if (!color) return color;

  let f = parseInt(color.slice(1), 16);
  let t = percent < 0 ? 0 : 255;
  let p = Math.abs(percent) / 100;

  let R = f >> 16;
  let G = (f >> 8) & 0x00ff;
  let B = f & 0x0000ff;

  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
};

export const getThemeColors = () => {
  const styles = getComputedStyle(document.documentElement);

  const primary = styles.getPropertyValue('--primary-color').trim();
  const secondary = styles.getPropertyValue('--secondary-color').trim();

  return {
    primary,
    secondary,
  };
};
