import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { map, degToRad } from '@/utils/'

export class Canvas {
  constructor({ container }) {
    this.container = container
    this.screen = {
      width: 0,
      height: 0,
    }
    this.viewport = {
      width: 0,
      height: 0,
    }
    this.params = {
      boxNum: 100,
      earthRadius: 1.2,
      earthSegments: 32,
      planeSpeed: 0.8,
      cameraFovy: 60,
      cameraNear: 0.01,
      cameraFar: 100.0,
      cameraX: 0.0,
      cameraY: 2.0,
      cameraZ: 5.0,
      clearColor: 0x000000,
      materialColor: 0x3399ff,
      dLightColor: 0xffffff,
      dLightIntensity: 1.0,
      dLightX: 1.0,
      dLightY: 1.0,
      dLightZ: 1.0,
      dLightVisible: false,
      aLightColor: 0xffffff,
      aLightIntensity: 0.2,
      axesHelperVisible: true,
    }
    this.stats = undefined
    this.gui = undefined
    this.renderer = undefined
    this.scene = undefined
    this.camera = undefined
    this.cameraHelper = undefined
    this.directionalLight = undefined
    this.directionalLightHelper = undefined
    this.ambientLight = undefined
    this.material = undefined
    this.earthGeometry = undefined
    this.plane = undefined
    this.planeGeometry = undefined
    this.meshes = undefined
    this.controls = undefined
    this.axesHelper = undefined
    this.degrees = 0
    this.planeRadius = this.params.earthRadius + 0.4
    this.startPlaneVector = new THREE.Vector3(0, 0, 0)
    this.endPlaneVector = new THREE.Vector3(0, 0, 0)

    // bind
    this.update = this.update.bind(this)
    this.onResize = this.onResize.bind(this)

    this.setup()
  }
  /**
   * setup
   */
  setup() {
    this.createDebug()

    // renderer
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(new THREE.Color(this.params.clearColor))
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.renderer.setAnimationLoop(this.update)
    this.container.appendChild(this.renderer.domElement)

    // scene
    this.scene = new THREE.Scene()
    this.scene.rotation.y = degToRad(-45)

    // camera
    this.camera = new THREE.PerspectiveCamera(
      this.params.cameraFovy,
      this.screen.width / this.screen.height,
      this.params.cameraNear,
      this.params.cameraFar
    )
    this.camera.position.set(
      this.params.cameraX,
      this.params.cameraY,
      this.params.cameraZ
    )
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    // light
    this.directionalLight = new THREE.DirectionalLight(
      this.params.dLightColor,
      this.params.dLightIntensity,
    )
    this.directionalLight.position.set(
      this.params.dLightX,
      this.params.dLightY,
      this.params.dLightZ,
    )
    this.scene.add(this.directionalLight)
    this.directionalLightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 5)
    this.directionalLightHelper.visible = this.params.dLightVisible
    this.scene.add(this.directionalLightHelper)

    this.ambientLight = new THREE.AmbientLight(
      this.params.aLightColor,
      this.params.aLightIntensity,
    )
    this.scene.add(this.ambientLight)

    // axesHelper
    this.axesHelper = new THREE.AxesHelper(5)
    this.axesHelper.visible = this.params.axesHelperVisible
    this.scene.add(this.axesHelper)

    this.updateSize()
    this.meshes = this.createMeshes()
    this.scene.add(this.meshes)
    this.attachEvents()
  }
  /**
   * dispose
   */
  dispose() {}
  /**
   * attachEvents
   */
  attachEvents() {
    window.addEventListener('resize', this.onResize, false)
  }
  /**
   * detachEvents
   */
  detachEvents() {
    window.removeEventListener('resize', this.onResize, false)
  }
  /**
   * createDebug
   */
  createDebug() {
    // stats
    this.stats = new Stats()
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)

    // gui
    this.gui = new GUI()

    this.gui.add(this.params, 'planeSpeed', 0.0, 2.0).name('planeSpeed')
    const axesHelperFolder = this.gui.addFolder('axesHelper')
    axesHelperFolder.add(this.params, 'axesHelperVisible').name('visible').onChange(() => {
      this.axesHelper.visible = this.params.axesHelperVisible
    })
  }
  /**
   * createMeshes
   */
  createMeshes() {
    const group = new THREE.Group()
    // material
    this.material = new THREE.MeshPhongMaterial({ color: this.params.materialColor })
    // geometry
    this.earthGeometry = new THREE.SphereGeometry(
      this.params.earthRadius,
      this.params.earthSegments,
      this.params.earthSegments
    )

    const mesh = new THREE.Mesh(this.earthGeometry, this.material)

    group.add(mesh)

    this.planeGeometry = new THREE.ConeGeometry(0.1, 0.4, 32)
    this.plane = new THREE.Mesh(this.planeGeometry, this.material)
    this.plane.position.set(this.planeRadius, 0, 0)

    group.add(this.plane)

    return group
  }
  /**
   * disposeMeshes
   */
  disposeMeshes() {
    this.meshes.children.forEach((mesh) => {
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
    this.scene.remove(this.meshes)
  }
  /**
   * updateSize
   */
  updateSize() {
    this.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.aspect = this.screen.width / this.screen.height
    this.camera.updateProjectionMatrix()

    const fov = this.camera.fov * (Math.PI / 180)
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect

    this.viewport = {
      width,
      height,
    }
  }
  /**
   * update
   */
  update() {
    this.controls.update()

    // this.meshes.rotation.y += 0.01
    this.degrees += this.params.planeSpeed
    const radian = degToRad(this.degrees)

    // planeの位置を更新する
    this.startPlaneVector = this.plane.position.clone()
    this.plane.position.x = (this.planeRadius) * Math.cos(radian)
    this.plane.position.y = (this.planeRadius) * Math.sin(radian)
    this.endPlaneVector = this.plane.position.clone()

    // planeの向きを更新する
    // 外積で回転軸を求める
    const axis = this.startPlaneVector.clone().cross(this.endPlaneVector)
    // 正規化する
    axis.normalize()
    // 内積で回転角を求める
    const angle = this.startPlaneVector.angleTo(this.endPlaneVector)

    // クオータニオンの定義
    const qtn = new THREE.Quaternion()
    qtn.setFromAxisAngle(axis, angle)
    this.plane.quaternion.premultiply(qtn)

    this.directionalLightHelper.update()

    this.renderer.render(this.scene, this.camera)
    this.stats.update()
  }
  /**
   * resizeイベントのハンドラ
   */
  onResize() {
    this.updateSize()
  }
}
