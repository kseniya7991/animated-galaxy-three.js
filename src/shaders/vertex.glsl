uniform float uSize;
uniform float uTime;

uniform bool uAutoRotate;
uniform float uAutoRotateSpeed;

attribute float aSize;
attribute vec3 aRandomness;

varying vec3 vColor;

void main() {
    /*
    * Position
    */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    /*
    * Spin
    */
    float distanceToCenter = length(modelPosition.xz);
    float angle = atan(modelPosition.z, modelPosition.x);

    float speed = uAutoRotate ? uTime * uAutoRotateSpeed : 0.0;

    float angleOffset = (1.0 / distanceToCenter) * speed;

    angle += angleOffset;

    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    //Randomness
    modelPosition.xyz += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /*
    * Size 
    */
    gl_PointSize = uSize * aSize;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = color;

}