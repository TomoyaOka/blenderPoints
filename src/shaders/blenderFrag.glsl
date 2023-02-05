precision mediump float;
varying float vNoise;

      void main() {
          vec2 temp = gl_PointCoord - vec2(0.1);
          float f = dot(temp, temp);
          if (f > 0.1 ) {
              discard;
          }

        vec3 color1 = vec3(0.8,0.4,0.0);
        vec3 color2 = vec3(0.0,0.0,0.0); 
         vec3 finalColor = mix(color1,color2,0.02*(vNoise * 20.0));
        gl_FragColor = vec4(finalColor, 1.0) + vec4(vNoise);

      }