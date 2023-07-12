import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { map } from '@/utils/'

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
      boxSize: 0.4,
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
      axesHelperVisible: false,
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
    this.boxGeometry = undefined
    this.meshes = undefined
    this.controls = undefined
    this.axesHelper = undefined

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
    this.boxGeometry = new THREE.BoxGeometry(
      this.params.boxSize,
      this.params.boxSize,
      this.params.boxSize
    )

    const mesh = new THREE.Mesh(this.boxGeometry, this.material)

    group.add(mesh)

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

    this.meshes.children.forEach((mesh) => {
      mesh.rotation.y += 0.01
    })

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
