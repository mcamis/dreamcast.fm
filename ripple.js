import * as THREE from "https://unpkg.com/three@0.167.0/build/three.module.js";

const CANVAS_HEIGHT = 400;
let camera, scene, renderer;

let materialShader;
//called on setup. Customize this
function initContent(scene, camera, renderer) {
  const ptLight = new THREE.PointLight(0xffffff, 5);
  const light = new THREE.AmbientLight(0x404040, 50); // soft white light
  light.decay = 0;
  light.position.set(0, 10, 10);
  ptLight.decay = 0;
  ptLight.position.set(0, 10, 10);

  scene.add(light);
  ptLight.position.set(0, 10, 10);
  window.light = ptLight;
  scene.add(ptLight);

  const texture = new THREE.TextureLoader().load( "21604.png" );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const mat = new THREE.MeshPhongMaterial({
    color: 0x6c87b8,
    // shininess: 50,
    visible: true,
    map: texture
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.time = { value: 0 };
    shader.vertexShader =
      `
                uniform float time;
            ` + shader.vertexShader;

    const token = "#include <begin_vertex>";
    // equation for normals from:
    // https://stackoverflow.com/questions/9577868/glsl-calculate-surface-normal
    const customTransform = `
                vec3 transformed = vec3(position);
                float dx = position.x;
                float dy = position.y;
                float freq = sqrt(dx*(dx * .4) + dy*(dy * .4));
                float amp = 0.25;
                float angle = -time*10.0+freq*2.0;
                transformed.z += sin(angle)*amp;

                objectNormal = normalize(vec3(0.0,-amp * freq * cos(angle), 2));
                vNormal = normalMatrix * objectNormal;
            `;
    shader.vertexShader = shader.vertexShader.replace(token, customTransform);
    materialShader = shader;
  };
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(30, 20, 100, 100), mat);
  plane.rotation.x = (-60 * Math.PI) / 180;
  plane.position.z = -10;
  plane.position.y = 1.5;
  scene.add(plane);
}

function render(time) {
  if (materialShader) materialShader.uniforms.time.value = time / 12000;
  renderer.render(scene, camera);
}

function initScene() {

  const container = document.querySelector("#canvas");
  scene = new THREE.Scene();
  scene.background = null;
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / CANVAS_HEIGHT,
    0.1,
    100
  );
  window.camera = camera;
  camera.position.y = -2;
  camera.rotateX(0.15);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, CANVAS_HEIGHT);
  container.appendChild(renderer.domElement);

  initContent(scene, camera, renderer);

  window.addEventListener(
    "resize",
    () => {
      camera.aspect = window.innerWidth / CANVAS_HEIGHT;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, CANVAS_HEIGHT);
    },
    false
  );
}

initScene();
renderer.setAnimationLoop(render);
