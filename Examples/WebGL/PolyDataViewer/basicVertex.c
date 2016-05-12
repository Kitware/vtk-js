
attribute vec3 a_position;

uniform mat4 mvp;

varying vec3 v_color;

void main() {
    gl_Position = mvp * vec4(a_position.xyz, 1.0);
    gl_PointSize = 5.5;
    v_color = vec3(1.0, 1.0, 1.0);
}
