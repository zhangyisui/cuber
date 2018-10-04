import * as THREE from "three";

import Cube from "./cube";
import Tweener from "./tweener";
import Controller from "./controller";
import Twister from "./twister";
import Group from "./group";

export default class Game {
  public static readonly SIZE: number = 1024;
  public container: Element;
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public lock: boolean = false;
  public enable: boolean = true;

  public cube: Cube;
  public tweener: Tweener;
  public twister: Twister;
  public controller: Controller;
  public camera: THREE.PerspectiveCamera;

  public dirty = true;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.rotation.x = Math.PI / 8;
    this.scene.rotation.y = Math.PI / 16 - Math.PI / 4;
    this.camera = new THREE.PerspectiveCamera(50, 1, 1, Game.SIZE);
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = Game.SIZE / 3;
    this.tweener = new Tweener();
    this.twister = new Twister(this);
    this.cube = new Cube(this);

    this.scene.add(this.cube);
    for (let key in Group.GROUPS) {
      this.scene.add(Group.GROUPS[key]);
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.canvas = this.renderer.domElement;
    this.controller = new Controller(this);

    this.loop();
  }

  reset() {
    if (!this.lock) {
      this.cube.reset();
      this.dirty = true;
    }
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    let min = ((height / Math.min(width, height)) * Game.SIZE) / 4;
    let fov = (2 * Math.atan(min / Game.SIZE) * 180) / Math.PI;
    this.camera.fov = fov;
    this.camera.lookAt(this.scene.position);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, true);
    this.dirty = true;
  }

  render() {
    this.twister.update();
    this.tweener.update();
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  }

  loop() {
    requestAnimationFrame(this.loop.bind(this));
    this.render();
  }
}
