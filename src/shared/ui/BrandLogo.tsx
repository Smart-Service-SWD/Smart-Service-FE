import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop
} from "react-native-svg";

interface BrandLogoProps {
  size?: number;
}

export default function BrandLogo({ size = 44 }: BrandLogoProps) {
  const baseId = useId().replace(/:/g, "");
  const bgGradientId = `${baseId}-bg`;
  const glowGradientId = `${baseId}-glow`;
  const accentGradientId = `${baseId}-accent`;

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Defs>
        <LinearGradient id={bgGradientId} x1="64" y1="48" x2="448" y2="464">
          <Stop offset="0" stopColor="#0F766E" />
          <Stop offset="1" stopColor="#0B4F4A" />
        </LinearGradient>
        <RadialGradient
          id={glowGradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(180 150) rotate(40) scale(350 260)"
        >
          <Stop offset="0" stopColor="#5EEAD4" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#5EEAD4" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={accentGradientId} x1="130" y1="120" x2="382" y2="392">
          <Stop offset="0" stopColor="#CCFBF1" />
          <Stop offset="1" stopColor="#99F6E4" />
        </LinearGradient>
      </Defs>

      <Rect x="24" y="24" width="464" height="464" rx="108" fill={`url(#${bgGradientId})`} />
      <Rect x="24" y="24" width="464" height="464" rx="108" fill={`url(#${glowGradientId})`} />

      <Polygon
        points="256,90 395,171 395,341 256,422 117,341 117,171"
        stroke={`url(#${accentGradientId})`}
        strokeWidth={15}
        strokeLinejoin="round"
        fill="#FFFFFF"
        fillOpacity={0.03}
      />

      <Path
        d="M335 132H223C185 132 154 163 154 201C154 239 185 270 223 270H289C321 270 347 296 347 328C347 360 321 386 289 386H177"
        stroke={`url(#${accentGradientId})`}
        strokeWidth={40}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path d="M318 168L356 168" stroke="#CCFBF1" strokeWidth={10} strokeLinecap="round" />
      <Path d="M156 348L194 348" stroke="#CCFBF1" strokeWidth={10} strokeLinecap="round" />

      <Circle cx="385" cy="171" r="16" fill="#CCFBF1" />
      <Circle cx="117" cy="341" r="16" fill="#CCFBF1" />
      <Circle cx="256" cy="90" r="12" fill="#99F6E4" />

      <Path d="M370 180L332 203" stroke="#99F6E4" strokeWidth={7} strokeLinecap="round" />
      <Path d="M134 332L172 309" stroke="#99F6E4" strokeWidth={7} strokeLinecap="round" />
    </Svg>
  );
}
