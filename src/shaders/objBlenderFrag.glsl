precision mediump float;
#include <common>
#include <lights_pars_begin>

varying float vNoise;
uniform vec3 uColor;

varying vec3 vNormal;

void main() {
  float NdotL = dot(vNormal, directionalLights[0].direction);
  float lightIntensity = smoothstep(0.0, 0.1, NdotL);
  vec3 directionalLight = directionalLights[0].color * lightIntensity;

     vec3 color1 = vec3(0.0,0.0,0.3);
        vec3 color2 = vec3(0.1,0.1,0.2); 
         vec3 finalColor = mix(color1,color2,0.02*(vNoise * 20.0));
  gl_FragColor = vec4(uColor * (ambientLightColor + directionalLight), 1.0) * vec4(finalColor, 1.0) + vec4(vNoise);
}