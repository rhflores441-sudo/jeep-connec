import type { StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

type JeepLibertyProps = {
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Ilustración vectorial original de un Jeep Liberty 2010 en verde natural
 * metálico. Es un dibujo propio (no una fotografía) y se puede reemplazar por
 * una imagen real editando `src/components/vehicle/JeepLiberty.tsx` o usando el
 * componente `JeepImage` de la pantalla de inicio.
 */
export function JeepLiberty({ width = '100%', height = 240, style }: JeepLibertyProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 420 280" style={style} accessibilityLabel="Jeep Liberty 2010 verde">
      <Defs>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A7E2BE" />
          <Stop offset="0.22" stopColor="#6FBF92" />
          <Stop offset="0.52" stopColor="#3E8A65" />
          <Stop offset="0.78" stopColor="#286349" />
          <Stop offset="1" stopColor="#173F2F" />
        </LinearGradient>
        <LinearGradient id="bodyLower" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3C8463" />
          <Stop offset="0.6" stopColor="#245B43" />
          <Stop offset="1" stopColor="#14392A" />
        </LinearGradient>
        <LinearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0B1B26" />
          <Stop offset="0.45" stopColor="#163548" />
          <Stop offset="1" stopColor="#07131B" />
        </LinearGradient>
        <LinearGradient id="bumperGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D9E2E8" />
          <Stop offset="0.45" stopColor="#9AA9B4" />
          <Stop offset="0.55" stopColor="#6E7C87" />
          <Stop offset="1" stopColor="#C4CFD7" />
        </LinearGradient>
        <LinearGradient id="chromeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7FBFF" />
          <Stop offset="0.5" stopColor="#B9C6D0" />
          <Stop offset="1" stopColor="#75828C" />
        </LinearGradient>
        <RadialGradient id="tireGrad" cx="0.5" cy="0.45" r="0.65">
          <Stop offset="0" stopColor="#2B3238" />
          <Stop offset="0.72" stopColor="#12171B" />
          <Stop offset="1" stopColor="#05080A" />
        </RadialGradient>
        <LinearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F0F5F8" />
          <Stop offset="0.42" stopColor="#AAB7C0" />
          <Stop offset="0.62" stopColor="#66737D" />
          <Stop offset="1" stopColor="#D6E0E6" />
        </LinearGradient>
        <RadialGradient id="headlightGrad" cx="0.42" cy="0.38" r="0.7">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.45" stopColor="#FFF6D8" />
          <Stop offset="0.8" stopColor="#F2C96B" />
          <Stop offset="1" stopColor="#8C6B25" />
        </RadialGradient>
        <LinearGradient id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#06110C" stopOpacity="0.42" />
          <Stop offset="1" stopColor="#06110C" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Sombra en el suelo, sin fondo (transparente) */}
      <Ellipse cx="214" cy="248" rx="168" ry="17" fill="url(#shadowGrad)" />

      {/* Carrocería principal */}
      <Path
        d="M 50 178 C 50 156 58 145 76 141 L 150 122 L 174 90 C 179 83 187 79 198 79 L 292 79 C 306 79 318 84 327 92 L 369 130 C 383 138 388 150 390 166 L 391 192 C 391 203 384 209 374 210 L 58 210 C 50 208 48 200 48 192 Z"
        fill="url(#bodyGrad)"
      />

      {/* Volumen inferior / faldón */}
      <Path
        d="M 49 192 L 390 192 C 390 201 384 208 374 210 L 58 210 C 51 208 49 202 49 192 Z"
        fill="url(#bodyLower)"
      />

      {/* Reflejo metálico superior */}
      <Path
        d="M 82 142 L 152 123 L 176 92 C 180 86 187 82 197 82 L 204 82 L 190 102 L 170 128 Z"
        fill="#D7F7E4"
        opacity="0.35"
      />
      <Path
        d="M 210 80 L 292 80 C 304 80 314 84 322 90 L 326 94 L 250 96 L 213 96 Z"
        fill="#E9FFF2"
        opacity="0.22"
      />

      {/* Cristales */}
      <G>
        <Path
          d="M 158 120 L 180 91 C 183 87 188 85 194 85 L 207 85 L 207 121 Z"
          fill="url(#glassGrad)"
          stroke="#0A171F"
          strokeWidth="1.4"
        />
        <Path
          d="M 212 85 L 268 85 L 268 121 L 212 121 Z"
          fill="url(#glassGrad)"
          stroke="#0A171F"
          strokeWidth="1.4"
        />
        <Path
          d="M 273 85 L 293 85 C 304 85 313 89 320 95 L 336 113 L 336 121 L 273 121 Z"
          fill="url(#glassGrad)"
          stroke="#0A171F"
          strokeWidth="1.4"
        />
        {/* Reflejos de los cristales */}
        <Path d="M 168 116 L 190 89 L 200 89 L 178 117 Z" fill="#BFE9FF" opacity="0.18" />
        <Path d="M 220 117 L 240 87 L 249 87 L 229 117 Z" fill="#BFE9FF" opacity="0.14" />
        <Path d="M 286 117 L 300 91 L 307 96 L 294 117 Z" fill="#BFE9FF" opacity="0.12" />
      </G>

      {/* Pilares y techo */}
      <Path d="M 208 84 L 212 84 L 212 123 L 208 123 Z" fill="#10251B" />
      <Path d="M 268 84 L 273 84 L 273 123 L 268 123 Z" fill="#10251B" />
      <Path d="M 178 90 L 198 79 L 296 79 L 310 84 L 194 86 Z" fill="#2C664C" />
      <Path d="M 186 76 L 314 76" stroke="#17221D" strokeWidth="5" strokeLinecap="round" />
      <Path d="M 186 77 L 314 77" stroke="#5D6A63" strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M 214 76 L 214 82" stroke="#17221D" strokeWidth="4" strokeLinecap="round" />
      <Path d="M 286 76 L 286 82" stroke="#17221D" strokeWidth="4" strokeLinecap="round" />

      {/* Línea de cintura cromada */}
      <Path d="M 58 129 C 110 132 170 124 210 124 L 340 124" stroke="#D6EEE0" strokeWidth="1.6" opacity="0.72" fill="none" />
      <Path d="M 58 132 C 110 135 170 127 210 127 L 340 127" stroke="#153E2D" strokeWidth="1.2" opacity="0.6" fill="none" />

      {/* Puertas y manijas */}
      <Path d="M 211 124 L 211 193" stroke="#1A4A36" strokeWidth="1.6" opacity="0.85" />
      <Path d="M 271 124 L 271 199" stroke="#1A4A36" strokeWidth="1.6" opacity="0.8" />
      <Rect x="222" y="143" width="19" height="5" rx="2.5" fill="url(#chromeGrad)" />
      <Rect x="282" y="144" width="19" height="5" rx="2.5" fill="url(#chromeGrad)" />

      {/* Pasos laterales y estribo */}
      <Path d="M 140 205 L 302 205" stroke="#101A16" strokeWidth="7" strokeLinecap="round" />
      <Path d="M 142 203 L 300 203" stroke="#76837C" strokeWidth="2" strokeLinecap="round" />

      {/* Frente: parrilla de 7 ranuras */}
      <G>
        <Rect x="55" y="138" width="56" height="36" rx="7" fill="#0C1512" stroke="#91A39A" strokeWidth="1.4" />
        {[0, 1, 2, 3, 4, 5, 6].map((slot) => (
          <Rect
            key={slot}
            x={59 + slot * 7.4}
            y="143"
            width="4.4"
            height="26"
            rx="2.2"
            fill="#14251E"
            stroke="#8E9F96"
            strokeWidth="0.8"
          />
        ))}
        <Rect x="55" y="136" width="56" height="4" rx="2" fill="url(#chromeGrad)" />
        <Rect x="55" y="172" width="56" height="4" rx="2" fill="url(#chromeGrad)" />
      </G>

      {/* Faros redondos */}
      <G>
        <Circle cx="123" cy="148" r="13.5" fill="#0B100E" />
        <Circle cx="123" cy="148" r="11.5" fill="url(#headlightGrad)" />
        <Circle cx="123" cy="148" r="4.4" fill="#FFFDF1" opacity="0.92" />
        <Circle cx="48" cy="151" r="10.5" fill="#0B100E" />
        <Circle cx="48" cy="151" r="8.6" fill="url(#headlightGrad)" />
        <Circle cx="48" cy="151" r="3.2" fill="#FFFDF1" opacity="0.9" />
        {/* Intermitentes ámbar */}
        <Rect x="122" y="164" width="14" height="5" rx="2.5" fill="#F3A73E" opacity="0.9" />
        <Rect x="42" y="165" width="11" height="4.5" rx="2.2" fill="#F3A73E" opacity="0.85" />
      </G>

      {/* Defensa delantera */}
      <G>
        <Path d="M 47 181 L 131 181 L 136 196 L 133 205 L 50 205 C 45 205 44 198 46 190 Z" fill="url(#bumperGrad)" opacity="0.95" />
        <Path d="M 50 202 L 132 202" stroke="#4C5961" strokeWidth="2" opacity="0.72" />
        <Circle cx="64" cy="193" r="5" fill="#E8EEF2" stroke="#6F7C84" strokeWidth="1.4" />
        <Circle cx="107" cy="193" r="5" fill="#E8EEF2" stroke="#6F7C84" strokeWidth="1.4" />
        <Rect x="76" y="188" width="20" height="10" rx="4" fill="#38444C" />
        <Path d="M 52 183 L 129 183" stroke="#F2F7FA" strokeWidth="1.2" opacity="0.75" />
      </G>

      {/* Espejo lateral */}
      <Path d="M 158 116 L 176 113 L 180 120 L 163 124 Z" fill="#245B43" stroke="#123726" strokeWidth="1.2" />
      <Path d="M 161 117 L 172 115 L 174 119 L 164 121 Z" fill="#96B6C5" opacity="0.75" />

      {/* Manija trasera y detalle */}
      <Path d="M 318 132 L 340 132 L 348 126" stroke="#D6EEE0" strokeWidth="1.2" opacity="0.4" fill="none" />

      {/* Ruedas y pasos de rueda */}
      <G>
        {/* Delantera */}
        <Circle cx="118" cy="207" r="43" fill="#06130D" />
        <Circle cx="118" cy="207" r="37" fill="url(#tireGrad)" />
        <Circle cx="118" cy="207" r="27" fill="#0A0E11" stroke="#2E373D" strokeWidth="1.5" />
        <Circle cx="118" cy="207" r="23" fill="url(#rimGrad)" />
        <Circle cx="118" cy="207" r="6" fill="#5D6A73" stroke="#E8F0F4" strokeWidth="1.5" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <Line
            key={angle}
            x1={118 + 6 * Math.cos((angle * Math.PI) / 180)}
            y1={207 + 6 * Math.sin((angle * Math.PI) / 180)}
            x2={118 + 21 * Math.cos((angle * Math.PI) / 180)}
            y2={207 + 21 * Math.sin((angle * Math.PI) / 180)}
            stroke="#EAEFF2"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        ))}
        <Path d="M 80 205 A 38 38 0 0 1 156 205" stroke="#1B4B37" strokeWidth="7" fill="none" />
        <Path d="M 82 201 A 36 36 0 0 1 154 201" stroke="#74B992" strokeWidth="1.4" fill="none" opacity="0.55" />

        {/* Trasera */}
        <Circle cx="328" cy="207" r="43" fill="#06130D" />
        <Circle cx="328" cy="207" r="37" fill="url(#tireGrad)" />
        <Circle cx="328" cy="207" r="27" fill="#0A0E11" stroke="#2E373D" strokeWidth="1.5" />
        <Circle cx="328" cy="207" r="23" fill="url(#rimGrad)" />
        <Circle cx="328" cy="207" r="6" fill="#5D6A73" stroke="#E8F0F4" strokeWidth="1.5" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <Line
            key={angle}
            x1={328 + 6 * Math.cos((angle * Math.PI) / 180)}
            y1={207 + 6 * Math.sin((angle * Math.PI) / 180)}
            x2={328 + 21 * Math.cos((angle * Math.PI) / 180)}
            y2={207 + 21 * Math.sin((angle * Math.PI) / 180)}
            stroke="#EAEFF2"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        ))}
        <Path d="M 290 205 A 38 38 0 0 1 366 205" stroke="#1B4B37" strokeWidth="7" fill="none" />
        <Path d="M 292 201 A 36 36 0 0 1 364 201" stroke="#74B992" strokeWidth="1.4" fill="none" opacity="0.55" />
      </G>

      {/* Matrícula y detalle trasero */}
      <Rect x="360" y="166" width="24" height="15" rx="3" fill="#DEE6E9" stroke="#64727A" strokeWidth="1" />
      <Rect x="363" y="170" width="18" height="2" rx="1" fill="#5A6870" />
      <Rect x="363" y="174" width="13" height="2" rx="1" fill="#5A6870" />
      <Circle cx="377" cy="145" r="5" fill="#B73A3A" opacity="0.9" />
      <Circle cx="381" cy="157" r="3.4" fill="#E4A43B" opacity="0.85" />

      {/* Insignia */}
      <SvgText
        x="320"
        y="151"
        fill="#D9F4E5"
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="2"
        opacity="0.82"
      >
        LIBERTY
      </SvgText>

      {/* Detalles de iluminación y contraste */}
      <Path
        d="M 60 132 C 110 134 170 126 210 126 L 340 126"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        opacity="0.28"
        fill="none"
      />
      <Path
        d="M 60 197 L 388 197"
        stroke="#0A1B13"
        strokeWidth="1.4"
        opacity="0.55"
        fill="none"
      />
    </Svg>
  );
}
