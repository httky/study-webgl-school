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
      cameraY: 1.0,
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
      followerCameraHelperVisible: true,
      orthoCameraHelperVisible: false,
      followerCameraPositionY: -4.0,
    }
    this.stats = undefined
    this.gui = undefined
    this.renderer = undefined
    this.scene = undefined
    this.camera = undefined
    this.cameraHelper = undefined
    this.followerCamera = undefined
    this.followerCameraHelper = undefined
    this.orthoCamera = undefined
    this.orthoCameraHelper = undefined
    this.directionalLight = undefined
    this.directionalLightHelper = undefined
    this.ambientLight = undefined
    this.material = undefined
    this.earthGeometry = undefined
    this.planeGroup = undefined
    this.plane = undefined
    this.planeGeometry = undefined
    this.meshes = undefined
    this.controls = undefined
    this.axesHelper = undefined
    this.degrees = 0
    this.planeRadius = this.params.earthRadius + 0.4
    this.startPlaneVector = new THREE.Vector3(0, 0, 0)
    this.endPlaneVector = new THREE.Vector3(0, 0, 0)
    this.isUpdate = true

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
    this.renderer.autoClear = false
    this.container.appendChild(this.renderer.domElement)

    // scene
    this.scene = new THREE.Scene()

    const screenAspect = this.screen.width / this.screen.height

    // camera
    this.camera = new THREE.PerspectiveCamera(
      this.params.cameraFovy,
      screenAspect,
      this.params.cameraNear,
      this.params.cameraFar
    )
    this.camera.position.set(
      this.params.cameraX,
      this.params.cameraY,
      this.params.cameraZ
    )
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))

    // 追従カメラ
    this.followerCamera = new THREE.PerspectiveCamera(
      30,
      screenAspect,
      1.0,
      4.5
    )

    // 視点カメラ
    this.orthoCamera = new THREE.OrthographicCamera(
      this.screen.width / -2,
      this.screen.width / 2,
      this.screen.height / 2,
      this.screen.height / -2,
      1.5,
      4.5
    )
    this.orthoCamera.position.z = 3.0
    this.scene.add(this.orthoCamera)

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

    this.updateSize()

    // axesHelper
    this.axesHelper = new THREE.AxesHelper(5)
    this.axesHelper.visible = this.params.axesHelperVisible
    this.scene.add(this.axesHelper)

    this.orthoCameraHelper = new THREE.CameraHelper(this.orthoCamera)
    this.orthoCameraHelper.visible = false
    this.scene.add(this.orthoCameraHelper)

    // followerCameraHelper
    this.followerCameraHelper = new THREE.CameraHelper(this.followerCamera)
    this.followerCameraHelper.visible = false
    this.scene.add(this.followerCameraHelper)

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
    this.gui.add(this.params, 'followerCameraPositionY', -5.0, -1.0).name('followerCamDist').onChange(() => {
      this.followerCamera.position.y = this.params.followerCameraPositionY
    })
    const helperFolder = this.gui.addFolder('helper')
    helperFolder.add(this.params, 'axesHelperVisible').name('axes').onChange(() => {
      this.axesHelper.visible = this.params.axesHelperVisible
    })
    helperFolder.add(this.params, 'followerCameraHelperVisible').name('followerCamera').onChange(() => {
      this.followerCameraHelper.visible = this.params.followerCameraHelperVisible
    })
    helperFolder.add(this.params, 'orthoCameraHelperVisible').name('orthoCamera').onChange(() => {
      this.orthoCameraHelper.visible = this.params.orthoCameraHelperVisible
    })

    this.gui.add({ toggle: () => {
        this.isUpdate = !this.isUpdate
        this.renderer.setAnimationLoop(this.isUpdate ? this.update : null)
      } }, 'toggle').name('pause/play')
  }
  /**
   * createMeshes
   */
  createMeshes() {
    const texture = new THREE.TextureLoader().load('./earth.png')
    const group = new THREE.Group()
    // material
    this.material = new THREE.MeshPhongMaterial({ color: this.params.materialColor })

    const earthMaterial = new THREE.MeshBasicMaterial({
      color: this.params.materialColor,
      wireframe: true,
      // map: texture,
    })
    // geometry
    this.earthGeometry = new THREE.SphereGeometry(
      this.params.earthRadius,
      this.params.earthSegments,
      this.params.earthSegments
    )

    const mesh = new THREE.Mesh(this.earthGeometry, earthMaterial)

    group.add(mesh)

    this.planeGroup = new THREE.Group()
    this.planeGroup.position.x = this.planeRadius
    this.planeGroup.rotation.y = Math.PI / 2

    this.planeGeometry = new THREE.ConeGeometry(0.08, 0.3, 32)
    this.plane = new THREE.Mesh(this.planeGeometry, this.material)
    this.planeGroup.add(this.plane)

    // followerCamera
    // 一定距離離す
    this.followerCamera.position.set(0.0, this.params.followerCameraPositionY, 0.0)
    this.followerCamera.lookAt(this.plane.position)
    this.planeGroup.add(this.followerCamera)

    group.add(this.planeGroup)

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
    const screenAspect = this.screen.width / this.screen.height

    this.renderer.setSize(this.screen.width, this.screen.height)
    // 俯瞰カメラは画面半分にするので、アスペクト比も横半分にする
    this.camera.aspect = screenAspect * 0.5
    this.camera.updateProjectionMatrix()

    this.followerCamera.aspect = screenAspect
    this.followerCamera.updateProjectionMatrix()

    const fov = this.camera.fov * (Math.PI / 180)
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect

    this.viewport = {
      width,
      height,
    }

    this.orthoCamera.left = (this.viewport.width * 1.0) / -1.5
    this.orthoCamera.right = (this.viewport.width * 1.0) / 1.5
    this.orthoCamera.top = (this.viewport.height * 0.5) / 1.5
    this.orthoCamera.bottom = (this.viewport.height * 0.5) / -1.5
    this.orthoCamera.updateProjectionMatrix()
  }
  /**
   * update
   */
  update() {
    this.controls.update()

    this.degrees += this.params.planeSpeed

    const radian = degToRad(this.degrees)

    // planeの位置を更新する
    this.startPlaneVector = this.planeGroup.position.clone()
    this.planeGroup.position.x = (this.planeRadius) * Math.cos(radian)
    this.planeGroup.position.y = (this.planeRadius) * Math.sin(radian)
    this.planeGroup.position.z = Math.cos(radian * 3) * 0.6
    this.endPlaneVector = this.planeGroup.position.clone()

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
    this.planeGroup.quaternion.premultiply(qtn)

    this.directionalLightHelper.update()
    this.followerCamera.updateProjectionMatrix()
    this.followerCameraHelper.update()
    this.orthoCamera.updateProjectionMatrix()
    this.orthoCameraHelper.update()

    this.renderer.clear()

    this.followerCameraHelper.visible = false
    this.orthoCameraHelper.visible = false

    this.renderer.setViewport(0, 0, this.screen.width / 2, this.screen.height / 2)
    this.renderer.render(this.scene, this.followerCamera)

    this.renderer.setViewport(0, this.screen.height / 2, this.screen.width / 2, this.screen.height / 2)
    this.renderer.render(this.scene, this.orthoCamera)

    this.followerCameraHelper.visible = this.params.followerCameraHelperVisible
    this.orthoCameraHelper.visible = this.params.orthoCameraHelperVisible

    this.renderer.setViewport(this.screen.width / 2, 0, this.screen.width / 2, this.screen.height)
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
