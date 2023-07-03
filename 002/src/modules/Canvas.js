import * as THREE from 'three'
import * as CANNON from 'cannon-es'
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
      helperVisible: import.meta.env.VITE_ENV === 'development',
      isSwinging: false,
      // fanPower: 0.00,
      fanPower: 0.10,
      Nx: 15,
      Ny: 15,
      mass: 1,
      clothSize: 1,
      sphereSize: 0.2,
      movementRadius: 0.2,
      timeStep: 1 / 60,
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
    this.fanHead = undefined
    this.fan = undefined
    this.controls = undefined
    this.axesHelper = undefined
    this.countTime = 0
    this.arrowHelper = undefined

    this.world = undefined
    this.particles = []
    this.dist = undefined
    this.clothGeometry = undefined
    this.clothMesh = undefined
    this.sphereBody = undefined
    this.sphereMesh = undefined

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
    this.axesHelper.visible = this.params.helperVisible
    this.scene.add(this.axesHelper)

    this.updateSize()
    this.meshes = this.createMeshes()

    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    })

    this.createCloth()
    this.createSphere()

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
    this.gui.add(this.params, 'isSwinging').name('isSwinging')
    this.gui.add(this.params, 'fanPower', 0.0, 0.3).name('fanPower')

    const helperFolder = this.gui.addFolder('helper')
    helperFolder.add(this.params, 'helperVisible').name('visible').onChange(() => {
      this.axesHelper.visible = this.params.helperVisible
      this.arrowHelper.visible = this.params.helperVisible
      this.sphereMesh.visible = this.params.helperVisible
    })
  }
  /**
   * createMeshes
   */
  createMeshes() {
    const group = new THREE.Group()

    // material 共通
    this.material = new THREE.MeshPhongMaterial({ color: this.params.materialColor })

    // 台座
    const pedestalGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16)
    const pedestalMesh = new THREE.Mesh(pedestalGeometry, this.material)
    pedestalMesh.position.set(0, -1.0, 0)
    group.add(pedestalMesh)

    // 支柱
    const strutGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 16)
    const strutMesh = new THREE.Mesh(strutGeometry, this.material)
    strutMesh.position.set(0, -0.5, 0)
    group.add(strutMesh)

    // ファン頭部
    this.fanHead = new THREE.Group()

    // モーター
    this.boxGeometry = new THREE.BoxGeometry(
      this.params.boxSize,
      this.params.boxSize,
      this.params.boxSize
    )

    const mesh = new THREE.Mesh(this.boxGeometry, this.material)
    this.fanHead.add(mesh)

    // ファン
    this.fan = new THREE.Group()
    this.fan.position.set(0, 0, 0.28)
    this.fan.rotation.x = degToRad(90)
    const fanGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16)
    const fanMesh = new THREE.Mesh(fanGeometry, this.material)
    fanMesh.scale.set(0.6, 0.6, 0.6)

    const panelNum = 8
    const panelGeometry = new THREE.BoxGeometry(0.16, 0.03, 1.1)
    for (let i = 0; i < panelNum; i++) {
      const panel = new THREE.Mesh(panelGeometry, this.material)
      panel.rotation.y = degToRad(360 / panelNum * i)
      // panel.position.set(0, 0, 0.0)
      this.fan.add(panel)
    }

    this.fan.add(fanMesh)
    this.fanHead.add(this.fan)

    // ベクトルヘルパー
    const dir = new THREE.Vector3(...this.fan.position)
    dir.normalize()
    const origin = new THREE.Vector3(0, 0, 0)
    const length = 1
    const hex = 0xffff00
    this.arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
    this.arrowHelper.visible = this.params.helperVisible
    this.fanHead.add(this.arrowHelper)

    group.add(this.fanHead)

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
   * createCloth
   */
  createCloth() {
    this.dist = this.params.clothSize / this.params.Nx
    const shape = new CANNON.Particle()

    // ポイントをうっていく
    for(let i = 0; i < this.params.Nx + 1; i++) {
      this.particles.push([])
      for(let j = 0; j < this.params.Ny + 1; j++) {
        const particle = new CANNON.Body({
          mass: j === this.params.Ny ? 0 : this.params.mass, // 繋ぎ止めとくために質量0にする
          shape,
          position: new CANNON.Vec3(
            (i - this.params.Nx * 0.5) * this.dist,
            (j - this.params.Ny * 0.5) * this.dist,
            0
          ),
          velocity: new CANNON.Vec3(0, 0, -0.1 * (this.params.Ny - j)),
        })
        this.particles[i].push(particle)
        this.world.addBody(particle)
      }
    }

    // cannonの世界で繋ぎ合わせる
    for(let i = 0; i < this.params.Nx + 1; i++) {
      for(let j = 0; j < this.params.Ny + 1; j++) {
        if(i < this.params.Nx)
          this.connect(i, j, i + 1, j)
        if(j < this.params.Ny)
          this.connect(i, j, i, j + 1)
      }
    }

    this.clothGeometry = new THREE.PlaneGeometry(2, 2, this.params.Nx, this.params.Ny)

    // const clothMat = new THREE.MeshPhongMaterial({
    //   side: THREE.DoubleSide,
    //   // wireframe: true,
    //   wireframe: false,
    // })
    const clothMat = new THREE.MeshPhongMaterial({
      color: this.params.materialColor,
      wireframe: true,
    })

    this.clothMesh = new THREE.Mesh(this.clothGeometry, clothMat)
    this.clothMesh.position.z = 2
    this.scene.add(this.clothMesh)
  }
  /**
   * connect
   */
  connect(i1, j1, i2, j2) {
    this.world.addConstraint(new CANNON.DistanceConstraint(
      this.particles[i1][j1],
      this.particles[i2][j2],
      this.dist
    ))
  }
  /**
   * createSphere
   */
  createSphere() {
    const sphereGeometry = new THREE.SphereGeometry(this.params.sphereSize)
    const sphereMat = new THREE.MeshPhongMaterial()

    this.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat)
    this.sphereMesh.visible = this.params.helperVisible
    this.scene.add(this.sphereMesh)

    const sphereShape = new CANNON.Sphere(this.params.sphereSize * 1.3)
    this.sphereBody = new CANNON.Body({
      shape: sphereShape
    })
    this.world.addBody(this.sphereBody)
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
   * updateParticules
   */
  updateParticules() {
    const positionAttribute = this.clothGeometry.attributes.position
    for(let i = 0; i < this.params.Nx + 1; i++) {
      for (let j = 0; j < this.params.Ny + 1; j++) {
        const index = j * (this.params.Nx + 1) + i
        const position = this.particles[i][this.params.Ny - j].position

        positionAttribute.setXYZ(index, position.x, position.y, position.z)
        positionAttribute.needsUpdate = true
      }
    }
  }
  /**
   * update
   */
  update() {
    this.controls.update()

    this.fan.rotation.y += this.params.fanPower

    if (this.params.isSwinging) {
      this.countTime += 0.01
      this.fanHead.rotation.y = Math.sin(this.countTime * 0.7)
    }

    this.directionalLightHelper.update()

    this.updateParticules()
    this.world.step(this.params.timeStep)

    if (this.params.fanPower > 0) {
      const movementRadius = 0.5
      this.sphereBody.position.set(
        movementRadius * this.fanHead.rotation.y,
        0,
        // TODO: ここの計算もっとスマートなのがありそう
        // (this.params.fanPower * 2 - 0.5) + (Math.abs(this.fanHead.rotation.y)) * -0.2
        (this.params.fanPower * 2 - 0.36) + (Math.abs(this.fanHead.rotation.y)) * -0.2
      )

      this.sphereMesh.position.copy(this.sphereBody.position)
    }

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
