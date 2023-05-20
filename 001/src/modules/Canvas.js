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
    // this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    // FIXME: 思った見た目と違う... OrbitControlsかましてるから？
    // このへん見てみる
    // https://threejs.org/examples/#webgl_camera
    this.cameraHelper = new THREE.CameraHelper(this.camera)
    this.cameraHelper.visible = false
    this.scene.add(this.cameraHelper)

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
    const boxFolder = this.gui.addFolder('box')
    boxFolder.add(this.params, 'boxNum', 0, 1000).name('num').step(1).onChange(() => {
      this.disposeMeshes()
      this.meshes = this.createMeshes()
      this.scene.add(this.meshes)
    })
    boxFolder.add(this.params, 'boxSize', 0, 10).name('size').step(0.01).onChange(() => {
      this.meshes.children.forEach((mesh) => {
        mesh.scale.set(this.params.boxSize, this.params.boxSize, this.params.boxSize)
      })
    })
    boxFolder.addColor(this.params, 'materialColor').name('color').onChange(() => {
      this.meshes.children.forEach((mesh) => {
        mesh.material.color = new THREE.Color(this.params.materialColor)
      })
    })

    const direcrionalLightFolder = this.gui.addFolder('direcrionalLight')
    direcrionalLightFolder.addColor(this.params, 'dLightColor').name('color').onChange(() => {
      this.directionalLight.color = new THREE.Color(this.params.dLightColor)
    })
    direcrionalLightFolder.add(this.params, 'dLightIntensity', 0, 1).name('intensity').step(0.1).onChange(() => {
      this.directionalLight.intensity = this.params.dLightIntensity
    })
    direcrionalLightFolder.add(this.params, 'dLightX', -10, 10).name('x').step(0.1).onChange(() => {
      this.directionalLight.position.x = this.params.dLightX
    })
    direcrionalLightFolder.add(this.params, 'dLightY', -10, 10).name('y').step(0.1).onChange(() => {
      this.directionalLight.position.y = this.params.dLightY
    })
    direcrionalLightFolder.add(this.params, 'dLightZ', -10, 10).name('z').step(0.1).onChange(() => {
      this.directionalLight.position.z = this.params.dLightZ
    })
    direcrionalLightFolder.add(this.params, 'dLightVisible').name('visible').onChange(() => {
      this.directionalLightHelper.visible = this.params.dLightVisible
    })

    const ambientLightFolder = this.gui.addFolder('ambientLight')
    ambientLightFolder.addColor(this.params, 'aLightColor').name('color').onChange(() => {
      this.ambientLight.color = new THREE.Color(this.params.aLightColor)
    })
    ambientLightFolder.add(this.params, 'aLightIntensity', 0, 1).name('intensity').step(0.1).onChange(() => {
      this.ambientLight.intensity = this.params.aLightIntensity
    })

    const axesHelperFolder = this.gui.addFolder('axesHelper')
    axesHelperFolder.add(this.params, 'axesHelperVisible').name('visible').onChange(() => {
      this.axesHelper.visible = this.params.axesHelperVisible
    })
  }
  /**
   * createMeshes
   */
  createMeshes() {
    // TODO: 距離（screenの中心座標とか）に応じて色を変えてみる
    // TODO: sin波などのパス上に配置してみる（変更できるベジェ曲線とかだと最高）
    // TODO: ランダムな配置情報をメモ化してみる（パラメータかえる毎に位置がリセットされないように）
    const group = new THREE.Group()
    // material
    this.material = new THREE.MeshPhongMaterial({ color: this.params.materialColor })
    // geometry
    this.boxGeometry = new THREE.BoxGeometry(
      this.params.boxSize,
      this.params.boxSize,
      this.params.boxSize
    )

    const halfViewportWidth = this.viewport.width / 2
    const halfViewportHeight = this.viewport.height / 2

    for (let i = 0; i < this.params.boxNum; i++) {
      const mesh = new THREE.Mesh(this.boxGeometry, this.material)
      // randomパターン
      mesh.position.set(
        Math.random() * this.viewport.width - (this.viewport.width / 2),
        Math.random() * this.viewport.height - (this.viewport.height / 2),
        Math.random() * 10 - 5
      )

      // randomパターン2
      // mesh.position.set(
      //   Math.random() * this.viewport.width - (this.viewport.width / 2),
      //   0,
      //   Math.random() * 10 - 5
      // )

      // 横整列
      // mesh.position.set(
      //   map(i, -halfViewportWidth, halfViewportWidth, 0, this.params.boxNum),
      //   0,
      //   0
      // )

      // sin波に沿って配置
      // mesh.position.set(
      //   map(i, -halfViewportWidth, halfViewportWidth, 0, this.params.boxNum),
      //   map(Math.sin((i * 2 % 360) * Math.PI / 180), -halfViewportHeight, halfViewportHeight, -1, 1),
      //   0
      // )

      group.add(mesh)
    }

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

    this.cameraHelper.update()
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
