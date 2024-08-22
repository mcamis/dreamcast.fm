import * as THREE from "https://unpkg.com/three@0.167.0/build/three.module.js";

const CANVAS_HEIGHT = 400;
let camera, scene, renderer;
let materialShader;

class DreamcastRipple {
  constructor(speed) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      35, // fov
      window.innerWidth / CANVAS_HEIGHT, // aspect ratio
      0.1, // near clipping plane
      200 // far clipping plane
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.setupScene();
    this.render()
  }

  setupScene() {
    this.scene.background = null;
    this.camera.position.y = -2;
    this.camera.position.z = 20;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, CANVAS_HEIGHT);

    // Lights
    const pointLight = new THREE.PointLight(0xffffff, 5);
    const light = new THREE.AmbientLight(0x404040, 50); // soft white light
    // TODO, can we init with this?
    light.decay = 0;
    light.position.set(0, 0, 10);
    pointLight.decay = 0;
    pointLight.position.set(10, 10, 20);

    this.scene.add(light);
    this.scene.add(pointLight);

    // Setup Wave Material and Shaders
    const texture = new THREE.TextureLoader().load("21604.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const mat = new THREE.MeshPhongMaterial({
      color: 0x6c87b8,
      visible: true,
      map: texture,
    });

    // Action
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.vertexShader =`
                uniform float time;
            ` + shader.vertexShader;

      const token = "#include <begin_vertex>";
      // equation for normals from:
      // https://stackoverflow.com/questions/9577868/glsl-calculate-surface-normal
      const customTransform = `
                vec3 transformed = vec3(position);
                float dx = position.x;
                float dy = position.y;
                float freq = sqrt(dx*(dx * .2) + dy*(dy * .2));
                float amp = 0.75;
                float angle = -time*10.0+freq*2.0;
                transformed.z -= sin(angle)*amp;

                objectNormal = normalize(vec3(0.0,-amp * freq * cos(angle), 3));
                vNormal = normalMatrix * objectNormal;
            `;
      shader.vertexShader = shader.vertexShader.replace(token, customTransform);
      materialShader = shader;
    };
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(25, 25, 100, 100),
      mat
    );

    let  b_box = new THREE.Box3().setFromObject(plane);
    // let ratio = b_box.getSize().x;
    plane.scale.set(2, 1, 1)
    plane.rotation.x = (-50 * Math.PI) / 180;
    plane.position.z = -12;
    plane.position.y = -2;
    this.scene.add(plane);
  }

  render() {
    const container = document.querySelector("#canvas");
    container.appendChild(this.renderer.domElement);
    window.addEventListener(
      "resize",
      () => {
        this.camera.aspect = window.innerWidth / CANVAS_HEIGHT;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, CANVAS_HEIGHT);
      },
      false
    );
    this.renderer.setAnimationLoop(this.animationLoop.bind(this));
  }

  animationLoop(time) {
    if (materialShader) materialShader.uniforms.time.value = time / 20000;
    this.renderer.render(this.scene, this.camera);
  }
}

new DreamcastRipple();