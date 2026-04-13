import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import SlippyMapGlobe from 'three-slippy-map-globe'
import { fetchCountryGeo, geoToLineSegments, pointInCountry, numericIdToIso } from '../data/borders'
import { getCountryByIso } from '../data/countries'
import { SAT_CATEGORIES, propagateSatellite, computeOrbitPath } from '../data/realSatellites'
import { VESSEL_TYPES } from '../data/maritime'

const GLOBE_RADIUS = 1
const ATMOSPHERE_RADIUS = 1.12
const WAR_ZOOM_THRESHOLD = 2.0
const CLOUD_TEXTURE = 'https://unpkg.com/three-globe@2.35.0/example/img/earth-clouds.png'
const FLIGHT_ALT = 0.012

function latLngToVec3(lat, lng, r) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (90 - lng) * (Math.PI / 180)
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
}

function vec3ToLatLng(v) {
  const r = v.length()
  const phi = Math.acos(v.y / r)
  const theta = Math.atan2(v.z, v.x)
  const lat = 90 - phi * (180 / Math.PI)
  let lng = 90 - theta * (180 / Math.PI)
  if (theta < -Math.PI / 2) lng -= 360
  return { lat, lng }
}

function createEarth(scene) {
  const loader = new THREE.TextureLoader()
  const group = new THREE.Group()
  const globe = new SlippyMapGlobe(GLOBE_RADIUS, {
    tileUrl: (x, y, l) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${l}/${y}/${x}`,
    maxZoom: 18,
  })
  group.add(globe)
  const cloudGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.008, 64, 64)
  const cloudMat = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.25, depthWrite: false })
  const clouds = new THREE.Mesh(cloudGeo, cloudMat)
  group.add(clouds)
  loader.load(CLOUD_TEXTURE, (tex) => { cloudMat.map = tex; cloudMat.alphaMap = tex; cloudMat.needsUpdate = true })
  const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vNormal; void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 vNormal; void main(){float i=pow(0.7-dot(vNormal,vec3(0,0,1)),2.0);vec3 c=mix(vec3(0.1,0.4,0.8),vec3(0.024,0.714,0.831),i);gl_FragColor=vec4(c,1.0)*i*0.5;}`,
    blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true,
  })
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64), atmosphereMat))
  scene.add(group)
  return { group, globe, clouds }
}

function buildBorderLines(segments) {
  const group = new THREE.Group()
  const r = GLOBE_RADIUS + 0.002
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
  for (const seg of segments) {
    if (seg.points.length < 2) continue
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(seg.points.map((p) => latLngToVec3(p.lat, p.lng, r))), mat))
  }
  group.visible = false
  return group
}

function createSatelliteShape() {
  const s = 0.014
  const verts = new Float32Array([
    // body diamond (4 triangles)
    0, s * 1.2, 0,    -s * 0.4, 0, 0,    s * 0.4, 0, 0,
    0, -s * 1.2, 0,   s * 0.4, 0, 0,     -s * 0.4, 0, 0,
    // left solar panel (2 triangles = rectangle)
    -s * 0.5, s * 0.5, 0,   -s * 1.8, s * 0.5, 0,   -s * 1.8, -s * 0.5, 0,
    -s * 0.5, s * 0.5, 0,   -s * 1.8, -s * 0.5, 0,  -s * 0.5, -s * 0.5, 0,
    // right solar panel (2 triangles = rectangle)
    s * 0.5, s * 0.5, 0,    s * 1.8, -s * 0.5, 0,    s * 1.8, s * 0.5, 0,
    s * 0.5, s * 0.5, 0,    s * 0.5, -s * 0.5, 0,    s * 1.8, -s * 0.5, 0,
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geo.computeVertexNormals()
  return geo
}

function createSatInstancedMesh(earthGroup, maxCount) {
  const geo = createSatelliteShape()
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.InstancedMesh(geo, mat, maxCount)
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3)
  mesh.count = 0
  mesh.frustumCulled = false
  earthGroup.add(mesh)
  return mesh
}

function createOrbitLines(earthGroup) {
  const group = new THREE.Group()
  earthGroup.add(group)
  return group
}

function rebuildOrbitLines(group, satData, now, maxOrbits = 60) {
  while (group.children.length) {
    const c = group.children[0]
    c.geometry.dispose()
    c.material.dispose()
    group.remove(c)
  }
  if (!satData?.length) return

  const drawn = satData.filter((s) => s.category !== 'starlink').slice(0, maxOrbits)
  for (const sat of drawn) {
    const pathPoints = computeOrbitPath(sat, now, 80)
    if (pathPoints.length < 2) continue
    const verts = pathPoints.map((p) => latLngToVec3(p.lat, p.lng, p.orbitRadius))
    const geo = new THREE.BufferGeometry().setFromPoints(verts)
    const catInfo = SAT_CATEGORIES[sat.category]
    const mat = new THREE.LineBasicMaterial({
      color: catInfo?.color || '#64748b',
      transparent: true,
      opacity: 0.12,
    })
    group.add(new THREE.Line(geo, mat))
  }
}

function updateSatInstances(mesh, satData, now, scale = 1) {
  const dummy = new THREE.Object3D()
  let count = 0
  const colorArr = mesh.instanceColor.array
  for (let i = 0; i < satData.length && count < mesh.instanceMatrix.count; i++) {
    const sat = satData[i]
    const pos = propagateSatellite(sat, now)
    if (!pos) continue
    const v = latLngToVec3(pos.lat, pos.lng, pos.orbitRadius)
    dummy.position.copy(v)
    dummy.scale.setScalar(scale)
    dummy.updateMatrix()
    mesh.setMatrixAt(count, dummy.matrix)
    const catInfo = SAT_CATEGORIES[sat.category]
    const c = new THREE.Color(catInfo?.color || '#64748b')
    colorArr[count * 3] = c.r
    colorArr[count * 3 + 1] = c.g
    colorArr[count * 3 + 2] = c.b
    count++
  }
  mesh.count = count
  mesh.instanceMatrix.needsUpdate = true
  mesh.instanceColor.needsUpdate = true
}

function createPlaneShape() {
  const s = 0.005
  const verts = new Float32Array([
    0,s*1.4,0, -s*0.15,-s*1.2,0, s*0.15,-s*1.2,0,
    0,s*0.2,0, -s*1.3,-s*0.3,0, -s*0.1,-s*0.4,0,
    0,s*0.2,0, s*0.1,-s*0.4,0, s*1.3,-s*0.3,0,
    0,-s*0.8,0, -s*0.5,-s*1.2,0, -s*0.05,-s*1.2,0,
    0,-s*0.8,0, s*0.05,-s*1.2,0, s*0.5,-s*1.2,0,
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geo.computeVertexNormals()
  return geo
}

function createFlightInstances(earthGroup, maxCount) {
  const mesh = new THREE.InstancedMesh(createPlaneShape(), new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }), maxCount)
  mesh.count = 0; mesh.frustumCulled = false
  earthGroup.add(mesh)
  return mesh
}

function updateFlightInstances(mesh, flights) {
  const dummy = new THREE.Object3D()
  const count = Math.min(flights.length, mesh.instanceMatrix.count)
  mesh.count = count
  for (let i = 0; i < count; i++) {
    const f = flights[i]
    const r = GLOBE_RADIUS + FLIGHT_ALT
    const pos = latLngToVec3(f.lat, f.lng, r)
    const up = pos.clone().normalize()
    const phi = ((90 - f.lat) * Math.PI) / 180
    const theta = ((90 - f.lng) * Math.PI) / 180
    const fwd = new THREE.Vector3(-Math.cos(phi) * Math.cos(theta), Math.sin(phi), -Math.cos(phi) * Math.sin(theta)).normalize()
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize()
    fwd.crossVectors(right, up).normalize()
    const headingRad = ((f.heading || 0) * Math.PI) / 180
    const dir = new THREE.Vector3().addScaledVector(fwd, Math.cos(headingRad)).addScaledVector(right, Math.sin(headingRad)).normalize()
    dummy.position.copy(pos)
    dummy.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, pos.clone().add(dir), up))
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

function createVesselInstances(earthGroup, maxCount) {
  const s = 0.004
  const verts = new Float32Array([-s,0,0, s,0,0, 0,s*1.5,0, 0,-s*1.5,0, -s,0,0, s,0,0])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }), maxCount)
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3)
  mesh.count = 0; mesh.frustumCulled = false
  earthGroup.add(mesh)
  return mesh
}

function updateVesselInstances(mesh, vessels) {
  const dummy = new THREE.Object3D()
  const count = Math.min(vessels.length, mesh.instanceMatrix.count)
  mesh.count = count
  const colorArr = mesh.instanceColor.array
  for (let i = 0; i < count; i++) {
    const v = vessels[i]
    const pos = latLngToVec3(v.lat, v.lng, GLOBE_RADIUS + 0.003)
    dummy.position.copy(pos)
    dummy.lookAt(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    const typeInfo = VESSEL_TYPES[v.type] || VESSEL_TYPES.other
    const c = new THREE.Color(typeInfo.color)
    colorArr[i * 3] = c.r; colorArr[i * 3 + 1] = c.g; colorArr[i * 3 + 2] = c.b
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.instanceColor.needsUpdate = true
}

function createJammingOverlay(earthGroup) {
  const group = new THREE.Group()
  earthGroup.add(group)
  return group
}

function updateJammingOverlay(group, zones) {
  while (group.children.length) { const c = group.children[0]; c.geometry?.dispose(); c.material?.dispose(); group.remove(c) }
  if (!zones?.length) return
  const r = GLOBE_RADIUS + 0.003
  for (const z of zones) {
    const segments = 24
    const points = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const lat = z.lat + z.radius * Math.sin(angle)
      const lng = z.lng + z.radius * Math.cos(angle) / Math.cos(z.lat * Math.PI / 180)
      points.push(latLngToVec3(lat, lng, r))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: z.color, transparent: true, opacity: z.opacity + 0.2 })))

    const fillPoints = []
    for (let i = 0; i < segments; i++) {
      fillPoints.push(latLngToVec3(z.lat, z.lng, r))
      fillPoints.push(points[i])
      fillPoints.push(points[i + 1] || points[0])
    }
    const fillGeo = new THREE.BufferGeometry().setFromPoints(fillPoints)
    group.add(new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: z.opacity, side: THREE.DoubleSide, depthWrite: false })))
  }
}

function createEventMarkers(earthGroup) {
  const group = new THREE.Group()
  earthGroup.add(group)
  return group
}

function updateEventMarkers(group, events) {
  while (group.children.length) { const c = group.children[0]; c.geometry?.dispose(); c.material?.dispose(); group.remove(c) }
  if (!events?.length) return
  const r = GLOBE_RADIUS + 0.005
  for (const ev of events) {
    if (!ev.lat || !ev.lng) continue
    const size = 0.005 + (ev.intensity || 2) * 0.002
    const geo = new THREE.SphereGeometry(size, 8, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(latLngToVec3(ev.lat, ev.lng, r))
    mesh.userData = ev
    group.add(mesh)
    const glowGeo = new THREE.SphereGeometry(size * 2.5, 8, 8)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.15 })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    mesh.add(glow)
  }
}

function createWarOverlay(earthGroup) {
  const group = new THREE.Group()
  earthGroup.add(group)
  return group
}

function updateWarOverlay(group, overlay) {
  while (group.children.length) {
    const c = group.children[0]
    if (c.geometry) c.geometry.dispose()
    if (c.material) c.material.dispose()
    group.remove(c)
  }
  if (!overlay) return

  const r = GLOBE_RADIUS + 0.004
  const risks = overlay.risks || {}
  const avgRisk = Object.values(risks).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0) / Math.max(1, Object.values(risks).filter((v) => typeof v === 'number').length)

  function addCountryDisc(country, color, opacity, size) {
    if (!country?.lat || !country?.lng) return
    const segments = 24
    const points = []
    for (let i = 0; i < segments; i++) {
      const center = latLngToVec3(country.lat, country.lng, r)
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2
      const lat1 = country.lat + size * Math.sin(angle1)
      const lng1 = country.lng + size * Math.cos(angle1) / Math.max(0.1, Math.cos(country.lat * Math.PI / 180))
      const lat2 = country.lat + size * Math.sin(angle2)
      const lng2 = country.lng + size * Math.cos(angle2) / Math.max(0.1, Math.cos(country.lat * Math.PI / 180))
      points.push(center, latLngToVec3(lat1, lng1, r), latLngToVec3(lat2, lng2, r))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
    group.add(new THREE.Mesh(geo, mat))

    const ringPts = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const lat = country.lat + size * Math.sin(angle)
      const lng = country.lng + size * Math.cos(angle) / Math.max(0.1, Math.cos(country.lat * Math.PI / 180))
      ringPts.push(latLngToVec3(lat, lng, r + 0.001))
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity + 0.2 })))
  }

  const attackerIntensity = Math.min(0.5, 0.15 + avgRisk * 0.004)
  addCountryDisc(overlay.attacker, 0xef4444, attackerIntensity, 4)
  addCountryDisc(overlay.defender, 0xff6b35, attackerIntensity, 4)

  for (const ally of overlay.allies) {
    addCountryDisc(ally, 0x22c55e, 0.18, 2.5)
  }
  for (const enemy of overlay.enemies) {
    addCountryDisc(enemy, 0xf97316, 0.22, 2.5)
  }
}

export default function Globe({
  layers, realSatData, flights, vessels, jammingZones, events,
  onZoomChange, onCountrySelect, onItemSelect, warOverlay,
}) {
  const containerRef = useRef(null)
  const stateRef = useRef({})

  const handleClick = useCallback(
    (event) => {
      const { camera, renderer, earthGroup, geoData } = stateRef.current
      if (!camera || !renderer) return
      const rect = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      const raycaster = new THREE.Raycaster()
      raycaster.set(camera.position.clone(), new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera).sub(camera.position).normalize())

      if (stateRef.current.isWarZoom && geoData) {
        const ray = raycaster.ray.clone()
        ray.applyMatrix4(new THREE.Matrix4().copy(earthGroup.matrixWorld).invert())
        const target = new THREE.Vector3()
        if (ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(0, 0, 0), GLOBE_RADIUS), target)) {
          const { lat, lng } = vec3ToLatLng(target)
          const feature = pointInCountry(lat, lng, geoData)
          if (feature) {
            const iso = numericIdToIso(feature.id)
            const countryData = iso ? getCountryByIso(iso) : null
            if (countryData && onCountrySelect) { onCountrySelect(countryData); return }
          }
        }
      }

      if (stateRef.current.eventGroup && stateRef.current.layers?.events) {
        const hits = raycaster.intersectObjects(stateRef.current.eventGroup.children, false)
        if (hits.length > 0 && hits[0].object.userData?.id) {
          const ev = hits[0].object.userData
          onItemSelect?.({ type: 'Conflict Event', color: '#ef4444', name: ev.title, fields: [
            { label: 'Source', value: ev.source }, { label: 'Time', value: new Date(ev.time).toLocaleString() },
            { label: 'Intensity', value: `${ev.intensity}/5` },
          ]})
          return
        }
      }
    },
    [onCountrySelect, onItemSelect]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.001, 100)
    camera.position.set(0, 0.5, 3.2); camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0x404060, 2.0))
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5); sunLight.position.set(5, 3, 5); scene.add(sunLight)
    scene.add(new THREE.DirectionalLight(0x4488cc, 0.6).translateX(-3).translateY(-1).translateZ(-3))

    const { group: earthGroup, globe: tiledGlobe, clouds } = createEarth(scene)
    const satMesh = createSatInstancedMesh(earthGroup, 800)
    const orbitLineGroup = createOrbitLines(earthGroup)
    const flightMesh = createFlightInstances(earthGroup, 300)
    const vesselMesh = createVesselInstances(earthGroup, 200)
    const jammingGroup = createJammingOverlay(earthGroup)
    const eventGroup = createEventMarkers(earthGroup)
    const warOverlayGroup = createWarOverlay(earthGroup)

    let borderGroup = new THREE.Group(); borderGroup.visible = false; earthGroup.add(borderGroup)
    fetchCountryGeo().then((geo) => {
      stateRef.current.geoData = geo
      const built = buildBorderLines(geoToLineSegments(geo))
      earthGroup.remove(borderGroup); borderGroup = built; earthGroup.add(borderGroup)
      stateRef.current.borderGroup = borderGroup
    })

    stateRef.current = { camera, renderer, scene, earthGroup, clouds, tiledGlobe, satMesh, orbitLineGroup, flightMesh, vesselMesh, jammingGroup, eventGroup, warOverlayGroup, borderGroup, isWarZoom: false, orbitsBuilt: false }

    let isDragging = false, previousMouse = { x: 0, y: 0 }, rotationVelocity = { x: 0, y: 0 }
    let targetRotation = { x: 0.3, y: 0 }, currentZoom = 3.2, lastWarZoom = false

    const onPointerDown = (e) => { isDragging = true; previousMouse = { x: e.clientX, y: e.clientY }; rotationVelocity = { x: 0, y: 0 } }
    const onPointerMove = (e) => { if (!isDragging) return; const dx = e.clientX - previousMouse.x, dy = e.clientY - previousMouse.y; targetRotation.y += dx * 0.005; targetRotation.x += dy * 0.005; targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x)); rotationVelocity = { x: dy * 0.005, y: dx * 0.005 }; previousMouse = { x: e.clientX, y: e.clientY } }
    const onPointerUp = () => { isDragging = false }
    const onWheel = (e) => { currentZoom += e.deltaY * 0.002 * (currentZoom * 0.3); currentZoom = Math.max(1.003, Math.min(8, currentZoom)) }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true })
    renderer.domElement.addEventListener('click', handleClick)

    let animationId
    const clock = new THREE.Clock()
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      clock.getElapsedTime()
      if (!isDragging) { rotationVelocity.x *= 0.92; rotationVelocity.y *= 0.92; targetRotation.x += rotationVelocity.x * 0.1; targetRotation.y += rotationVelocity.y * 0.1 }
      earthGroup.rotation.x += (targetRotation.x - earthGroup.rotation.x) * 0.05
      earthGroup.rotation.y += (targetRotation.y - earthGroup.rotation.y) * 0.05
      clouds.rotation.y += 0.0002
      camera.position.z += (currentZoom - camera.position.z) * 0.05
      tiledGlobe.updatePov(camera)

      const isWarZoom = currentZoom < WAR_ZOOM_THRESHOLD
      stateRef.current.isWarZoom = isWarZoom

      const ly = stateRef.current.layers || {}
      if (stateRef.current.borderGroup) stateRef.current.borderGroup.visible = ly.borders !== false && isWarZoom
      const satsOn = ly.satellites !== false
      satMesh.visible = satsOn
      orbitLineGroup.visible = satsOn
      flightMesh.visible = ly.flights === true
      vesselMesh.visible = ly.maritime === true
      jammingGroup.visible = ly.gpsJamming === true
      eventGroup.visible = ly.events === true

      const zoomScale = Math.max(0.22, Math.min(1.15, (currentZoom - 1) / 2.2))
      flightMesh.scale.setScalar(zoomScale)
      vesselMesh.scale.setScalar(zoomScale)
      eventGroup.scale.setScalar(zoomScale)

      if (satsOn && stateRef.current.realSatData?.length) {
        updateSatInstances(satMesh, stateRef.current.realSatData, new Date(), zoomScale)
        if (!stateRef.current.orbitsBuilt) {
          stateRef.current.orbitsBuilt = true
          rebuildOrbitLines(orbitLineGroup, stateRef.current.realSatData, new Date())
        }
      }
      if (ly.flights && stateRef.current.flights?.length) updateFlightInstances(flightMesh, stateRef.current.flights)
      if (ly.maritime && stateRef.current.vessels?.length) updateVesselInstances(vesselMesh, stateRef.current.vessels)

      if (isWarZoom !== lastWarZoom) { lastWarZoom = isWarZoom; stateRef.current.onZoomChange?.(isWarZoom) }
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight) }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(animationId); window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown); renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp); renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.domElement.removeEventListener('click', handleClick); renderer.dispose(); container.removeChild(renderer.domElement)
    }
  }, [handleClick])

  useEffect(() => { stateRef.current.layers = layers }, [layers])
  useEffect(() => { stateRef.current.onZoomChange = onZoomChange }, [onZoomChange])
  useEffect(() => {
    stateRef.current.realSatData = realSatData
    stateRef.current.orbitsBuilt = false
  }, [realSatData])
  useEffect(() => { stateRef.current.flights = flights }, [flights])
  useEffect(() => { stateRef.current.vessels = vessels }, [vessels])
  useEffect(() => {
    if (stateRef.current.jammingGroup) updateJammingOverlay(stateRef.current.jammingGroup, layers?.gpsJamming ? jammingZones : null)
  }, [jammingZones, layers?.gpsJamming])
  useEffect(() => {
    if (stateRef.current.eventGroup) updateEventMarkers(stateRef.current.eventGroup, layers?.events ? events : null)
  }, [events, layers?.events])
  useEffect(() => {
    if (stateRef.current.warOverlayGroup) updateWarOverlay(stateRef.current.warOverlayGroup, warOverlay)
  }, [warOverlay])

  return <div ref={containerRef} className="globe-container" />
}
