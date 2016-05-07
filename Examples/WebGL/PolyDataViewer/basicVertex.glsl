
attribute vec3 a_position;

varying vec3 v_color;

void main() {
    gl_Position = vec4(a_position.xyz, 1.0);
    gl_PointSize = 5.5;
    v_color = vec3(1.0, 1.0, 1.0);
}
