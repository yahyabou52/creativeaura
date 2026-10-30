(() => {
  "use strict";
  const canvas = document.getElementById("aura-sculptures");
  if (!canvas) return;
  const host = canvas.parentElement;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    premultipliedAlpha: false,
  });
  if (!gl) return;
  const vertex = `attribute vec3 position;attribute vec3 normal;uniform vec3 rotation;uniform vec3 translation;uniform float scale;uniform float aspect;varying vec3 vNormal;varying vec3 vPosition;varying vec3 vLocal;vec3 rotate(vec3 p,vec3 r){float c=cos(r.x),s=sin(r.x);p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);c=cos(r.y);s=sin(r.y);p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);c=cos(r.z);s=sin(r.z);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}void main(){vNormal=rotate(normal,rotation);vLocal=position;vPosition=rotate(position,rotation)*scale+translation;gl_Position=vec4(vPosition.x/aspect,vPosition.y,-vPosition.z*.13,1.);}`;
  const fragment = `precision mediump float;varying vec3 vNormal;varying vec3 vPosition;varying vec3 vLocal;uniform vec3 color;uniform float roughness;float random(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.6,1.,1.5));float diffuse=max(0.,dot(n,light));float fill=max(0.,dot(n,normalize(vec3(1.,.1,.4))));float rim=pow(1.-abs(n.z),3.);vec3 halfVector=normalize(light+vec3(0.,0.,1.));float spec=pow(max(dot(n,halfVector),0.),mix(20.,65.,roughness))*.22;float grain=(random(floor(vLocal*440.))-.5)*.035;vec3 surface=color*(.70+diffuse*.32+fill*.07)+spec+rim*.055+grain;float ao=.96-.06*(1.-abs(n.z));gl_FragColor=vec4(surface*ao,1.);}`;
  function compile(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw Error("Sculpture shader unavailable");
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch {
    return;
  }
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);
  const loc = {};
  ["rotation", "translation", "scale", "aspect", "color", "roughness"].forEach(
    (n) => (loc[n] = gl.getUniformLocation(program, n)),
  );
  const attr = {
    position: gl.getAttribLocation(program, "position"),
    normal: gl.getAttribLocation(program, "normal"),
  };
  const normalize = (v) => {
      const length = Math.hypot(...v) || 1;
      return v.map((x) => x / length);
    },
    cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  function path(t, type) {
    if (type === 0) {
      const r = 2 + 0.65 * Math.cos(3 * t);
      return [
        (r * Math.cos(2 * t)) / 2.8,
        (r * Math.sin(2 * t)) / 2.8,
        (0.65 * Math.sin(3 * t)) / 2.8,
      ];
    }
    if (type === 1) {
      const r = 0.78 + 0.13 * Math.cos(3 * t);
      return [r * Math.cos(t), r * Math.sin(t), 0.23 * Math.sin(3 * t)];
    }
    return [0.7 * Math.cos(t), 0.7 * Math.sin(t), 0.25 * Math.sin(2 * t)];
  }
  function mesh(type, tube) {
    const vertices = [],
      normals = [],
      indices = [],
      U = 180,
      V = 22;
    for (let i = 0; i <= U; i++) {
      const t = (i / U) * Math.PI * 2,
        p = path(t, type),
        p2 = path(t + 0.001, type),
        tangent = normalize(p2.map((v, j) => v - p[j])),
        axis = normalize(cross(tangent, [0, 0, 1])),
        binormal = normalize(cross(tangent, axis));
      for (let j = 0; j <= V; j++) {
        const a = (j / V) * Math.PI * 2,
          n = axis.map((v, k) => v * Math.cos(a) + binormal[k] * Math.sin(a));
        const radius = tube * (1 + 0.04 * Math.sin(5 * t));
        vertices.push(...p.map((v, k) => v + n[k] * radius));
        normals.push(...n);
      }
    }
    for (let i = 0; i < U; i++)
      for (let j = 0; j < V; j++) {
        const a = i * (V + 1) + j,
          b = a + V + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW,
    );
    return { position, normal, index, count: indices.length };
  }
  const meshes = [mesh(0, 0.19), mesh(1, 0.23), mesh(2, 0.19)];
  const colors = [
    [0.94, 0.95, 0.91],
    [0.5, 0.77, 0.86],
    [0.12, 0.31, 0.61],
    [0.95, 0.95, 0.92],
  ];
  let visible = true,
    ready = true,
    mx = 0,
    my = 0,
    px = 0,
    py = 0,
    aspect = 1;
  const observer = new IntersectionObserver(
    (e) => (visible = e[0].isIntersecting),
  );
  observer.observe(host);
  function resize() {
    if (!host.clientWidth || !host.clientHeight) return;
    const d = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(host.clientWidth * d);
    canvas.height = Math.round(host.clientHeight * d);
    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(loc.aspect, aspect);
  }
  resize();
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(host);
  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
  });
  host.addEventListener("pointerleave", () => {
    mx = 0;
    my = 0;
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    ready = false;
    canvas.classList.remove("ready");
    host.classList.remove("has-sculptures");
  });
  canvas.classList.add("ready");
  host.classList.add("has-sculptures");
  const started = performance.now();
  function draw(time) {
    if (!ready) return;
    if (visible && !document.hidden) {
      const motion = !document.documentElement.classList.contains("no-motion"),
        mobile = innerWidth <= 700,
        t = motion ? (time - started) * 0.00016 : 0,
        r = host.getBoundingClientRect(),
        scroll = motion ? Math.max(0, -r.top / Math.max(1, r.height)) : 0;
      if (motion) {
        px += (mx - px) * 0.045;
        py += (my - py) * 0.045;
      } else {
        px = 0;
        py = 0;
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const arrival = motion ? Math.min(1, (time - started) / 1600) : 1,
        ease = 1 - Math.pow(1 - arrival, 4);
      const objects = mobile
        ? [
            {
              m: 0,
              p: [-aspect * 1.16 - scroll * 0.2, -0.16 + scroll * 0.5, 0],
              s: 0.53,
              r: [0.3 + t, 0.5 + px * 0.3, -0.4 + scroll],
            },
            {
              m: 1,
              p: [aspect * 1.14 + scroll * 0.25, 0.28 + scroll * 0.25, -0.2],
              s: 0.43,
              r: [0.3 + t * 0.4, 0.5, -0.3 - t * 0.7],
            },
            {
              m: 2,
              p: [-aspect * 0.6, 0.68 + scroll * 0.2, 0.1],
              s: 0.13,
              r: [1.1, t, -0.6],
            },
            {
              m: 0,
              p: [aspect * 0.7, -0.64 - scroll * 0.1, 0.3],
              s: 0.16,
              r: [t * 0.8, 0.9, 0.6 - t],
            },
          ]
        : [
            {
              m: 0,
              p: [-aspect * 0.99 - scroll * 0.7, -0.23 + scroll * 0.45, 0],
              s: 0.93,
              r: [0.35 + t, 0.45 + px * 0.35, -0.45 + scroll * 0.7],
            },
            {
              m: 1,
              p: [aspect * 0.99 + scroll * 0.7, 0.12 + scroll * 0.1, -0.2],
              s: 0.72,
              r: [0.3 + t * 0.4, 0.5 - py * 0.3, -0.3 - t * 0.65],
            },
            {
              m: 2,
              p: [-aspect * 0.47 - scroll * 0.3, 0.69 + scroll * 0.35, 0.2],
              s: 0.19,
              r: [1.1, t, -0.6 + px * 0.3],
            },
            {
              m: 0,
              p: [aspect * 0.4 + scroll * 0.4, -0.5 - scroll * 0.18, 0.3],
              s: 0.235,
              r: [t * 0.8, 0.9, 0.6 - t],
            },
          ];
      objects.forEach((o, i) => {
        const m = meshes[o.m];
        gl.bindBuffer(gl.ARRAY_BUFFER, m.position);
        gl.enableVertexAttribArray(attr.position);
        gl.vertexAttribPointer(attr.position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.normal);
        gl.enableVertexAttribArray(attr.normal);
        gl.vertexAttribPointer(attr.normal, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.index);
        gl.uniform3fv(
          loc.rotation,
          new Float32Array(
            o.r.map(
              (v, k) => v + (motion ? (k === 0 ? py * 0.15 : px * 0.1) : 0),
            ),
          ),
        );
        gl.uniform3fv(loc.translation, new Float32Array(o.p));
        gl.uniform1f(loc.scale, o.s * (0.5 + ease * 0.5));
        gl.uniform3fv(loc.color, new Float32Array(colors[i]));
        gl.uniform1f(loc.roughness, 0.4);
        gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
      });
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
