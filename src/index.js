import * as THREE from "three";
import { gsap, Power4 } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
/*-- PointsBlender用 --*/
import blenderFrag from "./shaders/blenderFrag.glsl?raw";
import blenderVertex from "./shaders/blenderVertex.glsl?raw";
/*-- 通常のBlender用 --*/
import blenderFrag02 from "./shaders/objBlenderFrag.glsl?raw";
import blenderVertex02 from "./shaders/objBlenderVertex.glsl?raw";
/*--  --*/
import fragmentShader from "./shaders/fragmentShader.glsl?raw";
import vertexShader from "./shaders/vertexShader.glsl?raw";
/*--  --*/
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DotScreenShader } from "./CustomShader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// reference :
// https://www.youtube.com/watch?v=0zPSfCvUoQ4
// https://qiita.com/d2cid-kimura/items/40814d9fcb4cb32f6884
// https://www.maya-ndljk.com/blog/threejs-basic-toon-shader

class App {
  /**
   * レンダー
   */
  static get RENDERER_SETTING() {
    return {
      clearColor: 0x111111,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * マテリアル
   */
  static get MATERIAL_SETTING() {
    return {
      color: 0xffffff,
    };
  }
  /**
   * カメラ
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.01,
      far: 200000.0,
      x: 0.3,
      y: -0.1,
      z: 0.6,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }

  /**
   * @constructor
   */
  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.geometory;
    this.material;
    this.mesh;
    this.array = [];
    this.group;
    this.controls;
    this.composer;
    this.model;
    this.ambientLight;
    this.directionalLight;
    this.gltf;
    this.loader;
    this.texture;
    this.Geometry = [];
    this.raycaster;
    this.sampler;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.render = this.render.bind(this);
  }

  _setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(App.RENDERER_SETTING.width, App.RENDERER_SETTING.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMappingExposure = 1.75;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = document.querySelector("#webgl");
    canvas.appendChild(this.renderer.domElement);
  }

  _setScene() {
    this.scene = new THREE.Scene();
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(App.CAMERA_PARAM.fovy, App.CAMERA_PARAM.aspect, App.CAMERA_PARAM.near, App.CAMERA_PARAM.far);
    this.camera.position.set(App.CAMERA_PARAM.x, App.CAMERA_PARAM.y, App.CAMERA_PARAM.z);
    this.camera.lookAt(App.CAMERA_PARAM.lookAt);
    this.camera.updateProjectionMatrix();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  _setLight() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    this.directionalLight.position.set(-1.0, 110.0, 0.0);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 4096;
    this.directionalLight.shadow.mapSize.height = 4096;
    this.directionalLight.shadow.camera.near = 2;
    this.directionalLight.shadow.camera.far = 15;

    this.scene.add(this.ambientLight);
    this.scene.add(this.directionalLight);
  }

  getGeometryData() {
    return new Promise((resolve) => {
      const gltfPath = "./myBlend.glb";
      const loader = new GLTFLoader();

      loader.load(gltfPath, (gltf) => {
        this.gltf = gltf;
        this.gltf.scene.scale.set(0.11, 0.11, 0.11);
        this.gltf.scene.rotation.set(0.1, -1.3, 0.0);
        this.gltf.scene.position.set(0.35, -0.27, 0.2);
        //モデルの情報を格納
        this.sampler = new MeshSurfaceSampler(this.gltf.scene.children[0]).build();
        resolve();
      });
    });
  }

  _setPointsMesh() {
    const vertices = [];
    const tempPosition = new THREE.Vector3();
    this.pointsGeometry = new THREE.BufferGeometry();

    for (let i = 0; i < 20000; i++) {
      this.sampler.sample(tempPosition);
      vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
    }

    this.pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    this.pointsMaterial = new THREE.RawShaderMaterial({
      vertexShader: blenderVertex,
      fragmentShader: blenderFrag,
      uniforms: {
        uTime: { value: 0.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.mesh.scale.set(0.01, 0.01, 0.01);
    this.mesh.rotation.set(1.7, 0.0, 1.3);
    this.mesh.position.set(0.35, -0.27, 0.2);

    this.scene.add(this.mesh);
  }

  _setBackgroundPlane() {
    this.Boxgeometry = new THREE.PlaneGeometry(10.5, 10.5, 1000, 1000);
    this.Boxmaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
      },
      side: THREE.DoubleSide,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    this.Boxmesh = new THREE.Mesh(this.Boxgeometry, this.Boxmaterial);
    this.Boxmesh.position.z = 0.01;
    // this.scene.add(this.Boxmesh);
  }

  initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const effect1 = new ShaderPass(DotScreenShader);
    effect1.uniforms["scale"].value = 4;
    this.composer.addPass(effect1);
  }

  init() {
    this._setRenderer();
    this._setScene();
    this._setCamera();
    this._setLight();
    this._setPointsMesh();
    this._setBackgroundPlane();
    this.initPost();
  }

  render() {
    requestAnimationFrame(this.render);
    this.controls.update();
    this.mesh.material.uniforms.uTime.value += 0.002;
    this.composer.render(this.scene, this.camera);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.getGeometryData().then(() => {
    app.init();
    app.render();
    window.addEventListener("resize", () => {
      app.onResize();
    });
  });
});

export {};
