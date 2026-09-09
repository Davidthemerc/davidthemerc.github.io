(() => {
  'use strict';

  // Interstate Drive v0.9.12 — Lightweight Live FPS HUD

  const THREE = window.THREE;
  const gameEl = document.getElementById('game');
  const speedEl = document.getElementById('speedValue');
  const tripEl = document.getElementById('tripValue');
  const startup = document.getElementById('startup');
  const pauseMenu = document.getElementById('pauseMenu');
  const mapMenu = document.getElementById('mapMenu');
  const settingsMenu = document.getElementById('settingsMenu');
  const worldMapCanvas = document.getElementById('worldMap');
  const worldMapCtx = worldMapCanvas.getContext('2d');
  const mapLocationText = document.getElementById('mapLocationText');
  const mapScaleText = document.getElementById('mapScaleText');
  const mapTargetInfo = document.getElementById('mapTargetInfo');
  const mapGoHere = document.getElementById('mapGoHere');
  const mapClearTarget = document.getElementById('mapClearTarget');
  const fpsHud = document.getElementById('fpsHud');
  const fpsValue = document.getElementById('fpsValue');
  const debugPanel = document.getElementById('debugPanel');
  const debugText = document.getElementById('debugText');
  const performanceDebugReport = document.getElementById('performanceDebugReport');
  const refreshDebugReportButton = document.getElementById('refreshDebugReport');
  const copyDebugReportButton = document.getElementById('copyDebugReport');
  const performanceDebugStatus = document.getElementById('performanceDebugStatus');

  const preferredCameraDefaults = {
    fov: 85,
    camX: -0.09,
    camY: 0.3,
    camZ: -0.1,
    camPitch: -4.5,
    camYaw: 0,
    camRoll: 0
  };

  const settings = Object.assign({
    trafficDensity: 0.55,
    drawDistance: 12,
    sceneryDensity: 1,
    showFps: false,
    cameraBob: true,
    ...preferredCameraDefaults
  }, JSON.parse(localStorage.getItem('interstateDriveSettings') || '{}'));

  const ui = {
    trafficDensity: document.getElementById('trafficDensity'),
    drawDistance: document.getElementById('drawDistance'),
    sceneryDensity: document.getElementById('sceneryDensity'),
    showFps: document.getElementById('showFps'),
    cameraBob: document.getElementById('cameraBob'),
    fov: document.getElementById('fov'),
    camX: document.getElementById('camX'),
    camY: document.getElementById('camY'),
    camZ: document.getElementById('camZ'),
    camPitch: document.getElementById('camPitch'),
    camYaw: document.getElementById('camYaw'),
    camRoll: document.getElementById('camRoll')
  };

  const cameraOutputs = {
    fov: document.getElementById('fovValue'),
    camX: document.getElementById('camXValue'),
    camY: document.getElementById('camYValue'),
    camZ: document.getElementById('camZValue'),
    camPitch: document.getElementById('camPitchValue'),
    camYaw: document.getElementById('camYawValue'),
    camRoll: document.getElementById('camRollValue')
  };

  function updateCameraOutput(k) {
    const out = cameraOutputs[k];
    if (!out) return;
    if (k === 'fov') out.value = `${Number(settings[k]).toFixed(0)}°`;
    else if (k.startsWith('camP') || k === 'camYaw' || k === 'camRoll') out.value = `${Number(settings[k]).toFixed(1)}°`;
    else out.value = Number(settings[k]).toFixed(2);
  }

  for (const [k, el] of Object.entries(ui)) {
    if (el.type === 'checkbox') el.checked = !!settings[k];
    else el.value = String(settings[k]);
    updateCameraOutput(k);
    el.addEventListener('input', () => {
      settings[k] = el.type === 'checkbox' ? el.checked : Number(el.value);
      updateCameraOutput(k);
      localStorage.setItem('interstateDriveSettings', JSON.stringify(settings));
      applySettings();
    });
  }


  const exteriorCameraDefaults = [
    { name:'Chase',         x: 0.0,  y:3.15, z: 7.8,  targetX:0, targetY:0.95, targetZ:0, fov:72 },
    { name:'Left Rear',     x:-5.0,  y:2.55, z: 5.0,  targetX:0, targetY:0.95, targetZ:0, fov:72 },
    { name:'Right Rear',    x: 5.0,  y:2.55, z: 5.0,  targetX:0, targetY:0.95, targetZ:0, fov:72 },
    { name:'Front Quarter', x: 4.5,  y:2.35, z:-5.8,  targetX:0, targetY:0.95, targetZ:0, fov:72 }
  ];
  const exteriorCameraStorageKey = 'interstateDriveExteriorCamerasV1';

  function cloneExteriorCameraDefaults() {
    return exteriorCameraDefaults.map(v => ({...v}));
  }

  let exteriorCameras = cloneExteriorCameraDefaults();
  try {
    const saved = JSON.parse(localStorage.getItem(exteriorCameraStorageKey) || 'null');
    if (Array.isArray(saved) && saved.length === exteriorCameraDefaults.length) {
      exteriorCameras = exteriorCameraDefaults.map((d, i) => ({...d, ...(saved[i] || {})}));
    }
  } catch {}

  function saveExteriorCameras() {
    localStorage.setItem(exteriorCameraStorageKey, JSON.stringify(exteriorCameras));
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x78add2);
  scene.fog = new THREE.Fog(0x9eb7c3, 180, 1500);

  const camera = new THREE.PerspectiveCamera(settings.fov, innerWidth / innerHeight, 0.05, 2200);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = false;
  gameEl.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd8ecff, 0xb18d61, 1.8));
  const sun = new THREE.DirectionalLight(0xfff1cf, 2.1);
  sun.position.set(-50, 90, -20);
  scene.add(sun);

  const COLORS = {
    asphalt: 0x292b2a, asphalt2: 0x303231, shoulder: 0x464743,
    line: 0xd8d6ca, yellow: 0xc9a43b, dirt: 0x5b4630,
    dryGrass: 0x6b5838, olive: 0x62543a, field: 0x554a32,
    darkField: 0x433b2c, concrete: 0x77766f, guard: 0x7f8582
  };

  const matCache = new Map();
  function mat(color) {
    if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
    return matCache.get(color);
  }

  const boxGeoCache = new Map();
  const sharedGeometrySet = new Set();
  function box(w, h, d, color) {
    const key = `${w}|${h}|${d}`;
    if (!boxGeoCache.has(key)) {
      const geo=new THREE.BoxGeometry(w, h, d);
      boxGeoCache.set(key, geo);
      sharedGeometrySet.add(geo);
    }
    return new THREE.Mesh(boxGeoCache.get(key), mat(color));
  }

  const cylGeo = new THREE.CylinderGeometry(0.13, 0.18, 2.4, 6);
  const wheelGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.2, 10);
  wheelGeo.rotateZ(Math.PI / 2);

  // Shared low-poly scenery/sign assets used throughout streamed tiles.
  const proceduralTreeCrownGeo=new THREE.DodecahedronGeometry(1,0);
  const instancedUnitBoxGeo=new THREE.BoxGeometry(1,1,1);
  const proceduralPyramidRoofGeo=new THREE.ConeGeometry(1,1,4);
  const roadsideSiloGeo=new THREE.CylinderGeometry(1,1,1,10);
  sharedGeometrySet.add(proceduralTreeCrownGeo);
  sharedGeometrySet.add(instancedUnitBoxGeo);
  sharedGeometrySet.add(proceduralPyramidRoofGeo);
  sharedGeometrySet.add(roadsideSiloGeo);
  sharedGeometrySet.add(wheelGeo);
  const stopSignMaterialCache={material:null};
  const crossStreetSignCache=new Map();
  const truckStopSignCache=new Map();
  const fixedServiceSignCache=new Map();

  const oneSidedSignSprites=new Set();
  const _signWorldPos=new THREE.Vector3();
  const _signCameraPos=new THREE.Vector3();
  const _signFacing=new THREE.Vector3();
  const _signParentQuat=new THREE.Quaternion();

  function registerOneSidedSignSprite(sprite,facingX=0,facingZ=1) {
    if(!sprite) return sprite;
    sprite.userData.oneSidedTrafficSign=true;
    sprite.userData.signFacingX=facingX;
    sprite.userData.signFacingZ=facingZ;
    oneSidedSignSprites.add(sprite);
    return sprite;
  }

  function unregisterOneSidedSignsIn(group) {
    if(!group) return;
    group.traverse(o=>{
      if(o.userData?.oneSidedTrafficSign) oneSidedSignSprites.delete(o);
    });
  }

  function updateOneSidedSignVisibility() {
    camera.getWorldPosition(_signCameraPos);

    for(const sign of [...oneSidedSignSprites]){
      if(!sign.parent){
        oneSidedSignSprites.delete(sign);
        continue;
      }

      sign.getWorldPosition(_signWorldPos);

      _signFacing.set(
        sign.userData.signFacingX||0,
        0,
        sign.userData.signFacingZ??1
      );

      // Stored facing is in the sign's parent coordinate system. This keeps
      // freeway-chunk signs aligned correctly as curved chunks rotate.
      if(sign.parent){
        sign.parent.getWorldQuaternion(_signParentQuat);
        _signFacing.applyQuaternion(_signParentQuat);
      }
      _signFacing.y=0;
      if(_signFacing.lengthSq()<.0001) _signFacing.set(0,0,1);
      _signFacing.normalize();

      const toCameraX=_signCameraPos.x-_signWorldPos.x;
      const toCameraZ=_signCameraPos.z-_signWorldPos.z;
      const len=Math.hypot(toCameraX,toCameraZ)||1;
      const dot=_signFacing.x*(toCameraX/len)+_signFacing.z*(toCameraZ/len);

      // Slight dead zone around the exact edge prevents flicker while passing
      // directly beside a sign.
      sign.visible=dot>0.025;
    }
  }

  const world = new THREE.Group();
  scene.add(world);
  const cab = new THREE.Group();
  const CAB_BASE = { x: 0, y: 0, z: -0.48 };
  cab.position.set(CAB_BASE.x, CAB_BASE.y, CAB_BASE.z);
  camera.add(cab);
  scene.add(camera);

  // Primitive interior editor registry. A named editor part can control one or
  // several meshes together. Transforms are stored as offsets from the built-in layout.
  const interiorEditorParts = {};
  const interiorEditorGroups = {};
  const interiorEditorPrimitives = {};
  let interiorLayout = {};
  const interiorLayoutStorageKey = 'interstateDriveInteriorLayoutV3';

  function registerInteriorPart(name, objects) {
    const list = (Array.isArray(objects) ? objects : [objects]).filter(Boolean);
    const refs = list.map(obj => ({
      obj,
      basePosition: obj.position.clone(),
      baseRotation: obj.rotation.clone(),
      baseScale: obj.scale.clone(),
      baseMaterial: obj.material || null,
      baseMaterials: Array.isArray(obj.material) ? obj.material.slice() : null
    }));
    interiorEditorParts[name] = refs;
    interiorEditorGroups[name] = refs;
  }

  function registerInteriorPrimitive(name, obj) {
    if (!obj) return;
    const refs = [{
      obj,
      basePosition: obj.position.clone(),
      baseRotation: obj.rotation.clone(),
      baseScale: obj.scale.clone(),
      baseMaterial: obj.material || null,
      baseMaterials: Array.isArray(obj.material) ? obj.material.slice() : null
    }];
    interiorEditorParts[name] = refs;
    interiorEditorPrimitives[name] = refs;
  }

  function defaultInteriorTransform() {
    return { x:0, y:0, z:0, rx:0, ry:0, rz:0, sx:1, sy:1, sz:1 };
  }

  function normalizeInteriorTransform(v={}) {
    const d = defaultInteriorTransform();
    for (const k of Object.keys(d)) {
      const n = Number(v[k]);
      d[k] = Number.isFinite(n) ? n : d[k];
    }
    d.sx = Math.max(.05, d.sx);
    d.sy = Math.max(.05, d.sy);
    d.sz = Math.max(.05, d.sz);
    return d;
  }

  function applyInteriorPart(name) {
    const refs = interiorEditorParts[name];
    if (!refs) return;
    const t = normalizeInteriorTransform(interiorLayout[name]);
    interiorLayout[name] = t;
    const rx = t.rx * Math.PI / 180, ry = t.ry * Math.PI / 180, rz = t.rz * Math.PI / 180;
    for (const ref of refs) {
      ref.obj.position.set(
        ref.basePosition.x + t.x,
        ref.basePosition.y + t.y,
        ref.basePosition.z + t.z
      );
      ref.obj.rotation.set(
        ref.baseRotation.x + rx,
        ref.baseRotation.y + ry,
        ref.baseRotation.z + rz
      );
      ref.obj.scale.set(
        ref.baseScale.x * t.sx,
        ref.baseScale.y * t.sy,
        ref.baseScale.z * t.sz
      );
    }
  }

  function applyInteriorLayout() {
    // Only entries that actually exist in the saved layout are applied.
    // This prevents group and primitive transforms from stacking unintentionally.
    for (const name of Object.keys(interiorLayout)) {
      if (interiorEditorParts[name]) applyInteriorPart(name);
    }
  }

  function saveInteriorLayoutLocal() {
    localStorage.setItem(interiorLayoutStorageKey, JSON.stringify({
      version: 1,
      app: 'Interstate Drive',
      parts: interiorLayout
    }));
  }

  // First-person pickup interior. The camera is placed at the driver's head.
  // The dashboard/wheel occupy the lower half of the view; the hood is a smaller,
  // more distant shape beyond the windshield rather than the foreground itself.
  function buildCab() {
    const blue = 0x294d63;
    const blueDark = 0x183444;
    const blueTop = 0x203f52;
    const hoodBlue = 0x2b526a;
    const black = 0x121618;
    const vinyl = 0x1b2022;
    const wood = 0x68401f;

    // Dashboard top sits close to the visual midpoint, defining the windshield sill.
    const dash = box(2.78, 0.56, 0.70, blue);
    dash.position.set(0.06, -0.42, -0.93);
    cab.add(dash);

    const dashTop = box(2.88, 0.14, 0.82, blueTop);
    dashTop.position.set(0.06, -0.10, -1.00);
    cab.add(dashTop);

    const lowerDash = box(2.72, 0.52, 0.48, blueDark);
    lowerDash.position.set(0.06, -0.79, -0.78);
    cab.add(lowerDash);

    const trim = box(2.38, 0.075, 0.04, wood);
    trim.position.set(0.16, -0.46, -0.565);
    cab.add(trim);


    // Instrument binnacle and gauges sit behind the wheel but remain visible.
    const binnacle = box(0.98, 0.37, 0.13, black);
    binnacle.position.set(-0.49, -0.28, -0.72);
    cab.add(binnacle);
    const gaugePanel = box(0.84, 0.29, 0.045, 0x0d1112);
    gaugePanel.position.set(-0.49, -0.28, -0.646);
    cab.add(gaugePanel);

    for (let i = 0; i < 3; i++) {
      const radius = i === 1 ? 0.10 : 0.074;
      const g = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), mat(0xbdb9a5));
      g.position.set(-0.70 + i * 0.21, -0.275, -0.616);
      cab.add(g);
      const inner = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.72, 20), mat(0x292f30));
      inner.position.set(g.position.x, g.position.y, -0.610);
      cab.add(inner);
    }

    // Driver-offset steering wheel, sized to frame the gauges without obscuring them.
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.038, 8, 28), mat(vinyl));
    wheel.position.set(-0.49, -0.30, -0.43); // in front of dash, toward driver
    wheel.rotation.x = -0.16;
    cab.add(wheel);
    cab.userData.steeringWheel = wheel;

    const spoke = new THREE.Group();
    spoke.position.copy(wheel.position);
    spoke.position.z += 0.012;
    spoke.rotation.x = wheel.rotation.x;

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.045, 12), mat(0x303537));
    hub.rotation.x = Math.PI / 2;
    spoke.add(hub);

    for (const angle of [-2.45, -0.69, Math.PI / 2]) {
      const arm = box(0.255, 0.055, 0.035, 0x303537);
      arm.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0);
      arm.rotation.z = angle;
      spoke.add(arm);
    }

    cab.add(spoke);
    cab.userData.spoke = spoke;

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.24, 10),
      mat(0x252a2c)
    );
    column.rotation.x = Math.PI / 2;
    column.position.set(-0.49, -0.30, -0.545);
    cab.add(column);

    const vent = box(0.56, 0.17, 0.045, 0x101617);
    vent.position.set(0.43, -0.28, -0.60);
    cab.add(vent);
    const radio = box(0.54, 0.14, 0.05, 0x101314);
    radio.position.set(0.43, -0.49, -0.595);
    cab.add(radio);
    const glove = box(0.72, 0.25, 0.035, blueDark);
    glove.position.set(0.98, -0.48, -0.59);
    cab.add(glove);

    // Cab framing: keep the driver's A-pillar visibly inside the frame so the
    // windshield and left side window read as separate openings.
    const pillarL = box(0.15, 2.14, 0.18, blueDark);
    pillarL.position.set(-0.96, 0.22, -0.56);
    pillarL.rotation.z = -0.075;
    cab.add(pillarL);

    // Inner windshield-side trim gives the A-pillar a little thickness/depth.
    const pillarLInner = box(0.055, 1.96, 0.10, blueTop);
    pillarLInner.position.set(-0.885, 0.23, -0.535);
    pillarLInner.rotation.z = -0.075;
    cab.add(pillarLInner);

    const pillarR = box(0.12, 2.05, 0.14, blueDark);
    pillarR.position.set(1.66, 0.25, -0.68);
    pillarR.rotation.z = 0.05;
    cab.add(pillarR);

    const roofEdge = box(3.00, 0.11, 0.16, blueDark);
    roofEdge.position.set(0.17, 1.08, -0.68);
    cab.add(roofEdge);

    // Left side-window lower frame/door cap, visible below the A-pillar.
    const leftWindowSill = box(0.42, 0.11, 0.62, blueDark);
    leftWindowSill.position.set(-1.08, -0.27, -0.36);
    cab.add(leftWindowSill);

    // Complete the front cockpit shell so wider camera settings still read as
    // being inside a truck rather than exposing open world around the dashboard.

    // Passenger-side A-pillar inner trim.
    const pillarRInner = box(0.055, 1.96, 0.10, blueTop);
    pillarRInner.position.set(1.585, 0.23, -0.655);
    pillarRInner.rotation.z = 0.05;
    cab.add(pillarRInner);

    // Side-window upper rails.
    const leftUpperRail = box(0.12, 0.10, 0.92, blueDark);
    leftUpperRail.position.set(-1.18, 0.93, -0.20);
    cab.add(leftUpperRail);

    const rightUpperRail = box(0.12, 0.10, 0.98, blueDark);
    rightUpperRail.position.set(1.52, 0.93, -0.10);
    cab.add(rightUpperRail);

    // Rear edges of the front side-window openings / abbreviated B-pillars.
    const leftRearWindowFrame = box(0.12, 1.20, 0.16, blueDark);
    leftRearWindowFrame.position.set(-1.18, 0.30, 0.18);
    cab.add(leftRearWindowFrame);

    const rightRearWindowFrame = box(0.14, 1.32, 0.20, blueDark);
    rightRearWindowFrame.position.set(1.52, 0.27, 0.42);
    cab.add(rightRearWindowFrame);

    // Passenger-side window sill and both front door inner panels.
    const rightWindowSill = box(0.52, 0.11, 0.94, blueDark);
    rightWindowSill.position.set(1.45, -0.27, -0.10);
    cab.add(rightWindowSill);

    const leftDoorPanel = box(0.20, 0.78, 1.08, blue);
    leftDoorPanel.position.set(-1.22, -0.70, -0.02);
    cab.add(leftDoorPanel);

    const rightDoorPanel = box(0.24, 0.82, 1.06, blue);
    rightDoorPanel.position.set(1.56, -0.68, 0.00);
    cab.add(rightDoorPanel);

    // Dark inset panels make the doors read as interior rather than body-color slabs.
    const leftDoorInset = box(0.025, 0.34, 0.62, vinyl);
    leftDoorInset.position.set(-1.105, -0.66, -0.02);
    cab.add(leftDoorInset);

    const rightDoorInset = box(0.025, 0.36, 0.68, vinyl);
    rightDoorInset.position.set(1.425, -0.65, -0.02);
    cab.add(rightDoorInset);

    // Lower kick panels close the gaps beneath the dashboard at wide FOV.
    const leftKick = box(0.58, 0.56, 0.48, blueDark);
    leftKick.position.set(-0.96, -1.02, -0.50);
    cab.add(leftKick);

    const rightKick = box(0.78, 0.56, 0.48, blueDark);
    rightKick.position.set(0.98, -1.02, -0.50);
    cab.add(rightKick);

    // Wider roof/header and windshield side frame pieces.
    const roofLiner = box(2.94, 0.16, 0.42, 0x20282b);
    roofLiner.position.set(0.17, 1.14, -0.34);
    cab.add(roofLiner);

    const windshieldBase = box(2.88, 0.10, 0.14, blueDark);
    windshieldBase.position.set(0.18, -0.06, -0.62);
    cab.add(windshieldBase);

    // Passenger-side dash extension closes the far-right edge when FOV is widened.
    const passengerDashWing = box(0.72, 0.58, 0.62, blue);
    passengerDashWing.position.set(1.62, -0.42, -0.91);
    cab.add(passengerDashWing);

    const mirror = box(0.56, 0.21, 0.045, 0x22282a);
    mirror.position.set(0.47, 0.73, -0.72);
    cab.add(mirror);
    const mirrorGlass = box(0.49, 0.145, 0.015, 0x607d8b);
    mirrorGlass.position.set(0.47, 0.73, -0.694);
    cab.add(mirrorGlass);

    const doorTop = box(0.13, 0.70, 0.42, blueDark);
    doorTop.position.set(-1.31, -0.55, -0.45);
    cab.add(doorTop);

    const doorTopR = box(0.13, 0.72, 1.20, blueDark);
    doorTopR.position.set(1.42, -0.55, -0.05);
    cab.add(doorTopR);

    // Passenger-side rearward inner wall gives the front half of the cab real depth
    // when the camera is shifted or yawed to the right.
    const rightCabSide = box(0.18, 1.55, 0.42, blueDark);
    rightCabSide.position.set(1.56, 0.02, 0.50);
    cab.add(rightCabSide);

    const rightRoofSide = box(0.22, 0.16, 0.52, 0x20282b);
    rightRoofSide.position.set(1.52, 1.07, 0.34);
    cab.add(rightRoofSide);

    // Expose useful primitive groups to the live interior editor.
    registerInteriorPart('Steering Assembly', [wheel, spoke, column]);
    registerInteriorPart('Dashboard Main', [dash, dashTop, lowerDash, trim]);
    registerInteriorPart('Instrument Cluster', [binnacle, gaugePanel]);
    registerInteriorPart('Center Controls', [vent, radio]);
    registerInteriorPart('Passenger Dash / Glovebox', [glove, passengerDashWing]);
    registerInteriorPart('Left A-Pillar', [pillarL, pillarLInner]);
    registerInteriorPart('Right A-Pillar', [pillarR, pillarRInner]);
    registerInteriorPart('Left Door / Window', [leftWindowSill, leftUpperRail, leftRearWindowFrame, leftDoorPanel, leftDoorInset, doorTop]);
    registerInteriorPart('Right Door / Window', [rightWindowSill, rightUpperRail, rightRearWindowFrame, rightDoorPanel, rightDoorInset, doorTopR, rightCabSide, rightRoofSide]);
    registerInteriorPart('Roof / Windshield Frame', [roofEdge, roofLiner, windshieldBase]);
    registerInteriorPart('Lower Kick Panels', [leftKick, rightKick]);
    registerInteriorPart('Rearview Mirror', [mirror, mirrorGlass]);

    // Individual primitive-level editor entries. These are the default editor mode,
    // so selecting one entry highlights and transforms exactly one primitive.
    registerInteriorPrimitive('Steering Wheel Ring', wheel);
    registerInteriorPrimitive('Steering Hub / Spokes', spoke);
    registerInteriorPrimitive('Steering Column', column);

    registerInteriorPrimitive('Dashboard Face', dash);
    registerInteriorPrimitive('Dashboard Top', dashTop);
    registerInteriorPrimitive('Lower Dashboard', lowerDash);
    registerInteriorPrimitive('Dashboard Trim', trim);

    registerInteriorPrimitive('Instrument Binnacle', binnacle);
    registerInteriorPrimitive('Gauge Panel', gaugePanel);

    registerInteriorPrimitive('Center Vent', vent);
    registerInteriorPrimitive('Radio', radio);
    registerInteriorPrimitive('Glovebox', glove);
    registerInteriorPrimitive('Passenger Dash Wing', passengerDashWing);

    registerInteriorPrimitive('Left A-Pillar Outer', pillarL);
    registerInteriorPrimitive('Left A-Pillar Inner', pillarLInner);
    registerInteriorPrimitive('Right A-Pillar Outer', pillarR);
    registerInteriorPrimitive('Right A-Pillar Inner', pillarRInner);

    registerInteriorPrimitive('Left Upper Window Rail', leftUpperRail);
    registerInteriorPrimitive('Left Rear Window Frame', leftRearWindowFrame);
    registerInteriorPrimitive('Left Window Sill', leftWindowSill);
    registerInteriorPrimitive('Left Door Panel', leftDoorPanel);
    registerInteriorPrimitive('Left Door Inset', leftDoorInset);
    registerInteriorPrimitive('Left Door Top', doorTop);

    registerInteriorPrimitive('Right Upper Window Rail', rightUpperRail);
    registerInteriorPrimitive('Right Rear Window Frame', rightRearWindowFrame);
    registerInteriorPrimitive('Right Window Sill', rightWindowSill);
    registerInteriorPrimitive('Right Door Panel', rightDoorPanel);
    registerInteriorPrimitive('Right Door Inset', rightDoorInset);
    registerInteriorPrimitive('Right Door Top', doorTopR);
    registerInteriorPrimitive('Right Cab Side', rightCabSide);
    registerInteriorPrimitive('Right Roof Side', rightRoofSide);

    registerInteriorPrimitive('Roof Edge', roofEdge);
    registerInteriorPrimitive('Roof Liner', roofLiner);
    registerInteriorPrimitive('Windshield Base', windshieldBase);

    registerInteriorPrimitive('Left Kick Panel', leftKick);
    registerInteriorPrimitive('Right Kick Panel', rightKick);

    registerInteriorPrimitive('Rearview Mirror Housing', mirror);
    registerInteriorPrimitive('Rearview Mirror Glass', mirrorGlass);
  }
  buildCab();

  // User-preferred interior design is now the actual built-in baseline.
  // Reset Part / Reset All return to this geometry rather than the old raw prototype.
  const preferredInteriorGroupLayout = {"Steering Assembly":{"x":0.27,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Dashboard Main":{"x":0,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Instrument Cluster":{"x":-0.15,"y":0.02,"z":0.08,"rx":0,"ry":0,"rz":0,"sx":0.41,"sy":0.49,"sz":1},"Center Controls":{"x":0,"y":0.07,"z":0.02,"rx":0,"ry":0,"rz":0,"sx":0.61,"sy":0.95,"sz":0.25},"Passenger Dash / Glovebox":{"x":0,"y":0.17,"z":0.02,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Left A-Pillar":{"x":0,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Right A-Pillar":{"x":0,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Left Door / Window":{"x":0,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Right Door / Window":{"x":0.2,"y":0.06,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Roof / Windshield Frame":{"x":0,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Lower Kick Panels":{"x":0,"y":0,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1},"Rearview Mirror":{"x":-0.15,"y":0.07,"z":0,"rx":0,"ry":0,"rz":0,"sx":1,"sy":1,"sz":1}};

  function bakePreferredInteriorBaseline() {
    interiorLayout = JSON.parse(JSON.stringify(preferredInteriorGroupLayout));
    applyInteriorLayout();

    // After applying the preferred group transforms, rebase every group and primitive
    // to the resulting geometry. From here forward, editor values are offsets from
    // the user's preferred design, so zero = preferred design.
    const seen = new Set();
    for (const refs of Object.values(interiorEditorParts)) {
      for (const ref of refs) {
        if (seen.has(ref.obj)) continue;
        seen.add(ref.obj);
        ref.basePosition.copy(ref.obj.position);
        ref.baseRotation.copy(ref.obj.rotation);
        ref.baseScale.copy(ref.obj.scale);
      }
    }

    interiorLayout = {};
  }

  bakePreferredInteriorBaseline();

  try {
    const savedInterior = JSON.parse(localStorage.getItem(interiorLayoutStorageKey) || 'null');
    if (savedInterior && savedInterior.parts && typeof savedInterior.parts === 'object') {
      interiorLayout = savedInterior.parts;
    }
  } catch {}
  applyInteriorLayout();


  // -----------------------------------------------------------------
  // Complete low-poly exterior truck.
  // This is separate from the first-person cockpit, so the exterior can
  // have a proper hood/body while the driver's POV remains hood-free.
  // -----------------------------------------------------------------
  const truckExterior = new THREE.Group();
  truckExterior.visible = false;
  scene.add(truckExterior);

  const exteriorWheels = [];
  const exteriorFrontWheels = [];

  function buildTruckExterior() {
    const bodyBlue = 0x294d63;
    const bodyBlueLight = 0x365f78;
    const bodyBlueDark = 0x183444;
    const glass = 0x355467;
    const dark = 0x171b1d;
    const darker = 0x0f1213;
    const metal = 0x858d8f;
    const tire = 0x141617;
    const rim = 0x9ba0a0;
    const white = 0xd9d8c9;
    const amber = 0xb37a29;
    const red = 0x8f2626;
    const bedInner = 0x203743;

    const truck = new THREE.Group();
    truckExterior.add(truck);

    // Compact early-1980s-style pickup proportions, intentionally generic.
    const cabLower = box(2.26, 0.88, 2.08, bodyBlue);
    cabLower.position.set(0, 0.82, -0.46);
    truck.add(cabLower);

    const cabUpper = box(2.10, 0.62, 1.52, bodyBlue);
    cabUpper.position.set(0, 1.42, -0.39);
    truck.add(cabUpper);

    const roof = box(2.16, 0.12, 1.58, bodyBlueLight);
    roof.position.set(0, 1.77, -0.38);
    truck.add(roof);

    // Proper exterior hood; this does NOT exist in first-person.
    const hood = box(2.10, 0.23, 1.48, bodyBlue);
    hood.position.set(0, 0.99, -2.23);
    truck.add(hood);

    const hoodRaisedCenter = box(1.26, 0.045, 1.20, bodyBlueLight);
    hoodRaisedCenter.position.set(0, 1.125, -2.23);
    truck.add(hoodRaisedCenter);

    // Front fascia.
    const frontPanel = box(2.13, 0.55, 0.28, bodyBlueDark);
    frontPanel.position.set(0, 0.70, -3.02);
    truck.add(frontPanel);

    const grille = box(1.20, 0.29, 0.05, dark);
    grille.position.set(0, 0.73, -3.175);
    truck.add(grille);

    for (const gx of [-0.42, -0.14, 0.14, 0.42]) {
      const slat = box(0.05, 0.22, 0.055, metal);
      slat.position.set(gx, 0.73, -3.208);
      truck.add(slat);
    }

    const frontBumper = box(2.27, 0.20, 0.27, metal);
    frontBumper.position.set(0, 0.36, -3.20);
    truck.add(frontBumper);

    for (const sx of [-1, 1]) {
      const headlamp = box(0.37, 0.25, 0.06, white);
      headlamp.position.set(sx * 0.77, 0.75, -3.18);
      truck.add(headlamp);

      const turnLamp = box(0.20, 0.15, 0.065, amber);
      turnLamp.position.set(sx * 0.98, 0.55, -3.185);
      truck.add(turnLamp);
    }

    // Green-blue glass stays deliberately opaque-ish to fit flat low-poly style.
    const windshield = box(1.80, 0.50, 0.055, glass);
    windshield.position.set(0, 1.47, -1.17);
    windshield.rotation.x = -0.11;
    truck.add(windshield);

    const rearWindow = box(1.58, 0.42, 0.055, glass);
    rearWindow.position.set(0, 1.45, 0.38);
    truck.add(rearWindow);

    // Doors, side windows, B-pillars, handles and mirrors.
    for (const sx of [-1, 1]) {
      const door = box(0.11, 0.84, 1.43, bodyBlue);
      door.position.set(sx * 1.135, 0.82, -0.23);
      truck.add(door);

      const sideWindow = box(0.055, 0.46, 0.82, glass);
      sideWindow.position.set(sx * 1.197, 1.44, -0.32);
      truck.add(sideWindow);

      const bPillar = box(0.10, 0.58, 0.11, bodyBlueDark);
      bPillar.position.set(sx * 1.17, 1.43, 0.16);
      truck.add(bPillar);

      const handle = box(0.035, 0.055, 0.25, metal);
      handle.position.set(sx * 1.205, 1.00, 0.12);
      truck.add(handle);

      const mirrorStem = box(0.12, 0.07, 0.30, dark);
      mirrorStem.position.set(sx * 1.30, 1.29, -0.77);
      truck.add(mirrorStem);

      const sideMirror = box(0.12, 0.27, 0.37, dark);
      sideMirror.position.set(sx * 1.42, 1.31, -0.84);
      truck.add(sideMirror);

      const mirrorGlass = box(0.018, 0.21, 0.30, metal);
      mirrorGlass.position.set(sx * 1.488, 1.31, -0.84);
      truck.add(mirrorGlass);
    }

    // Bed: floor, side walls, front wall, tailgate and visible inner floor.
    const bedFloor = box(2.12, 0.18, 2.55, bodyBlueDark);
    bedFloor.position.set(0, 0.67, 1.88);
    truck.add(bedFloor);

    const bedLeft = box(0.17, 0.74, 2.58, bodyBlue);
    bedLeft.position.set(-1.055, 1.00, 1.88);
    truck.add(bedLeft);

    const bedRight = box(0.17, 0.74, 2.58, bodyBlue);
    bedRight.position.set(1.055, 1.00, 1.88);
    truck.add(bedRight);

    const bedFront = box(2.10, 0.74, 0.17, bodyBlue);
    bedFront.position.set(0, 1.00, 0.64);
    truck.add(bedFront);

    const tailgate = box(2.10, 0.74, 0.18, bodyBlue);
    tailgate.position.set(0, 1.00, 3.13);
    truck.add(tailgate);

    const bedInnerFloor = box(1.80, 0.05, 2.25, bedInner);
    bedInnerFloor.position.set(0, 0.79, 1.88);
    truck.add(bedInnerFloor);

    // Rear lamps / bumper.
    for (const sx of [-1, 1]) {
      const lamp = box(0.22, 0.37, 0.07, red);
      lamp.position.set(sx * 0.90, 0.92, 3.225);
      truck.add(lamp);
    }

    const rearBumper = box(2.27, 0.20, 0.26, metal);
    rearBumper.position.set(0, 0.36, 3.31);
    truck.add(rearBumper);

    // Chassis rails and simple axles make underside inspection less empty.
    for (const sx of [-1, 1]) {
      const rail = box(0.16, 0.16, 5.55, darker);
      rail.position.set(sx * 0.58, 0.37, 0.08);
      truck.add(rail);
    }

    const frontAxle = box(2.02, 0.12, 0.12, darker);
    frontAxle.position.set(0, 0.43, -2.04);
    truck.add(frontAxle);

    const rearAxle = box(2.02, 0.12, 0.12, darker);
    rearAxle.position.set(0, 0.43, 2.22);
    truck.add(rearAxle);

    function addWheel(x, z, front=false) {
      const wheel = new THREE.Group();

      const tireMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.43, 0.43, 0.29, 16),
        mat(tire)
      );
      tireMesh.rotation.z = Math.PI / 2;
      wheel.add(tireMesh);

      const wheelRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.302, 12),
        mat(rim)
      );
      wheelRim.rotation.z = Math.PI / 2;
      wheel.add(wheelRim);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.312, 10),
        mat(dark)
      );
      hub.rotation.z = Math.PI / 2;
      wheel.add(hub);

      wheel.position.set(x, 0.46, z);
      truck.add(wheel);
      exteriorWheels.push(wheel);
      if (front) exteriorFrontWheels.push(wheel);
    }

    addWheel(-1.15, -2.04, true);
    addWheel( 1.15, -2.04, true);
    addWheel(-1.15,  2.22, false);
    addWheel( 1.15,  2.22, false);

    // Fender/rocker strips visually integrate the body with the wheels.
    for (const sx of [-1, 1]) {
      const frontFender = box(0.17, 0.30, 1.23, bodyBlue);
      frontFender.position.set(sx * 1.055, 0.80, -2.03);
      truck.add(frontFender);

      const rocker = box(0.15, 0.20, 1.45, bodyBlueDark);
      rocker.position.set(sx * 1.06, 0.52, -0.24);
      truck.add(rocker);

      const rearFender = box(0.17, 0.30, 1.34, bodyBlue);
      rearFender.position.set(sx * 1.055, 0.80, 2.22);
      truck.add(rearFender);
    }

    // License plates.
    const frontPlate = box(0.42, 0.17, 0.025, 0xd0d3cf);
    frontPlate.position.set(0, 0.31, -3.35);
    truck.add(frontPlate);

    const rearPlate = box(0.42, 0.17, 0.025, 0xd0d3cf);
    rearPlate.position.set(0, 0.31, 3.45);
    truck.add(rearPlate);
  }

  buildTruckExterior();

  let exteriorView = false;
  let exteriorViewMode = 0; // chase, left rear, right rear, front quarter

  function setExteriorView(enabled) {
    exteriorView = !!enabled;
    truckExterior.visible = exteriorView;
    cab.visible = !exteriorView;
    if (!exteriorView && camera.fov !== settings.fov) {
      camera.fov = settings.fov;
      camera.updateProjectionMatrix();
    }
    if (typeof clearInteriorEditorHighlight === 'function') {
      if (exteriorView) clearInteriorEditorHighlight();
      else if (typeof currentInteriorPartName === 'function') highlightInteriorEditorPart(currentInteriorPartName());
    }
  }

  function cycleExteriorView() {
    exteriorViewMode = (exteriorViewMode + 1) % exteriorCameras.length;
    if (typeof exteriorCameraPreset !== 'undefined' && exteriorCameraPreset) {
      loadExteriorCameraEditor(exteriorViewMode);
    }
  }

  function updateTruckExterior() {
    truckExterior.position.set(player.x, player.y, player.z);
    truckExterior.rotation.set(0, player.heading, 0);

    // Wheel rotation is intentionally simple but gives the exterior life.
    const spin = player.distance / 0.43;
    for (const wheel of exteriorWheels) {
      wheel.children.forEach(child => child.rotation.x = spin);
    }
    for (const wheel of exteriorFrontWheels) {
      wheel.rotation.y = -player.steer * 0.34;
    }
  }

  function applyExteriorCameraPose() {
    const o = exteriorCameras[exteriorViewMode] || exteriorCameraDefaults[0];
    const c = Math.cos(player.heading), s = Math.sin(player.heading);

    const ox = o.x * c + o.z * s;
    const oz = -o.x * s + o.z * c;
    camera.position.set(player.x + ox, player.y + o.y, player.z + oz);

    const tx = o.targetX * c + o.targetZ * s;
    const tz = -o.targetX * s + o.targetZ * c;
    camera.lookAt(new THREE.Vector3(
      player.x + tx,
      player.y + o.targetY,
      player.z + tz
    ));

    if (camera.fov !== o.fov) {
      camera.fov = o.fov;
      camera.updateProjectionMatrix();
    }
  }

  const SEG_LEN = 120;
  const LANE_W = 3.65;
  const ROAD_HALF = 13.9;
  const laneCenters = [2.9, 6.45, 10.0];
  const opposingCenters = [-2.9, -6.45, -10.0];


  function seededNoise1D(n) {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function addFenceLine(group, x, z0, z1) {
    const len = Math.abs(z1-z0);
    const dir = z1 >= z0 ? 1 : -1;
    const positions=[];
    for (let d=0; d<=len; d+=8) {
      positions.push(z0+dir*d);
    }

    if(positions.length){
      const key='.08|.72|.08';
      if(!boxGeoCache.has(key)) boxGeoCache.set(key,new THREE.BoxGeometry(.08,.72,.08));
      const posts=new THREE.InstancedMesh(
        boxGeoCache.get(key),
        mat(0x5d5548),
        positions.length
      );
      const matrix=new THREE.Matrix4();
      positions.forEach((z,i)=>{
        matrix.makeTranslation(x,.36,z);
        posts.setMatrixAt(i,matrix);
      });
      posts.instanceMatrix.needsUpdate=true;
      group.add(posts);
    }

    for (const y of [.32,.55]) {
      const rail = box(.055,.045,len,0x6f675a);
      rail.position.set(x,y,(z0+z1)/2);
      group.add(rail);
    }
  }

  function addUtilityPole(group, x, z) {
    if(group.userData?.utilityPoleBatch){
      group.userData.utilityPoleBatch.push({x,z});
      return;
    }

    const pole = box(.13,5.4,.13,0x5d4b36);
    pole.position.set(x,2.7,z);
    group.add(pole);
    const arm = box(1.15,.11,.11,0x5d4b36);
    arm.position.set(x,4.9,z);
    group.add(arm);
    for (const dx of [-.42,0,.42]) {
      const ins = box(.07,.16,.07,0xbdb8a9);
      ins.position.set(x+dx,5.0,z);
      group.add(ins);
    }
  }

  function flushUtilityPoleBatch(group) {
    const poles=group.userData?.utilityPoleBatch||[];
    if(!poles.length){
      delete group.userData.utilityPoleBatch;
      return;
    }

    const dummy=new THREE.Object3D();

    const shafts=new THREE.InstancedMesh(
      instancedUnitBoxGeo,
      mat(0x5d4b36),
      poles.length
    );
    shafts.userData.sharedGeometry=true;

    const arms=new THREE.InstancedMesh(
      instancedUnitBoxGeo,
      mat(0x5d4b36),
      poles.length
    );
    arms.userData.sharedGeometry=true;

    const insulators=new THREE.InstancedMesh(
      instancedUnitBoxGeo,
      mat(0xbdb8a9),
      poles.length*3
    );
    insulators.userData.sharedGeometry=true;

    let insIndex=0;
    poles.forEach((p,i)=>{
      dummy.rotation.set(0,0,0);

      dummy.position.set(p.x,2.7,p.z);
      dummy.scale.set(.13,5.4,.13);
      dummy.updateMatrix();
      shafts.setMatrixAt(i,dummy.matrix);

      dummy.position.set(p.x,4.9,p.z);
      dummy.scale.set(1.15,.11,.11);
      dummy.updateMatrix();
      arms.setMatrixAt(i,dummy.matrix);

      for(const dx of [-.42,0,.42]){
        dummy.position.set(p.x+dx,5.0,p.z);
        dummy.scale.set(.07,.16,.07);
        dummy.updateMatrix();
        insulators.setMatrixAt(insIndex++,dummy.matrix);
      }
    });

    shafts.instanceMatrix.needsUpdate=true;
    arms.instanceMatrix.needsUpdate=true;
    insulators.instanceMatrix.needsUpdate=true;
    group.add(shafts,arms,insulators);

    delete group.userData.utilityPoleBatch;
  }

  function addSimpleBarn(group, x, z, scale=1) {
    const body = box(7*scale,3.2*scale,9*scale,0x7f3f32);
    body.position.set(x,1.6*scale,z);
    group.add(body);
    const roof = box(7.8*scale,.45*scale,9.8*scale,0x4c4742);
    roof.position.set(x,3.45*scale,z);
    roof.rotation.z = Math.PI/18;
    group.add(roof);
    const door = box(2.1*scale,2.3*scale,.12*scale,0xc6b18e);
    door.position.set(x,1.15*scale,z-4.56*scale);
    group.add(door);
  }

  function addSilo(group, x, z, scale=1) {
    const silo = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55*scale,1.55*scale,6.5*scale,12),
      mat(0xb0aaa0)
    );
    silo.position.set(x,3.25*scale,z);
    group.add(silo);
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(1.7*scale,1.15*scale,12),
      mat(0x8e8881)
    );
    cap.position.set(x,7.05*scale,z);
    group.add(cap);
  }

  function addCanal(group, x, z, length=70) {
    const ditch = box(4.2,.12,length,0x5b4935);
    ditch.position.set(x,-.04,z);
    group.add(ditch);
    const water = box(2.35,.035,length-.6,0x4b7080);
    water.position.set(x,.015,z);
    group.add(water);
  }

  function makeInterstateShieldSprite(number='9', scaleX=1.28, scaleY=1.55) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 300;
    const ctx = c.getContext('2d');

    ctx.clearRect(0,0,c.width,c.height);
    ctx.lineJoin='round';

    // Compact approximation of the familiar U.S. Interstate shield:
    // red crown, blue lower field, heavy white border.
    ctx.beginPath();
    ctx.moveTo(30,50);
    ctx.quadraticCurveTo(128,10,226,50);
    ctx.lineTo(218,178);
    ctx.quadraticCurveTo(196,247,128,282);
    ctx.quadraticCurveTo(60,247,38,178);
    ctx.closePath();
    ctx.fillStyle='#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(40,58);
    ctx.quadraticCurveTo(128,25,216,58);
    ctx.lineTo(211,105);
    ctx.lineTo(45,105);
    ctx.closePath();
    ctx.fillStyle='#b4212b';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(45,108);
    ctx.lineTo(211,108);
    ctx.lineTo(207,174);
    ctx.quadraticCurveTo(188,235,128,267);
    ctx.quadraticCurveTo(68,235,49,174);
    ctx.closePath();
    ctx.fillStyle='#174a8b';
    ctx.fill();

    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 28px Arial';
    ctx.fillText('INTERSTATE',128,78);
    ctx.font='bold 106px Arial';
    ctx.fillText(String(number),128,181);

    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,transparent:true}));
    spr.scale.set(scaleX,scaleY,1);
    return spr;
  }

  function makeFreewayPanelSprite(text, width=2.4, height=.72, bg='#1764a5', fg='#ffffff', fontPx=42) {
    const c=document.createElement('canvas');
    c.width=512; c.height=160;
    const ctx=c.getContext('2d');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);
    ctx.fillStyle=fg;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font=`bold ${fontPx}px Arial`;
    ctx.fillText(String(text).toUpperCase(),256,82);

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(width,height,1);
    return spr;
  }

  function makeEntranceArrowSprite(width=2.4,height=.72) {
    const c=document.createElement('canvas');
    c.width=512; c.height=160;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1764a5';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);

    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.moveTo(115,68);
    ctx.lineTo(325,68);
    ctx.lineTo(325,38);
    ctx.lineTo(420,80);
    ctx.lineTo(325,122);
    ctx.lineTo(325,92);
    ctx.lineTo(115,92);
    ctx.closePath();
    ctx.fill();

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(width,height,1);
    return spr;
  }

  function addFreewayEntranceAssembly(group,x,z) {
    // Place the stack just off the right side of the rest-area return road.
    // The arrow points east (+x), toward the roadway from the sign position.
    const post=box(.10,5.25,.10,0x777a72);
    post.position.set(x,REST_AREA_BASE_Y+2.62,z+.04);
    group.add(post);

    const entrance=makeFreewayPanelSprite('FREEWAY ENTRANCE',3.3,.78,'#ffffff','#111111',38);
    entrance.position.set(x,REST_AREA_BASE_Y+5.20,z);
    group.add(entrance);

    const shield=makeInterstateShieldSprite('9',1.20,1.45);
    shield.position.set(x,REST_AREA_BASE_Y+4.02,z);
    group.add(shield);

    const north=makeFreewayPanelSprite('NORTH',2.25,.66,'#1764a5','#ffffff',44);
    north.position.set(x,REST_AREA_BASE_Y+2.93,z);
    group.add(north);

    const arrow=makeEntranceArrowSprite(2.25,.66);
    arrow.position.set(x,REST_AREA_BASE_Y+2.12,z);
    group.add(arrow);
  }

  function addRouteMarker(group, x, z) {
    // Route markers belong beyond the right shoulder, not in a travel lane.
    const shoulderX = Math.max(15.25, x);
    const marker = makeInterstateShieldSprite('9',1.22,1.48);
    marker.position.set(shoulderX,2.15,z);
    registerOneSidedSignSprite(marker,0,1);
    group.add(marker);

    const post = box(.075,1.72,.075,0x777a72);
    post.position.set(shoulderX,.88,z+.03);
    group.add(post);
  }

  function trafficCruiseSpeedForLane(lane, opposing=false) {
    const abs = Math.abs(lane);
    // Slightly faster toward the left/median side, slower toward the right.
    let mph = abs < 4 ? 69 : abs < 8 ? 64 : 59;
    mph += (Math.random() - .5) * 8;
    if (opposing) mph += (Math.random() - .5) * 4;
    return mph / 2.23694;
  }

  function laneIndexFromLocalX(localX, opposing=false) {
    const lanes = opposing ? opposingCenters : laneCenters;
    let best = 0, bestD = Infinity;
    lanes.forEach((x,i)=>{
      const d = Math.abs(localX-x);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  // ROAD GENERATION I
  // Interstate 9 now follows a smooth, deterministic centerline rather than
  // assigning disconnected random curvature/elevation values to each chunk.
  // The amplitudes are deliberately restrained: broad freeway bends and very
  // shallow grades only.
  function roadCenterXAtZ(z) {
    return (
      Math.sin(z / 720) * 7.2 +
      Math.sin(z / 1320 + 1.15) * 3.4 +
      Math.sin(z / 3100 + 2.2) * 2.0
    );
  }

  // UNIVERSAL FLAT DATUM
  // The entire ordinary ground world uses one fixed elevation. I-9, county
  // roads, dirt roads, driveways, and the rest area all share this surface.
  const WORLD_FLAT_GROUND_Y = 0.72697549942266;
  const SURFACE_ROAD_Y = WORLD_FLAT_GROUND_Y + .060;
  const ROAD_MARKING_Y = SURFACE_ROAD_Y + .072;

  function roadCenterYAtZ(z) {
    return SURFACE_ROAD_Y;
  }

  function roadHeadingAtZ(z) {
    const dxDz = (
      Math.cos(z / 720) * (7.2 / 720) +
      Math.cos(z / 1320 + 1.15) * (3.4 / 1320) +
      Math.cos(z / 3100 + 2.2) * (2.0 / 3100)
    );
    return Math.asin(THREE.MathUtils.clamp(dxDz, -0.18, 0.18));
  }

  function roadPitchAtZ(z) {
    // I-9 can curve horizontally, but ordinary freeway pavement never rises
    // or falls relative to the flat world datum.
    return 0;
  }

  function roadCurvatureAtZ(z) {
    const dz = 30;
    return (roadHeadingAtZ(z - dz) - roadHeadingAtZ(z + dz)) / (dz * 2);
  }

  function localRoadX(worldX, z) {
    return worldX - roadCenterXAtZ(z);
  }

  function laneWorldX(localX, z) {
    return roadCenterXAtZ(z) + localX;
  }

  function medianTypeForIndex(index) {
    // Long runs instead of flickering from one median type to another.
    const region = Math.floor(index / 7);
    const cycle = ((region % 9) + 9) % 9;
    if (cycle < 4) return 'dirt';
    if (cycle < 6) return 'grass';
    if (cycle < 8) return 'concrete';
    return 'guardrail';
  }


  // ROAD GENERATION II
  // Crossroads appear at long, deterministic intervals. Two out of every
  // three crossings are full diamond-style interchanges; the remainder are
  // simple overpasses with no freeway access.
  const CROSSING_SPACING = 8;       // chunks ~= 0.6 mile spacing at minimum
  const OVERPASS_Y = 5.55;
  const CROSSROAD_HALF_WIDTH = 5.35;
  const CROSSROAD_BRIDGE_HALF_SPAN = 36;
  const CROSSROAD_GRADE_END = 104;
  const RAMP_HALF_WIDTH = 2.70;

  function positiveMod(n, m) { return ((n % m) + m) % m; }

  function crossingSequenceForIndex(index) {
    if (positiveMod(index - 4, CROSSING_SPACING) !== 0) return null;
    return Math.floor((index - 4) / CROSSING_SPACING);
  }

  function crossingInfo(index) {
    const seq = crossingSequenceForIndex(index);
    if (seq === null) return null;

    // 2 of every 3 crossings have ramps: comfortably above the requested half.
    const accessible = positiveMod(seq, 3) !== 0;
    const roadName = `${angloA[positiveMod(seq * 5 + 3, angloA.length)]} ${angloB[positiveMod(seq * 7 + 1, angloB.length)]} Road`;
    const exitNumber = 18 + Math.max(0, seq + 8) * 3;

    return {
      index,
      seq,
      accessible,
      roadName,
      exitNumber,
      destination: placeName(),
      branchSide: positiveMod(seq,2)===0 ? 1 : -1,
      branchOffset: 50 + positiveMod(seq*11,20),
      loopBias: positiveMod(seq,4)
    };
  }

  function worldToCrossingLocal(index, x, z) {
    const cz = -index * SEG_LEN;
    const cx = roadCenterXAtZ(cz);
    const h = roadHeadingAtZ(cz);
    const c = Math.cos(h), s = Math.sin(h);
    const dx = x - cx, dz = z - cz;
    return {
      x: c * dx - s * dz,
      z: s * dx + c * dz
    };
  }

  function crossingLocalToWorld(index, lx, lz, ly=0) {
    const cz = -index * SEG_LEN;
    const cx = roadCenterXAtZ(cz);
    const cy = roadCenterYAtZ(cz);
    const h = roadHeadingAtZ(cz);
    const c = Math.cos(h), s = Math.sin(h);
    return new THREE.Vector3(
      cx + c * lx + s * lz,
      cy + ly,
      cz - s * lx + c * lz
    );
  }

  function pointSegmentDistance2D(px, pz, ax, az, bx, bz) {
    const abx = bx - ax, abz = bz - az;
    const apx = px - ax, apz = pz - az;
    const denom = abx*abx + abz*abz || 1;
    const t = THREE.MathUtils.clamp((apx*abx + apz*abz) / denom, 0, 1);
    const qx = ax + abx*t, qz = az + abz*t;
    return { distance: Math.hypot(px-qx, pz-qz), t };
  }


  function cubicBezierPoint2D(p0, p1, p2, p3, t) {
    const u = 1-t;
    const a = u*u*u;
    const b = 3*u*u*t;
    const c = 3*u*t*t;
    const d = t*t*t;
    return {
      x: a*p0.x + b*p1.x + c*p2.x + d*p3.x,
      z: a*p0.z + b*p1.z + c*p2.z + d*p3.z
    };
  }

  function smoothRampHeight(t) {
    // Quintic smootherstep gives near-zero slope at both ends of the climb.
    t = THREE.MathUtils.clamp(t,0,1);
    const s = t*t*t*(t*(t*6-15)+10);
    return OVERPASS_Y * s;
  }

  function crossroadHeightAtLocalX(localX) {
    const ax=Math.abs(localX);
    if(ax<=CROSSROAD_BRIDGE_HALF_SPAN) return OVERPASS_Y;
    if(ax>=CROSSROAD_GRADE_END) return 0;
    const t=(CROSSROAD_GRADE_END-ax) /
            (CROSSROAD_GRADE_END-CROSSROAD_BRIDGE_HALF_SPAN);
    return smoothRampHeight(t);
  }

  function rampDefinition(kind) {
    // Long tangency zones at BOTH ends are the key to the "butter" transition:
    // the ramp initially runs parallel to I-9, then gently sweeps outward, and
    // finishes parallel to the country road before joining it.
    if (kind === 'off') {
      return {
        // Ramp begins in the fully-developed FOURTH auxiliary lane.
        p0:{x:15.85,z:98.0},
        p1:{x:15.90,z:76.0},
        p2:{x:23.5,z:4.7},
        p3:{x:42.5,z:4.7},
        rising:true
      };
    }
    return {
      p0:{x:42.5,z:-4.7},
      p1:{x:23.5,z:-4.7},
      p2:{x:15.90,z:-76.0},
      p3:{x:15.85,z:-98.0},
      rising:false
    };
  }

  function rampHalfWidthAt(kind, t) {
    // The physical ramp is full-width from throat to crossroad. The auxiliary
    // lane and gore geometry already provide the freeway-side taper, so
    // narrowing the ramp mesh itself exposed terrain between it and I-9.
    return RAMP_HALF_WIDTH;
  }

  function rampVerticalHeight(kind,t) {
    const d=rampDefinition(kind);
    const localRoadX = kind==='off'
      ? THREE.MathUtils.lerp(d.p0.x,d.p3.x,t)
      : THREE.MathUtils.lerp(d.p3.x,d.p0.x,1-t);
    const elevatedEnd=crossroadHeightAtLocalX(d.p3.x);

    // Quintic interpolation gives zero vertical slope at freeway and road ends.
    const u=THREE.MathUtils.clamp(kind==='off'?t:(1-t),0,1);
    const s=u*u*u*(u*(u*6-15)+10);
    return elevatedEnd*s;
  }

  function rampSamples(kind, count=80) {
    const d = rampDefinition(kind);
    const pts = [];
    const elevatedEnd=crossroadHeightAtLocalX(d.p3.x);
    for (let i=0;i<=count;i++) {
      const t = i/count;
      const p = cubicBezierPoint2D(d.p0,d.p1,d.p2,d.p3,t);
      const u=kind==='off'?t:(1-t);
      const s=u*u*u*(u*(u*6-15)+10);
      pts.push({x:p.x,z:p.z,t,height:elevatedEnd*s});
    }
    return pts;
  }

  function nearestRampHit(localPoint, kind) {
    const pts = rampSamples(kind, 100);
    let best = { distance: Infinity, t: 0, height: 0, halfWidth: 1.18 };
    for (let i=0;i<pts.length-1;i++) {
      const a = pts[i], b = pts[i+1];
      const hit = pointSegmentDistance2D(localPoint.x,localPoint.z,a.x,a.z,b.x,b.z);
      if (hit.distance < best.distance) {
        const t = THREE.MathUtils.lerp(a.t,b.t,hit.t);
        const height = THREE.MathUtils.lerp(a.height,b.height,hit.t);
        best = {distance:hit.distance,t,height,halfWidth:rampHalfWidthAt(kind,t)};
      }
    }
    return best;
  }

  function nearbyCrossingIndices(z) {
    const base = Math.round((-z - 4*SEG_LEN) / (CROSSING_SPACING*SEG_LEN));
    const out = [];
    for (let k=-1;k<=1;k++) out.push(4 + (base+k)*CROSSING_SPACING);
    return out;
  }

  // Height sampler for stacked road geometry. The freeway remains underneath
  // the bridge near the centerline, while the outer crossroad and ramps become
  // drivable surfaces.

  function ruralRoadSurfaceAtCrossing(index, x, z) {
    const info = crossingInfo(index);
    if (!info) return null;

    const p = worldToCrossingLocal(index,x,z);
    const baseY = roadCenterYAtZ(-index*SEG_LEN);
    const side = info.branchSide;
    const branchX = side*info.branchOffset;
    const branchDir = info.loopBias < 2 ? 1 : -1;
    const parallelX = side*(72 + info.loopBias*5);

    let paved = Infinity;
    let dirt = Infinity;

    const pavedSeg = (ax,az,bx,bz) => {
      paved = Math.min(paved, pointSegmentDistance2D(p.x,p.z,ax,az,bx,bz).distance);
    };
    const dirtSeg = (ax,az,bx,bz) => {
      dirt = Math.min(dirt, pointSegmentDistance2D(p.x,p.z,ax,az,bx,bz).distance);
    };

    pavedSeg(-320,0,320,0);

    pavedSeg(branchX,0,branchX,branchDir*62);
    pavedSeg(branchX,branchDir*62,parallelX,branchDir*62);
    pavedSeg(parallelX,branchDir*62,parallelX,-branchDir*90);

    for (const s of [-1,1]) {
      const outerX=s*(250 + info.loopBias*10);
      const innerX=s*(145 + info.loopBias*6);
      pavedSeg(s*130,0,outerX,0);
      pavedSeg(outerX,-170,outerX,170);
      pavedSeg(innerX,170,outerX,170);
      pavedSeg(innerX,-170,outerX,-170);
      pavedSeg(innerX,-170,innerX,170);

      dirtSeg(outerX,170,s*(350+info.loopBias*12),245);
      dirtSeg(outerX,-170,s*(350+info.loopBias*12),-245);
    }

    const dirtEndX = parallelX + side*(40 + info.loopBias*9);
    const dirtEndZ = -branchDir*(150 + info.loopBias*12);
    dirtSeg(parallelX,-branchDir*54,dirtEndX,dirtEndZ);

    if (paved <= 3.75) return SURFACE_ROAD_Y;
    if (dirt <= 2.9) return SURFACE_ROAD_Y;
    return null;
  }

  function auxiliaryLaneEnvelopeAtLocalZ(kind,lz) {
    const lane3Outer=laneCenters[2]+LANE_W/2;
    const fullOuter=17.55;

    // Both directions use the same topology in mirrored Z:
    // 330 -> 160 is taper, 160 -> 112 is full-width throat.
    const sign=kind==='off'?1:-1;
    const az=Math.abs(lz);
    if(sign*lz<0) return null;

    if(az>330 || az<112) return null;

    if(az>=160){
      // Smoothly grow from virtually zero width at 330 m to full width at 160 m.
      const t=THREE.MathUtils.clamp((330-az)/(330-160),0,1);
      const s=t*t*t*(t*(t*6-15)+10);
      const outer=THREE.MathUtils.lerp(lane3Outer+.05,fullOuter,s);
      return {inner:lane3Outer,outer,phase:'taper'};
    }

    return {inner:lane3Outer,outer:fullOuter,phase:'full'};
  }

  function auxiliaryLaneBoundsAtLocalZ(kind,lz) {
    return auxiliaryLaneEnvelopeAtLocalZ(kind,lz);
  }

  function rampThroatEnvelopeAtLocalZ(kind,lz) {
    const sign=kind==='off'?1:-1;
    if(sign*lz<0) return null;

    const az=Math.abs(lz);
    if(az<98 || az>114) return null;

    const lane3Outer=laneCenters[2]+LANE_W/2;
    const auxOuter=17.55;
    const d=rampDefinition(kind);
    const rampEnd=kind==='off'?d.p0:d.p3;

    const t=THREE.MathUtils.clamp((114-az)/(114-98),0,1);
    const s=t*t*(3-2*t);

    return {
      inner:THREE.MathUtils.lerp(lane3Outer,rampEnd.x-RAMP_HALF_WIDTH,s),
      outer:THREE.MathUtils.lerp(auxOuter,rampEnd.x+RAMP_HALF_WIDTH,s)
    };
  }

  function rampThroatHitAtCrossing(index,x,z) {
    const info=crossingInfo(index);
    if(!info?.accessible) return null;
    const p=worldToCrossingLocal(index,x,z);

    for(const kind of ['off','on']){
      const b=rampThroatEnvelopeAtLocalZ(kind,p.z);
      if(b && p.x>=b.inner-.12 && p.x<=b.outer+.12){
        return {kind,local:p,bounds:b};
      }
    }
    return null;
  }

  function auxiliaryLaneHitAtCrossing(index,x,z) {
    const info=crossingInfo(index);
    if(!info?.accessible) return null;
    const p=worldToCrossingLocal(index,x,z);

    for(const kind of ['off','on']){
      const b=auxiliaryLaneBoundsAtLocalZ(kind,p.z);
      if(b && p.x>=b.inner-.12 && p.x<=b.outer+.12){
        return {kind,local:p,bounds:b};
      }
    }
    return null;
  }

  function interchangeSurfaceAt(index,x,z,currentY=null) {
    const info=crossingInfo(index);
    if(!info) return null;

    const crossingZ=-index*SEG_LEN;
    const baseY=roadCenterYAtZ(crossingZ);
    const p=worldToCrossingLocal(index,x,z);

    // 1) Unified freeway-to-ramp throat is authoritative wherever its
    // boundary envelope exists.
    if(info.accessible){
      const throat=rampThroatHitAtCrossing(index,x,z);
      if(throat){
        return {
          y:roadCenterYAtZ(z),
          type:'throat',
          kind:throat.kind,
          local:p
        };
      }

      // 2) Curved ramps are authoritative wherever their pavement exists.
      let bestRamp=null;
      for(const kind of ['off','on']){
        const hit=nearestRampHit(p,kind);
        if(hit.distance<=hit.halfWidth+.18 &&
           (!bestRamp || hit.distance<bestRamp.distance)){
          bestRamp={...hit,kind};
        }
      }
      if(bestRamp){
        return {
          y:baseY+bestRamp.height,
          type:'ramp',
          kind:bestRamp.kind,
          local:p
        };
      }

      // 3) Auxiliary lanes are exactly freeway elevation until the ramp throat.
      const aux=auxiliaryLaneHitAtCrossing(index,x,z);
      if(aux){
        return {
          y:roadCenterYAtZ(z),
          type:'aux',
          kind:aux.kind,
          local:p
        };
      }
    }

    // 3) Overpass/approach profile. One formula owns both deck and grade.
    if(Math.abs(p.z)<=CROSSROAD_HALF_WIDTH+.32){
      const ax=Math.abs(p.x);
      const alreadyOnBridge=currentY!==null && currentY>baseY+2.15;

      if(ax>=130 && ax<=320){
        return {y:SURFACE_ROAD_Y,type:'crossroad',local:p};
      }
      if(ax>=CROSSROAD_GRADE_END && ax<130){
        const t=(130-ax)/(130-CROSSROAD_GRADE_END);
        const s=t*t*t*(t*(t*6-15)+10);
        return {
          y:SURFACE_ROAD_Y,
          type:'crossroad',
          local:p
        };
      }
      if(ax>=CROSSROAD_BRIDGE_HALF_SPAN && ax<CROSSROAD_GRADE_END){
        const t=(CROSSROAD_GRADE_END-ax)/
                (CROSSROAD_GRADE_END-CROSSROAD_BRIDGE_HALF_SPAN);
        return {y:baseY+smoothRampHeight(t),type:'crossroad',local:p};
      }
      if(ax<=CROSSROAD_BRIDGE_HALF_SPAN && (ax>=14||alreadyOnBridge)){
        return {y:baseY+OVERPASS_Y,type:'bridge',local:p};
      }
    }

    // 4) Remaining local rural network around the interchange.
    const ruralY=ruralRoadSurfaceAtCrossing(index,x,z);
    if(ruralY!==null){
      return {y:ruralY,type:'rural',local:p};
    }

    return null;
  }

  function interchangeSurfaceInfoAt(x,z,currentY=null) {
    let best=null;
    for(const idx of nearbyCrossingIndices(z)){
      const s=interchangeSurfaceAt(idx,x,z,currentY);
      if(!s) continue;

      // Prefer ramps/auxiliary lanes over broad rural/crossroad overlap.
      const priority=s.type==='ramp'?6:
                     s.type==='throat'?5:
                     s.type==='aux'?4:
                     s.type==='bridge'?3:
                     s.type==='crossroad'?2:1;
      if(!best || priority>best.priority){
        best={...s,index:idx,priority};
      }
    }
    return best;
  }

  function drivableSurfaceYAt(x, z, currentY=null) {
    const freewayY=roadCenterYAtZ(z);

    // Base terrain/freeway surface.
    let y=Math.abs(localRoadX(x,z))<=ROAD_HALF+3.0
      ? freewayY
      : terrainYAt(x,z);

    const restY=restAreaSurfaceYAt(x,z);
    if(restY!==null) y=restY;

    const procRoadY=proceduralRoadSurfaceYAt(x,z);
    if(procRoadY!==null) y=procRoadY;

    // A single resolver owns the interchange. This prevents tiny "highest
    // surface wins" steps where auxiliary lane, ramp, and overpass overlap.
    const interchange=interchangeSurfaceInfoAt(x,z,currentY);
    if(interchange) y=interchange.y;

    return y;
  }

  const REST_AREA_BASE_Y = SURFACE_ROAD_Y;
  // Centered in a single marked stall; facing outward toward the circulation aisle.
  const REST_START = { x: 49.0, y: REST_AREA_BASE_Y, z: 24.0, heading: Math.PI/2 };

  const REST_MERGE_ROAD_WIDTH = 5.75;
  const REST_MERGE_TAIL_WIDTH = 0.16;
  const REST_MERGE_LOCAL_X = ROAD_HALF + REST_MERGE_ROAD_WIDTH/2 + .05;
  const REST_MERGE_Z = 135;
  const REST_MERGE_TAIL = 46;

  function restAreaPathDefinition(kind) {
    if (kind === 'entry') {
      // The first two control points lie on the I-9 shoulder centerline.
      // That makes the diverge tangent match the highway axis before it
      // begins the gentle curve toward the parking lot.
      return {
        p0:{x:laneWorldX(REST_MERGE_LOCAL_X, REST_MERGE_Z),z:REST_MERGE_Z},
        p1:{x:laneWorldX(REST_MERGE_LOCAL_X, 110),z:110},
        p2:{x:31.5,z:66},
        p3:{x:31.5,z:41}
      };
    }

    // Same idea in reverse: the return road finishes with a highway-aligned
    // tangent so there is no crooked seam at the merge.
    return {
      p0:{x:31.5,z:-41},
      p1:{x:31.5,z:-66},
      p2:{x:laneWorldX(REST_MERGE_LOCAL_X,-110),z:-110},
      p3:{x:laneWorldX(REST_MERGE_LOCAL_X,-REST_MERGE_Z),z:-REST_MERGE_Z}
    };
  }

  function restAreaPathSamples(kind, count=30) {
    const d = restAreaPathDefinition(kind);
    const pts = [];
    for (let i=0;i<=count;i++) {
      const t=i/count;
      const p=cubicBezierPoint2D(d.p0,d.p1,d.p2,d.p3,t);
      const freewayY=SURFACE_ROAD_Y;
      pts.push({x:p.x,z:p.z,y:freewayY,t});
    }
    return pts;
  }

  function nearestRestAreaPathHit(x,z,kind) {
    const pts=restAreaPathSamples(kind,40);
    let best={distance:Infinity,y:REST_AREA_BASE_Y,t:0,width:REST_MERGE_ROAD_WIDTH};
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      const h=pointSegmentDistance2D(x,z,a.x,a.z,b.x,b.z);
      if(h.distance<best.distance){
        const tt=THREE.MathUtils.lerp(a.t,b.t,h.t);
        const facilityT = kind==='entry' ? tt : (1-tt);
        best={
          distance:h.distance,
          y:THREE.MathUtils.lerp(a.y,b.y,h.t),
          t:tt,
          width:THREE.MathUtils.lerp(REST_MERGE_ROAD_WIDTH,6.8,facilityT)
        };
      }
    }
    return best;
  }

  function restMergeEnvelopeAtZ(kind,z) {
    const sign=kind==='entry'?1:-1;
    if(sign*z<0) return null;

    const az=Math.abs(z);
    if(az<REST_MERGE_Z || az>REST_MERGE_Z+REST_MERGE_TAIL) return null;

    const t=(az-REST_MERGE_Z)/REST_MERGE_TAIL;
    const s=t*t*t*(t*(t*6-15)+10);

    // The freeway already owns all asphalt inward of ROAD_HALF. The rest-area
    // acceleration/deceleration lane is an ADDITION outside that boundary.
    // Keeping the inner edge fixed prevents a rectangular tongue from jutting
    // into the existing highway pavement.
    const inner=laneWorldX(ROAD_HALF+.02,z);
    const fullOuter=inner+REST_MERGE_ROAD_WIDTH;
    const outer=THREE.MathUtils.lerp(fullOuter,inner+REST_MERGE_TAIL_WIDTH,s);

    return {
      inner,
      outer,
      width:outer-inner,
      y:roadCenterYAtZ(z)
    };
  }

  function nearestRestMergeTailHit(x,z,kind) {
    const sign=kind==='entry'?1:-1;
    const zA=sign*REST_MERGE_Z;
    const zB=sign*(REST_MERGE_Z+REST_MERGE_TAIL);
    const steps=24;
    let best={distance:Infinity,y:SURFACE_ROAD_Y,width:0};

    for(let i=0;i<steps;i++){
      const za=THREE.MathUtils.lerp(zA,zB,i/steps);
      const zb=THREE.MathUtils.lerp(zA,zB,(i+1)/steps);
      const ea=restMergeEnvelopeAtZ(kind,za);
      const eb=restMergeEnvelopeAtZ(kind,zb);
      if(!ea||!eb) continue;

      const ax=(ea.inner+ea.outer)/2;
      const bx=(eb.inner+eb.outer)/2;
      const hit=pointSegmentDistance2D(x,z,ax,za,bx,zb);
      if(hit.distance<best.distance){
        const width=THREE.MathUtils.lerp(ea.width,eb.width,hit.t);
        best={
          distance:hit.distance,
          y:SURFACE_ROAD_Y,
          width
        };
      }
    }
    return best;
  }

  function restAreaSurfaceYAt(x,z) {
    // Main parking/drive area.
    if (x>=27 && x<=58 && z>=-42 && z<=42) return REST_AREA_BASE_Y;

    // Facility-side paved apron.
    if (x>=52 && x<=68 && z>=-28 && z<=28) return REST_AREA_BASE_Y;

    const entry=nearestRestAreaPathHit(x,z,'entry');
    if(entry.distance<=entry.width/2+.20) return entry.y;

    const exit=nearestRestAreaPathHit(x,z,'exit');
    if(exit.distance<=exit.width/2+.20) return exit.y;

    // Merge tails use the exact same inner/outer pavement envelope as rendering.
    const entryEnv=restMergeEnvelopeAtZ('entry',z);
    if(entryEnv && x>=entryEnv.inner-.14 && x<=entryEnv.outer+.14) return entryEnv.y;

    const exitEnv=restMergeEnvelopeAtZ('exit',z);
    if(exitEnv && x>=exitEnv.inner-.14 && x<=exitEnv.outer+.14) return exitEnv.y;

    return null;
  }

  function addRestAreaTree(group,x,z,scale=1) {
    const trunk=box(.24*scale,1.7*scale,.24*scale,0x5a4531);
    trunk.position.set(x,REST_AREA_BASE_Y+.85*scale,z);
    group.add(trunk);

    const crown=new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.25*scale,0),
      mat(0x547044)
    );
    crown.position.set(x,REST_AREA_BASE_Y+2.15*scale,z);
    crown.scale.y=.9;
    group.add(crown);
  }

  function addRestAreaBuilding(group,x,z,w,d) {
    const body=box(w,3.1,d,0x785f4c);
    body.position.set(x,REST_AREA_BASE_Y+1.55,z);
    group.add(body);

    const roof=box(w+1.3,.24,d+1.1,0x51473e);
    roof.position.set(x,REST_AREA_BASE_Y+3.22,z);
    group.add(roof);

    // Simple shaded canopy facing the parking lot.
    const canopy=box(3.8,.18,d+.6,0x5d5145);
    canopy.position.set(x-w/2-1.55,REST_AREA_BASE_Y+2.65,z);
    group.add(canopy);

    for(const zz of [z-d*.32,z,z+d*.32]){
      const post=box(.12,2.55,.12,0x864936);
      post.position.set(x-w/2-3.25,REST_AREA_BASE_Y+1.28,zz);
      group.add(post);
    }

    const door=box(.08,2.05,1.02,0x332f2b);
    door.position.set(x-w/2-.055,REST_AREA_BASE_Y+1.05,z-d*.2);
    group.add(door);
  }

  function addPicnicTable(group,x,z) {
    const top=box(2.1,.12,.78,0x6b5439);
    top.position.set(x,REST_AREA_BASE_Y+.68,z);
    group.add(top);
    for(const sx of [-.72,.72]){
      const bench=box(.35,.10,1.95,0x6b5439);
      bench.position.set(x+sx,REST_AREA_BASE_Y+.43,z);
      group.add(bench);
    }
    for(const sx of [-.6,.6]){
      const leg=box(.12,.62,.12,0x4e4438);
      leg.position.set(x+sx,REST_AREA_BASE_Y+.31,z);
      group.add(leg);
    }
  }

  function addBoundaryPavementRibbon(group,sections,color=COLORS.asphalt2) {
    if(!sections || sections.length<2) return null;

    const vertices=[];
    const indices=[];

    for(let i=0;i<sections.length;i++){
      const s=sections[i];
      vertices.push(
        s.left.x,s.left.y,s.left.z,
        s.right.x,s.right.y,s.right.z
      );

      if(i<sections.length-1){
        const a=i*2,b=a+1,c=a+2,d=a+3;
        indices.push(a,c,b,b,c,d);
      }
    }

    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const pavement=new THREE.Mesh(
      geom,
      new THREE.MeshLambertMaterial({
        color,
        side:THREE.DoubleSide
      })
    );
    group.add(pavement);
    return pavement;
  }

  function centerlineRibbonSections(points,widthFn,yOffset=.035) {
    const sections=[];
    for(let i=0;i<points.length;i++){
      const p=points[i];
      const prev=points[Math.max(0,i-1)];
      const next=points[Math.min(points.length-1,i+1)];
      const dx=next.x-prev.x,dz=next.z-prev.z;
      const len=Math.hypot(dx,dz)||1;
      const nx=-dz/len,nz=dx/len;
      const width=widthFn(p,i);
      const half=width/2;
      const y=(p.y??p.height??SURFACE_ROAD_Y)+yOffset;

      sections.push({
        left:{x:p.x+nx*half,y,z:p.z+nz*half},
        right:{x:p.x-nx*half,y,z:p.z-nz*half}
      });
    }
    return sections;
  }

  function addRestMergeTail(group,kind) {
    const sign=kind==='entry' ? 1 : -1;
    const zA=sign*REST_MERGE_Z;
    const zB=sign*(REST_MERGE_Z+REST_MERGE_TAIL);
    const steps=30;
    const sections=[];

    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const z=THREE.MathUtils.lerp(zA,zB,t);
      const env=restMergeEnvelopeAtZ(kind,z);
      if(!env) continue;
      const y=env.y+.036;

      sections.push({
        left:{x:env.inner,y,z},
        right:{x:env.outer,y,z}
      });
    }

    addBoundaryPavementRibbon(group,sections,COLORS.asphalt2);

    // Only the outside line is painted on this auxiliary-style taper. The
    // freeway lane/shoulder markings already own the inside boundary.
    for(let i=0;i<sections.length-1;i++){
      const a=sections[i].right,b=sections[i+1].right;
      const wa=Math.abs(sections[i].right.x-sections[i].left.x);
      const wb=Math.abs(sections[i+1].right.x-sections[i+1].left.x);
      if(Math.max(wa,wb)<.55) continue;
      addRoadStripBetween(group,a.x,a.z,a.y+.055,b.x,b.z,b.y+.055,.10,COLORS.line);
    }
  }

  function addRestAreaCurvedRoad(group,kind) {
    const pts=restAreaPathSamples(kind,84);

    function widthAtPoint(p){
      const facilityT=kind==='entry'?p.t:(1-p.t);
      return THREE.MathUtils.lerp(REST_MERGE_ROAD_WIDTH,6.8,facilityT);
    }

    const sections=centerlineRibbonSections(pts,widthAtPoint,.036);
    addBoundaryPavementRibbon(group,sections,COLORS.asphalt2);

    // Paint roadway edges, but fade them out at the freeway throat. The merge
    // envelope takes over there, so continuing both lines creates short,
    // visually confusing white stubs.
    for(const side of ['left','right']){
      for(let i=0;i<sections.length-1;i++){
        const a=sections[i][side],b=sections[i+1][side];
        const t=(i+.5)/(sections.length-1);
        const freewayProgress=kind==='entry'?(1-t):t;
        if(freewayProgress>.88) continue;
        addRoadStripBetween(group,a.x,a.z,a.y+.055,b.x,b.z,b.y+.055,.10,COLORS.line);
      }
    }

    addRestMergeTail(group,kind);
  }

  function buildStartRestArea() {
    const g=new THREE.Group();
    g.userData.isRestArea=true;

    // Dry landscaped parcel beneath the facility.
    const parcel=box(54,.08,112,0xa99a77);
    parcel.position.set(48,REST_AREA_BASE_Y-.07,0);
    g.add(parcel);

    // Parking / circulation pavement.
    const lot=box(31,.10,84,COLORS.asphalt2);
    lot.position.set(42.5,REST_AREA_BASE_Y,0);
    g.add(lot);

    const apron=box(16,.10,56,COLORS.asphalt2);
    apron.position.set(60,REST_AREA_BASE_Y,0);
    g.add(apron);

    addRestAreaCurvedRoad(g,'entry');
    addRestAreaCurvedRoad(g,'exit');

    // Proper passenger-vehicle stalls: about 3.2 m wide by 6 m deep.
    // The player's pickup starts centered between the 22.4 / 25.6 lines.
    for(const bank of [[8.0,33.6],[-33.6,-8.0]]){
      for(let z=bank[0];z<=bank[1]+.01;z+=3.2){
        const stripe=box(6.0,.025,.075,COLORS.line);
        stripe.position.set(49.0,REST_AREA_BASE_Y+.07,z);
        g.add(stripe);
      }
    }
    const stallBack=box(.075,.025,51.2,COLORS.line);
    stallBack.position.set(52.0,REST_AREA_BASE_Y+.07,0);
    g.add(stallBack);

    const aisleEdge=box(.10,.025,80,COLORS.yellow);
    aisleEdge.position.set(35.2,REST_AREA_BASE_Y+.07,0);
    g.add(aisleEdge);

    // Grassy / picnic island.
    const grass=box(12,.12,29,0x687848);
    grass.position.set(58.5,REST_AREA_BASE_Y+.01,-5);
    g.add(grass);
    addPicnicTable(g,57,-9);
    addPicnicTable(g,61,2);

    // Two intentionally simple brown facility buildings.
    addRestAreaBuilding(g,63,16,7.8,13);
    addRestAreaBuilding(g,63,-19,6.5,9.5);

    for(const [x,z,s] of [
      [55,33,1.05],[63,34,.9],[55,-34,.95],
      [66,-35,1.05],[58,8,.75],[67,6,.8]
    ]) addRestAreaTree(g,x,z,s);

    // Low-poly trash cans / site furniture.
    for(const [x,z] of [[55,15],[55,-18],[61,-3]]){
      const can=new THREE.Mesh(
        new THREE.CylinderGeometry(.34,.38,.75,8),
        mat(0x77746c)
      );
      can.position.set(x,REST_AREA_BASE_Y+.38,z);
      g.add(can);
    }

    // Smaller roadside signs; none are planted in a travel path.
    const advanceX=laneWorldX(15.55,126);
    const advance=makeTextSprite(['REST AREA','1/4 MILE'],4.15,1.65,true);
    advance.position.set(advanceX,roadCenterYAtZ(126)+2.55,126);
    g.add(advance);
    const advancePost=box(.075,2.15,.075,0x777a72);
    advancePost.position.set(advanceX,roadCenterYAtZ(126)+1.08,126);
    g.add(advancePost);

    const entrySign=makeTextSprite(['REST AREA'],3.25,1.25,true);
    entrySign.position.set(20.0,REST_AREA_BASE_Y+2.2,66);
    g.add(entrySign);
    const entryPost=box(.075,1.8,.075,0x777a72);
    entryPost.position.set(20.0,REST_AREA_BASE_Y+.92,66);
    g.add(entryPost);

    const facilityShield=makeInterstateShieldSprite('9',1.15,1.38);
    facilityShield.position.set(56.0,REST_AREA_BASE_Y+2.15,32.0);
    g.add(facilityShield);
    const shieldPost=box(.075,1.75,.075,0x777a72);
    shieldPost.position.set(56.0,REST_AREA_BASE_Y+.90,32.03);
    g.add(shieldPost);

    const facilitySign=makeTextSprite(['REST AREA'],3.35,1.20,true);
    facilitySign.position.set(59.4,REST_AREA_BASE_Y+2.0,32.0);
    g.add(facilitySign);
    const facilityPost=box(.075,1.65,.075,0x777a72);
    facilityPost.position.set(59.4,REST_AREA_BASE_Y+.84,32.03);
    g.add(facilityPost);

    addFreewayEntranceAssembly(g,27.2,-34.0);

    world.add(g);
    return g;
  }


  function addRoadStripBetween(group, ax, az, ay, bx, bz, by, width, color) {
    const dx = bx-ax, dz = bz-az, dy = by-ay;
    const len = Math.hypot(dx,dz);
    const strip = box(width, .12, len + .8, color);
    strip.position.set((ax+bx)/2, (ay+by)/2, (az+bz)/2);
    strip.rotation.y = Math.atan2(dx, dz);
    strip.rotation.x = -Math.atan2(dy, len);
    group.add(strip);
    return strip;
  }


  function localSurfaceRoadY(group) {
    return group.userData.groundRoadYLocal ?? .06;
  }

  function addFlatSurfaceStripBetween(
    group,ax,az,bx,bz,width,color,
    y=SURFACE_ROAD_Y,extra=.04,height=.12
  ) {
    const dx=bx-ax,dz=bz-az;
    const len=Math.hypot(dx,dz);
    const strip=box(width,height,len+extra,color);
    strip.position.set((ax+bx)/2,y,(az+bz)/2);
    strip.rotation.y=Math.atan2(dx,dz);
    group.add(strip);
    return strip;
  }

  function addRuralRoadSegment(group, ax, az, bx, bz, width=6.9, color=COLORS.asphalt2) {
    const y=localSurfaceRoadY(group);
    const road=addFlatSurfaceStripBetween(group,ax,az,bx,bz,width,color,y,.04);

    const markY=y+.072;
    addFlatSurfaceStripBetween(group,ax,az,bx,bz,.10,COLORS.yellow,markY,.02,.016);

    const dx=bx-ax,dz=bz-az;
    const len=Math.hypot(dx,dz)||1;
    const nx=-dz/len,nz=dx/len;
    for(const side of [-1,1]){
      addFlatSurfaceStripBetween(
        group,
        ax+nx*3.25,az+nz*3.25,
        bx+nx*3.25,bz+nz*3.25,
        .08,COLORS.line,markY,.02,.016
      );
    }
    return road;
  }

  function addDirtRoadSegment(group, ax, az, bx, bz, width=5.0) {
    const y=localSurfaceRoadY(group);
    return addFlatSurfaceStripBetween(group,ax,az,bx,bz,width,COLORS.dirt,y,.04);
  }

  function addRuralIntersection(group, x, z, size=9.0) {
    const y=localSurfaceRoadY(group);
    const pad=box(size,.13,size,COLORS.asphalt2);
    pad.position.set(x,y+.01,z);
    group.add(pad);
  }

  function addRuralNetwork(group, index, info) {
    const side=info.branchSide;
    const branchX=side*info.branchOffset;
    const branchDir=info.loopBias<2?1:-1;

    // The overpass road itself is the primary east-west rural route.
    addRuralRoadSegment(group,-130,0,-320,0);
    addRuralRoadSegment(group, 130,0, 320,0);

    // One short local spur may leave the overpass road, but it never becomes
    // another long paved corridor running beside a county road.
    const spurLen=78;
    addRuralIntersection(group,branchX,0,9.5);
    addRuralRoadSegment(group,branchX,0,branchX,branchDir*spurLen);

    // Open-country paved routes are deliberately far apart.
    for(const s of [-1,1]){
      const outerX=s*(255+info.loopBias*8);

      addRuralIntersection(group,outerX,0,10.5);
      addRuralRoadSegment(group,s*130,0,outerX,0);
      addRuralRoadSegment(group,outerX,-235,outerX,235);

      // Sparse dirt farm tracks may branch from the remote county route.
      addDirtRoadSegment(
        group,
        outerX,185,
        s*(350+info.loopBias*12),260,
        5.1
      );
      addDirtRoadSegment(
        group,
        outerX,-185,
        s*(350+info.loopBias*12),-260,
        5.1
      );
    }

    // The short paved spur turns into a dirt access/turnaround rather than
    // creating another nearby parallel paved road.
    const dirtEndX=branchX+side*(42+info.loopBias*8);
    const dirtEndZ=branchDir*(145+info.loopBias*10);
    addDirtRoadSegment(
      group,
      branchX,branchDir*spurLen,
      dirtEndX,dirtEndZ,
      5.1
    );

    const bulb=new THREE.Mesh(
      new THREE.CylinderGeometry(7.0,7.0,.10,18),
      mat(COLORS.dirt)
    );
    bulb.position.set(dirtEndX,.05,dirtEndZ);
    group.add(bulb);

    if(info.accessible){
      const sign=makeTextSprite([info.roadName,'I-9'],3.6,1.35,true);
      sign.position.set(branchX+side*5.2,2.15,branchDir*7.0);
      registerOneSidedSignSprite(sign,0,branchDir);
      group.add(sign);
      const post=box(.075,1.75,.075,0x777a72);
      post.position.set(branchX+side*5.2,.90,branchDir*7.05);
      group.add(post);
    }
  }

  function addLaneEdgeBetween(group, ax, az, ay, bx, bz, by, lateral, color=COLORS.line) {
    const dx = bx-ax, dz = bz-az;
    const len = Math.hypot(dx,dz) || 1;
    const nx = -dz/len, nz = dx/len;
    return addRoadStripBetween(
      group,
      ax + nx*lateral, az + nz*lateral, ay+.08,
      bx + nx*lateral, bz + nz*lateral, by+.08,
      .10, color
    );
  }


  function addAuxiliaryLane(group,kind,roadColor) {
    const sign=kind==='off'?1:-1;
    const steps=64;
    const sections=[];

    for(let i=0;i<=steps;i++){
      const az=THREE.MathUtils.lerp(330,112,i/steps);
      const z=sign*az;
      const b=auxiliaryLaneEnvelopeAtLocalZ(kind,z);
      if(!b) continue;

      sections.push({
        left:{x:b.inner,y:.036,z},
        right:{x:b.outer,y:.036,z}
      });
    }

    addBoundaryPavementRibbon(group,sections,roadColor);

    // Solid outer edge follows the exact pavement boundary.
    for(let i=0;i<sections.length-1;i++){
      const a=sections[i].right,b=sections[i+1].right;
      addRoadStripBetween(group,a.x,a.z,.102,b.x,b.z,.102,.11,COLORS.line);
    }

    // Dashed divider along lane 3 only where a meaningful auxiliary lane exists.
    const dashFar=278;
    const dashNear=112;
    for(let az=dashFar;az>dashNear;az-=12.5){
      const az2=Math.max(dashNear,az-7.0);
      const z1=sign*az,z2=sign*az2;
      const b1=auxiliaryLaneEnvelopeAtLocalZ(kind,z1);
      const b2=auxiliaryLaneEnvelopeAtLocalZ(kind,z2);
      if(!b1||!b2) continue;
      if((b1.outer-b1.inner)<1.35 || (b2.outer-b2.inner)<1.35) continue;

      addRoadStripBetween(
        group,b1.inner,z1,.105,
        b2.inner,z2,.105,
        .115,COLORS.line
      );
    }
  }

  function addRampThroatOverlap(group,kind,roadColor) {
    // Deprecated in v0.6.5: continuous pavement boundary surface owns this zone.
    return;
  }

  function addFreewayRampBlend(group,kind,roadColor) {
    // Deprecated in v0.6.5: continuous pavement boundary surface owns this zone.
    return;
  }

  function addRampCrossroadMergeWedge(group,kind,roadColor) {
    const d=rampDefinition(kind);
    const endpoint=kind==='off'?d.p3:d.p0;
    const outerSign=endpoint.z>=0?1:-1;
    const rampOuterZ=endpoint.z+outerSign*RAMP_HALF_WIDTH;
    const roadOuterZ=outerSign*CROSSROAD_HALF_WIDTH;

    // If the ramp already lies completely within the crossroad envelope,
    // there is nothing extra to pave.
    if(outerSign>0 ? rampOuterZ<=roadOuterZ : rampOuterZ>=roadOuterZ) return;

    const startX=endpoint.x-1.0;
    const endX=endpoint.x+15.0;
    const y=crossroadHeightAtLocalX(endpoint.x)+.042;

    const sections=[];
    const steps=14;
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const s=t*t*(3-2*t);
      const x=THREE.MathUtils.lerp(startX,endX,t);

      // Inner boundary is the existing country-road edge. Only the external
      // sliver tapers away. This avoids a big rectangular slab over the road.
      const innerZ=roadOuterZ;
      const outerZ=THREE.MathUtils.lerp(rampOuterZ,roadOuterZ,s);

      const leftZ=outerSign>0?innerZ:outerZ;
      const rightZ=outerSign>0?outerZ:innerZ;

      sections.push({
        left:{x,y,z:leftZ},
        right:{x,y,z:rightZ}
      });
    }

    addBoundaryPavementRibbon(group,sections,roadColor);
  }

  function addCurvedRamp(group, kind, roadColor) {
    const pts=rampSamples(kind,120);
    const sections=centerlineRibbonSections(
      pts,
      p=>rampHalfWidthAt(kind,p.t)*2+.16,
      .035
    );

    addBoundaryPavementRibbon(group,sections,roadColor);

    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      const midT=(a.t+b.t)/2;
      const halfW=rampHalfWidthAt(kind,midT);
      const freewayProgress=kind==='off'?midT:(1-midT);

      if(freewayProgress>.10){
        addLaneEdgeBetween(group,a.x,a.z,a.height,b.x,b.z,b.height,Math.max(.90,halfW-.20));
        addLaneEdgeBetween(group,a.x,a.z,a.height,b.x,b.z,b.height,-Math.max(.90,halfW-.20));
      }

      const avgH=(a.height+b.height)/2;
      const dx=b.x-a.x,dz=b.z-a.z;
      const len=Math.hypot(dx,dz)+.32;

      if(avgH>.10 && avgH<3.65){
        const berm=box(halfW*2+2.5,Math.max(.16,avgH),len,COLORS.dirt);
        berm.position.set((a.x+b.x)/2,avgH/2-.11,(a.z+b.z)/2);
        berm.rotation.y=Math.atan2(dx,dz);
        group.add(berm);
      }

      if(avgH>=3.45 && i%10===0){
        const support=box(.62,avgH,.62,COLORS.concrete);
        support.position.set((a.x+b.x)/2,avgH/2-.08,(a.z+b.z)/2);
        group.add(support);
      }
    }

    addAuxiliaryLane(group,kind,roadColor);

    // Shared throat envelope: rendering and drivable-surface ownership use
    // exactly the same inner/outer boundaries.
    const sign=kind==='off'?1:-1;
    const throatSections=[];
    for(let i=0;i<=18;i++){
      const az=THREE.MathUtils.lerp(114,98,i/18);
      const z=sign*az;
      const b=rampThroatEnvelopeAtLocalZ(kind,z);
      if(!b) continue;
      throatSections.push({
        left:{x:b.inner,y:.040,z},
        right:{x:b.outer,y:.040,z}
      });
    }
    addBoundaryPavementRibbon(group,throatSections,roadColor);

    // The crossroad itself already provides pavement under most of the ramp
    // mouth. Add only the external sliver that lies beyond its edge, tapering
    // that sliver smoothly to zero.
    addRampCrossroadMergeWedge(group,kind,roadColor);
  }

  function makeExitArrowSprite(width=2.75,height=1.20) {
    const c=document.createElement('canvas');
    c.width=512; c.height=220;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1a6138';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);

    ctx.fillStyle='#ffffff';
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    ctx.font='bold 76px Arial';
    ctx.fillText('EXIT',48,105);

    // Arrow points toward the upper-right corner, matching the shoulder ramp.
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=22;
    ctx.lineCap='square';
    ctx.beginPath();
    ctx.moveTo(310,154);
    ctx.lineTo(420,52);
    ctx.stroke();

    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.moveTo(420,52);
    ctx.lineTo(354,62);
    ctx.lineTo(410,118);
    ctx.closePath();
    ctx.fill();

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(width,height,1);
    return spr;
  }

  function addPavementArrow(group,x,z,direction=1) {
    // Flat white arrow built from strips so it stays cheap and texture-free.
    const y=.108;
    addRoadStripBetween(group,x,z+direction*2.4,y,x,z-direction*2.1,y,.28,COLORS.line);
    addRoadStripBetween(group,x,z-direction*2.05,y,x-.75,z-direction*.95,y,.24,COLORS.line);
    addRoadStripBetween(group,x,z-direction*2.05,y,x+.75,z-direction*.95,y,.24,COLORS.line);
  }

  function makeLaneCueSprite(lines,width=3.15,height=1.10,green=true) {
    return makeTextSprite(lines,width,height,green);
  }

  function addAuxiliaryLaneGuidance(group) {
    const lane3Outer=laneCenters[2]+LANE_W/2;
    const auxCenter=(lane3Outer+17.55)/2;

    // Pavement arrows live inside the auxiliary lane.
    addPavementArrow(group,auxCenter,250,1);
    addPavementArrow(group,auxCenter,198,1);
    addPavementArrow(group,auxCenter,-188,-1);
    addPavementArrow(group,auxCenter,-242,-1);

    // Roadside signs are outside the 17.55 m pavement edge.
    const exitOnly=makeLaneCueSprite(['EXIT','ONLY'],2.65,1.55,true);
    exitOnly.position.set(19.7,3.15,164);
    registerOneSidedSignSprite(exitOnly,0,1);
    group.add(exitOnly);
    const ep=box(.075,2.55,.075,0x777a72);
    ep.position.set(19.7,1.29,164);
    group.add(ep);

    const merge=makeLaneCueSprite(['MERGE'],2.55,.95,true);
    merge.position.set(19.7,2.95,-164);
    registerOneSidedSignSprite(merge,0,1);
    group.add(merge);
    const mp=box(.075,2.35,.075,0x777a72);
    mp.position.set(19.7,1.19,-164);
    group.add(mp);
  }

  function addGoreStripe(group,ax,az,bx,bz,width=.18) {
    addRoadStripBetween(group,ax,az,.105,bx,bz,.105,width,COLORS.line);
  }

  function addPaintedGore(group,kind) {
    const sign=kind==='off'?1:-1;
    const zTip=sign*112;
    const zWide=sign*86;
    const lane3Outer=laneCenters[2]+LANE_W/2;

    // The gore is painted only in the neutral area between lane 3 and the
    // diverging ramp envelope. It never paints across live ramp pavement.
    const tip=rampThroatEnvelopeAtLocalZ(kind,zTip);
    const wide=rampThroatEnvelopeAtLocalZ(kind,sign*98);
    if(!tip||!wide) return;

    const innerTip=lane3Outer+.12;
    const outerTip=Math.max(innerTip+.45,tip.inner-.16);
    const innerWide=lane3Outer+.18;
    const outerWide=Math.max(innerWide+.70,wide.inner-.18);

    addGoreStripe(group,innerTip,zTip,innerWide,zWide,.16);
    addGoreStripe(group,outerTip,zTip,outerWide,zWide,.16);

    const count=6;
    for(let i=1;i<=count;i++){
      const t=i/(count+1);
      const z=THREE.MathUtils.lerp(zTip,zWide,t);
      const left=THREE.MathUtils.lerp(innerTip,innerWide,t);
      const right=THREE.MathUtils.lerp(outerTip,outerWide,t);
      if(right-left<.35) continue;
      addGoreStripe(
        group,
        left+.12,z+sign*.45,
        right-.12,z-sign*.45,
        .12
      );
    }
  }

  function addExitGoreSign(group) {
    const x=19.8, z=109.0;
    const sign=makeExitArrowSprite(2.8,1.2);
    sign.position.set(x,2.75,z);
    registerOneSidedSignSprite(sign,0,1);
    group.add(sign);

    const post=box(.075,2.15,.075,0x777a72);
    post.position.set(x,1.10,z+.05);
    group.add(post);
  }

  function makeFixedServiceSign(lines,width=5.6,height=2.25,bg='#245c9a') {
    const arr=Array.isArray(lines)?lines:[lines];
    const key=`${arr.map(v=>String(v).toUpperCase()).join('||')}|${width}|${height}|${bg}`;
    let asset=fixedServiceSignCache.get(key);

    if(!asset){
      const c=document.createElement('canvas');
      c.width=900;c.height=360;
      const ctx=c.getContext('2d');
      ctx.fillStyle=bg;
      ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle='#ffffff';
      ctx.lineWidth=12;
      ctx.strokeRect(8,8,c.width-16,c.height-16);

      ctx.fillStyle='#ffffff';
      ctx.textAlign='center';
      ctx.textBaseline='middle';

      if(arr.length===1){
        ctx.font='bold 72px Arial';
        ctx.fillText(String(arr[0]).toUpperCase(),450,180);
      }else{
        ctx.font='bold 58px Arial';
        const gap=90;
        const start=180-(arr.length-1)*gap/2;
        arr.forEach((line,i)=>{
          ctx.fillText(String(line).toUpperCase(),450,start+i*gap);
        });
      }

      const tex=new THREE.CanvasTexture(c);
      tex.minFilter=THREE.LinearFilter;
      asset={
        geometry:new THREE.PlaneGeometry(width,height),
        material:new THREE.MeshBasicMaterial({
          map:tex,
          side:THREE.FrontSide,
          transparent:false
        })
      };
      fixedServiceSignCache.set(key,asset);
    }

    const mesh=new THREE.Mesh(asset.geometry,asset.material);
    mesh.userData.sharedSignAsset=true;
    return mesh;
  }

  function addFixedServiceBoard(group,x,z,lines,width=5.6,height=2.25,signY=3.1,rotationY=0,bg='#245c9a') {
    const sign=makeFixedServiceSign(lines,width,height,bg);
    sign.position.set(x,signY,z);
    sign.rotation.y=rotationY;
    group.add(sign);

    const postSpread=Math.max(1.15,width*.28);
    for(const off of [-postSpread,postSpread]){
      const px=x+Math.cos(rotationY)*off;
      const pz=z-Math.sin(rotationY)*off;
      const post=box(.085,2.45,.085,0x777a72);
      post.position.set(px,1.24,pz);
      group.add(post);
    }
  }

  function addTruckStopFreewayServiceAdvance(group,index) {
    // One dedicated services board about three freeway chunks before the
    // Coyote Junction interchange: roughly 0.2–0.25 mi of advance notice.
    if(index!==TRUCK_STOP_CROSSING_INDEX-3) return;

    addFixedServiceBoard(
      group,
      20.4,
      -10,
      ['EXIT '+crossingInfo(TRUCK_STOP_CROSSING_INDEX).exitNumber,'GAS · FOOD · LODGING'],
      6.2,
      2.45,
      3.15,
      0,
      '#245c9a'
    );
  }

  function addTruckStopCrossroadGuidance(group,index) {
    if(index!==TRUCK_STOP_CROSSING_INDEX) return;

    // After leaving the ramp, the plaza is east / +X along the overpass road.
    // Fixed planes face traffic moving along the crossroad; they do not rotate
    // toward the camera.
    addFixedServiceBoard(
      group,
      68,
      7.3,
      ['COYOTE JUNCTION','TRUCK PLAZA →'],
      5.6,
      2.15,
      3.0,
      Math.PI/2,
      '#1a6138'
    );

    addFixedServiceBoard(
      group,
      126,
      7.3,
      ['GAS · FOOD · LODGING','TRUCK PARKING →'],
      5.8,
      2.15,
      3.0,
      Math.PI/2,
      '#245c9a'
    );

    // Reassurance at the final approach to the west plaza entrance.
    addFixedServiceBoard(
      group,
      164,
      7.3,
      ['TRUCK PLAZA','ENTRANCE →'],
      4.8,
      1.9,
      2.85,
      Math.PI/2,
      '#1a6138'
    );
  }

  function addInterchangeSign(group, x, z, lines, scaleX=4.35, scaleY=1.85, signY=2.75) {
    const sign = makeTextSprite(lines, scaleX, scaleY, true);
    sign.position.set(x, signY, z);
    registerOneSidedSignSprite(sign,0,1);
    group.add(sign);

    for (const px of [x-scaleX*.27, x+scaleX*.27]) {
      const post = box(.075, 2.30, .075, 0x777a72);
      post.position.set(px, 1.17, z+.06);
      group.add(post);
    }
  }

  function addShoulderExitFlare(group, z, direction=1) {
    // Deprecated in v0.6.6.1. Unified auxiliary/ramp pavement owns this area.
    return;
  }

  function addGuardrailSpan(group,x0,x1,z,deckY) {
    if(x1-x0<.8) return;
    const len=x1-x0;
    const lower=box(len,.14,.11,COLORS.guard);
    lower.position.set((x0+x1)/2,deckY+.50,z);
    group.add(lower);

    const upper=box(len,.10,.10,COLORS.guard);
    upper.position.set((x0+x1)/2,deckY+.90,z);
    group.add(upper);

    const xs=[];
    for(let x=x0+1.5;x<=x1-1.0;x+=5.5) xs.push(x);
    if(xs.length){
      const key='.10|.95|.10';
      if(!boxGeoCache.has(key)) boxGeoCache.set(key,new THREE.BoxGeometry(.10,.95,.10));
      const posts=new THREE.InstancedMesh(
        boxGeoCache.get(key),
        mat(COLORS.guard),
        xs.length
      );
      const matrix=new THREE.Matrix4();
      xs.forEach((x,i)=>{
        matrix.makeTranslation(x,deckY+.45,z);
        posts.setMatrixAt(i,matrix);
      });
      posts.instanceMatrix.needsUpdate=true;
      group.add(posts);
    }
  }

  function addBridgeGuardrails(group,halfSpan,halfWidth,deckY,accessible=false) {
    for(const side of [-1,1]){
      const z=side*(halfWidth-.30);

      if(accessible){
        // Both ramps meet the east side of this bridge. Leave a large, obvious
        // opening instead of running a rail through the entrance/exit mouth.
        addGuardrailSpan(group,-halfSpan,14.0,z,deckY);
      }else{
        addGuardrailSpan(group,-halfSpan,halfSpan,z,deckY);
      }
    }
  }

  function addApproachGeometry(group,side,roadColor,accessible=false) {
    const baseY=group.userData.crossingBaseY ?? 0;
    const groundLocal=SURFACE_ROAD_Y-baseY;
    const gradeStartLocal=0;

    // Dedicated 26 m tie-in: exact flat surface-road datum at x=130, then a
    // very gentle transition to the interchange's structural base at x=104.
    const tieSteps=10;
    let prevX=side*130;
    let prevY=groundLocal;

    for(let i=1;i<=tieSteps;i++){
      const t=i/tieSteps;
      const s=t*t*t*(t*(t*6-15)+10);
      const x=side*THREE.MathUtils.lerp(130,CROSSROAD_GRADE_END,t);
      const y=groundLocal;

      addRoadStripBetween(group,prevX,0,prevY,x,0,y,CROSSROAD_HALF_WIDTH*2,roadColor);

      const edgeZ=CROSSROAD_HALF_WIDTH-.44;
      for(const z of [-edgeZ,edgeZ]){
        addRoadStripBetween(group,prevX,z,prevY+.072,x,z,y+.072,.08,COLORS.line);
      }
      prevX=x;prevY=y;
    }

    // Main overpass climb.
    const steps=40;
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      const x=side*THREE.MathUtils.lerp(CROSSROAD_GRADE_END,CROSSROAD_BRIDGE_HALF_SPAN,t);
      const y=smoothRampHeight(t);

      addRoadStripBetween(group,prevX,0,prevY,x,0,y,CROSSROAD_HALF_WIDTH*2,roadColor);

      const edgeZ=CROSSROAD_HALF_WIDTH-.44;
      for(const z of [-edgeZ,edgeZ]){
        addRoadStripBetween(group,prevX,z,prevY+.072,x,z,y+.072,.08,COLORS.line);
      }

      const guardrailClearForRamp=accessible&&side===1&&Math.abs(x)<58;
      if(t>.36&&!guardrailClearForRamp){
        for(const z of [-(CROSSROAD_HALF_WIDTH-.30),CROSSROAD_HALF_WIDTH-.30]){
          const dx=x-prevX;
          const rail=box(.10,.13,Math.abs(dx)+.18,COLORS.guard);
          rail.position.set((prevX+x)/2,(prevY+y)/2+.62,z);
          rail.rotation.y=Math.PI/2;
          rail.rotation.z=-Math.atan2(y-prevY,Math.abs(dx)||1);
          group.add(rail);

          if(i%3===0){
            const post=box(.10,.86,.10,COLORS.guard);
            post.position.set(x,y+.40,z);
            group.add(post);
          }
        }
      }

      if(i%2===0){
        const avgY=(prevY+y)/2;
        const fill=box(Math.abs(x-prevX)+.55,Math.max(.16,avgY-groundLocal+.10),CROSSROAD_HALF_WIDTH*2+2.2,COLORS.dirt);
        fill.position.set((prevX+x)/2,(groundLocal+avgY)/2-.08,0);
        group.add(fill);
      }

      prevX=x;prevY=y;
    }
  }

  function makeEntranceGuideSprite(label='I-9 NORTH',arrowDir='RIGHT',width=3.2,height=1.10) {
    const c=document.createElement('canvas');
    c.width=640;c.height=220;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1a6138';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 50px Arial';
    ctx.fillText(label,320,72);

    const cy=157;
    const right=arrowDir==='RIGHT';
    ctx.lineWidth=20;
    ctx.beginPath();
    if(right){
      ctx.moveTo(220,cy);ctx.lineTo(408,cy);ctx.stroke();
      ctx.beginPath();ctx.moveTo(408,cy);ctx.lineTo(354,cy-38);ctx.lineTo(354,cy+38);ctx.closePath();ctx.fill();
    }else{
      ctx.moveTo(420,cy);ctx.lineTo(232,cy);ctx.stroke();
      ctx.beginPath();ctx.moveTo(232,cy);ctx.lineTo(286,cy-38);ctx.lineTo(286,cy+38);ctx.closePath();ctx.fill();
    }

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,transparent:true}));
    spr.scale.set(width,height,1);
    return spr;
  }

  function makeFreewayEntranceSprite(direction='NORTH') {
    const c=document.createElement('canvas');
    c.width=560;c.height=260;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#f4f0dd';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#202522';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);
    ctx.fillStyle='#202522';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 42px Arial';
    ctx.fillText('FREEWAY ENTRANCE',280,68);
    ctx.font='bold 60px Arial';
    ctx.fillText('I-9',280,142);
    ctx.font='bold 42px Arial';
    ctx.fillText(direction,280,210);
    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(3.4,1.58,1);
    return spr;
  }

  function addRampMouthEntranceSigns(group) {
    // Confirmation signs sit on the country-road shoulder immediately before
    // committing to either freeway entrance.
    const north=makeFreewayEntranceSprite('NORTH');
    north.position.set(48.0,3.10,8.6);
    group.add(north);
    const np=box(.075,2.45,.075,0x777a72);
    np.position.set(48.0,1.24,8.65);
    group.add(np);

    const south=makeFreewayEntranceSprite('SOUTH');
    south.position.set(48.0,3.10,-8.6);
    group.add(south);
    const sp=box(.075,2.45,.075,0x777a72);
    sp.position.set(48.0,1.24,-8.55);
    group.add(sp);
  }

  function makeRoadDirectionSprite(direction='NORTH',width=2.05,height=.70) {
    const c=document.createElement('canvas');
    c.width=512;c.height=170;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1a6138';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 58px Arial';
    ctx.fillText(direction,256,86);
    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,transparent:true}));
    spr.scale.set(width,height,1);
    return spr;
  }

  function addInterchangeGuidance(group,info) {
    if(!info.accessible) return;

    // Guidance for drivers arriving on the country road before the bridge.
    const approaches=[
      {x:-72,z:-6.9,north:'RIGHT',south:'LEFT'},
      {x: 72,z: 6.9,north:'LEFT', south:'RIGHT'}
    ];

    for(const p of approaches){
      const n=makeEntranceGuideSprite('I-9 NORTH',p.north,3.15,1.05);
      n.position.set(p.x,3.10,p.z); group.add(n);
      const s=makeEntranceGuideSprite('I-9 SOUTH',p.south,3.15,1.05);
      s.position.set(p.x,1.88,p.z); group.add(s);

      const post1=box(.075,2.5,.075,0x777a72);
      post1.position.set(p.x,1.27,p.z+.05); group.add(post1);
      const post2=box(.075,1.45,.075,0x777a72);
      post2.position.set(p.x,.73,p.z+.05); group.add(post2);
    }

    // Mark the entrances themselves.
    const north=makeRoadDirectionSprite('NORTH');
    north.position.set(35.5,2.45,8.8); group.add(north);
    const np=box(.075,1.9,.075,0x777a72);
    np.position.set(35.5,.98,8.85); group.add(np);

    const south=makeRoadDirectionSprite('SOUTH');
    south.position.set(35.5,2.45,-8.8); group.add(south);
    const sp=box(.075,1.9,.075,0x777a72);
    sp.position.set(35.5,.98,-8.75); group.add(sp);
  }

  function addCrossingGeometry(group, index) {
    const info = crossingInfo(index);
    if (!info) return;

    const deckY=OVERPASS_Y;
    const roadColor=COLORS.asphalt2;
    const bridgeLen=CROSSROAD_BRIDGE_HALF_SPAN*2;
    const crossingBaseY=roadCenterYAtZ(-index*SEG_LEN);

    group.userData.crossingBaseY=crossingBaseY;
    group.userData.groundRoadYLocal=SURFACE_ROAD_Y-crossingBaseY;

    // Larger, wider overpass deck with usable shoulders.
    const bridge=box(bridgeLen,.20,CROSSROAD_HALF_WIDTH*2,roadColor);
    bridge.position.set(0,deckY,0);
    group.add(bridge);

    addRoadStripBetween(group,-CROSSROAD_BRIDGE_HALF_SPAN,0,deckY+.11,
                              CROSSROAD_BRIDGE_HALF_SPAN,0,deckY+.11,
                              .10,COLORS.yellow);

    for(const z of [-(CROSSROAD_HALF_WIDTH-.44),CROSSROAD_HALF_WIDTH-.44]){
      const edge=box(bridgeLen,.025,.08,COLORS.line);
      edge.position.set(0,deckY+.12,z);
      group.add(edge);
    }

    // Approximately 68 m of approach per side, sampled much more finely.
    addApproachGeometry(group,-1,roadColor,info.accessible);
    addApproachGeometry(group, 1,roadColor,info.accessible);
    addBridgeGuardrails(group,CROSSROAD_BRIDGE_HALF_SPAN,CROSSROAD_HALF_WIDTH,deckY,info.accessible);

    for(const x of [-18,18]){
      for(const z of [-(CROSSROAD_HALF_WIDTH-.78),CROSSROAD_HALF_WIDTH-.78]){
        const pier=box(.76,deckY,.76,COLORS.concrete);
        pier.position.set(x,deckY/2-.02,z);
        group.add(pier);
      }
    }

    for(const z of [-CROSSROAD_HALF_WIDTH,CROSSROAD_HALF_WIDTH]){
      const beam=box(bridgeLen,.40,.18,COLORS.concrete);
      beam.position.set(0,deckY-.20,z);
      group.add(beam);
    }

    addRuralNetwork(group,index,info);

    if(info.accessible){
      addCurvedRamp(group,'off',roadColor);
      addCurvedRamp(group,'on',roadColor);
      addPaintedGore(group,'off');
      addPaintedGore(group,'on');
      addAuxiliaryLaneGuidance(group);
      addExitGoreSign(group);

      addInterchangeSign(group,41.0,6.4,[info.roadName],4.0,1.45,2.45);
      addInterchangeGuidance(group,info);
      addRampMouthEntranceSigns(group);
      addTruckStopCrossroadGuidance(group,index);
    }

    group.userData.crossing=info;
  }

  function addAdvanceExitSignIfNeeded(group, index) {
    // At normal freeway speed, two 120 m chunks is roughly ten seconds of
    // warning. Keep the advance sign separate from the gore EXIT arrow sign.
    const upcoming = crossingInfo(index + 2);
    if (!upcoming || !upcoming.accessible) return;

    const lines=upcoming.index===TRUCK_STOP_CROSSING_INDEX
      ? [upcoming.roadName,'TRUCK PLAZA · EXIT AHEAD']
      : [upcoming.roadName,'EXIT AHEAD'];

    addInterchangeSign(
      group,
      19.65,
      -8,
      lines,
      upcoming.index===TRUCK_STOP_CROSSING_INDEX?5.45:4.65,
      1.85,
      2.85
    );
  }
  const segments = [];
  const traffic = [];
  const truckStopTraffic = [];
  const localRoadTraffic = [];

  // -------------------------------------------------------------------
  // TRUE 2D PROCEDURAL WORLD
  //
  // I-9 still uses longitudinal freeway chunks, but the countryside no
  // longer does. Terrain is generated on an X/Z tile grid around the player.
  // Driving east, west, north, south, or diagonally therefore creates new
  // world tiles in the direction of travel and retires distant ones.
  // -------------------------------------------------------------------
  const WORLD_TILE_SIZE = 180;

  // World tiles are centered on tx*WORLD_TILE_SIZE / tz*WORLD_TILE_SIZE and
  // therefore span +/- half a tile. Using floor(x/size) assigns the negative
  // half of every centered tile to its neighbor and can cull valid road pieces.
  function worldTileIndexForCoord(v) {
    return Math.floor((v + WORLD_TILE_SIZE/2) / WORLD_TILE_SIZE);
  }

  const worldTiles = new Map();

  // Deterministic tile-generation caches. These same calculations are used by
  // rendering, collision, the map, settlements, roadside development, and QA.
  // Reusing them removes a large amount of repeated CPU work while driving.
  const proceduralRoadCache=new Map();
  const renderableRoadCache=new Map();
  const neighborRoadCache=new Map();
  const junctionCache=new Map();
  const consolidatedJunctionCache=new Map();
  const roadsideSiteCache=new Map();
  const TILE_CACHE_LIMIT=2600;

  function tileCacheKey(tx,tz){ return `${tx},${tz}`; }

  function boundedTileCacheSet(cache,key,value,limit=TILE_CACHE_LIMIT){
    if(cache.has(key)) cache.delete(key);
    cache.set(key,value);
    while(cache.size>limit){
      cache.delete(cache.keys().next().value);
    }
    return value;
  }


  function hash2D(ix, iz, salt=0) {
    // Stable integer-coordinate hash -> [0,1). No Math.random(), so a tile
    // regenerates identically if the player leaves and comes back.
    let n = Math.imul(ix + salt*1013, 374761393) ^
            Math.imul(iz - salt*1619, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }

  function terrainYAt(x,z) {
    // The countryside is intentionally flat. Freeway/bridge/ramp structures
    // may have engineered grades, but open terrain and surface roads do not.
    return WORLD_FLAT_GROUND_Y;
  }

  function positiveTileMod(n,m){ return ((n%m)+m)%m; }

  function worldRoadRowBaseZ(row) {
    return row*WORLD_TILE_SIZE + (hash2D(0,row,101)-.5)*58;
  }

  function worldRoadColBaseX(col) {
    return col*WORLD_TILE_SIZE + (hash2D(col,0,102)-.5)*58;
  }

  function countyEWPoint(row,x) {
    const base=worldRoadRowBaseZ(row);
    return {
      x,
      z:base +
        Math.sin(x/285 + row*1.71)*13 +
        Math.sin(x/690 + row*.43)*6
    };
  }

  function countyNSPoint(col,z) {
    const base=worldRoadColBaseX(col);
    return {
      x:base +
        Math.sin(z/310 + col*1.37)*12 +
        Math.sin(z/760 + col*.61)*5,
      z
    };
  }

  function queueRoadMarking(group,ax,az,bx,bz,width,color,y=ROAD_MARKING_Y,height=.016) {
    const batch=group.userData?.roadMarkingBatch;
    if(!batch) return false;

    const key=color===COLORS.yellow?'yellow':'white';
    batch[key].push({ax,az,bx,bz,width,y,height});
    return true;
  }

  function flushRoadMarkingBatch(group) {
    const batch=group.userData?.roadMarkingBatch;
    if(!batch) return;

    const dummy=new THREE.Object3D();
    for(const [key,color] of [['yellow',COLORS.yellow],['white',COLORS.line]]){
      const items=batch[key];
      if(!items.length) continue;

      const mesh=new THREE.InstancedMesh(
        instancedUnitBoxGeo,
        mat(color),
        items.length
      );
      mesh.userData.sharedGeometry=true;

      items.forEach((s,i)=>{
        const dx=s.bx-s.ax,dz=s.bz-s.az;
        const len=Math.hypot(dx,dz);
        dummy.position.set((s.ax+s.bx)/2,s.y,(s.az+s.bz)/2);
        dummy.rotation.set(0,Math.atan2(dx,dz),0);
        dummy.scale.set(s.width,s.height,len+.02);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      group.add(mesh);
    }

    delete group.userData.roadMarkingBatch;
  }

  function addWorldPavedRoadSegment(group,ax,az,bx,bz,width=6.6,type='county',routeTier=null) {
    const dx=bx-ax,dz=bz-az;
    const rawLen=Math.hypot(dx,dz);
    if(rawLen<1.0) return;

    addFlatSurfaceStripBetween(group,ax,az,bx,bz,width,COLORS.asphalt2,SURFACE_ROAD_Y,.04);

    const len=rawLen;
    if(len<7.5) return;

    // Route class must be resolved BEFORE it is used to choose line treatment.
    // v0.5.8 declared this after the centerline draw, triggering the TDZ
    // ReferenceError reported at startup.
    const cls=roadClassForType(type,routeTier);

    const centerWidth=cls==='major-county'||cls==='feeder'? .12 : .10;
    if(!queueRoadMarking(group,ax,az,bx,bz,centerWidth,COLORS.yellow,ROAD_MARKING_Y,.016)){
      addFlatSurfaceStripBetween(
        group,ax,az,bx,bz,
        centerWidth,
        COLORS.yellow,ROAD_MARKING_Y,.02,.016
      );
    }

    if(cls==='local'||cls==='settlement-local'||cls==='truck-stop-local'||cls==='connector'||cls==='driveway') return;

    const nx=-dz/len,nz=dx/len;
    const edge=width/2-.32;
    for(const side of [-1,1]){
      const ex0=ax+nx*edge,ez0=az+nz*edge;
      const ex1=bx+nx*edge,ez1=bz+nz*edge;
      if(!queueRoadMarking(group,ex0,ez0,ex1,ez1,.075,COLORS.line,ROAD_MARKING_Y,.016)){
        addFlatSurfaceStripBetween(
          group,
          ex0,ez0,
          ex1,ez1,
          .075,COLORS.line,ROAD_MARKING_Y,.02,.016
        );
      }
    }
  }

  function addWorldDirtRoadSegment(group,ax,az,bx,bz,width=5.0) {
    if(Math.hypot(bx-ax,bz-az)<1.0) return;
    addFlatSurfaceStripBetween(group,ax,az,bx,bz,width,COLORS.dirt,SURFACE_ROAD_Y,.04);
  }

  function makeInterstateDirectionSprite(direction='LEFT', width=3.25, height=1.18) {
    const c=document.createElement('canvas');
    c.width=640; c.height=230;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1a6138';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=10;
    ctx.strokeRect(6,6,c.width-12,c.height-12);

    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 54px Arial';
    ctx.fillText('INTERSTATE 9',320,76);

    const right=direction==='RIGHT';
    const cy=157;
    ctx.strokeStyle='#ffffff';
    ctx.fillStyle='#ffffff';
    ctx.lineWidth=20;
    ctx.beginPath();
    if(right){
      ctx.moveTo(210,cy); ctx.lineTo(402,cy); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(402,cy); ctx.lineTo(352,cy-38); ctx.lineTo(352,cy+38); ctx.closePath(); ctx.fill();
    }else{
      ctx.moveTo(430,cy); ctx.lineTo(238,cy); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(238,cy); ctx.lineTo(288,cy-38); ctx.lineTo(288,cy+38); ctx.closePath(); ctx.fill();
    }

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(width,height,1);
    return spr;
  }

  function addInterstateDirectionSign(group,x,z,roadDirX,roadDirZ) {
    const freewayX=roadCenterXAtZ(z);
    const direction=x>freewayX ? 'LEFT' : 'RIGHT';

    const len=Math.hypot(roadDirX,roadDirZ)||1;
    const nx=-roadDirZ/len, nz=roadDirX/len;
    const side=(x>freewayX)?1:-1;
    const sx=x+nx*4.8*side;
    const sz=z+nz*4.8*side;
    const y=terrainYAt(sx,sz);

    const sign=makeInterstateDirectionSprite(direction,3.25,1.18);
    sign.position.set(sx,y+2.55,sz);
    const outwardX=sx-freewayX;
    const outwardZ=sz-z;
    const outwardLen=Math.hypot(outwardX,outwardZ)||1;
    registerOneSidedSignSprite(sign,outwardX/outwardLen,outwardZ/outwardLen);
    group.add(sign);

    const post=box(.075,2.05,.075,0x777a72);
    post.position.set(sx,y+1.04,sz+.03);
    group.add(post);
  }

  function feederRoadCandidatesForTile(tx,tz) {
    const cz=tz*WORLD_TILE_SIZE;
    const candidates=[];
    for(const idx of nearbyCrossingIndices(cz)){
      const info=crossingInfo(idx);
      if(info && info.accessible) candidates.push(info);
    }
    return candidates;
  }

  function feederLineForCrossing(info) {
    const cz=-info.index*SEG_LEN;
    const cx=roadCenterXAtZ(cz);
    const h=roadHeadingAtZ(cz);
    const ux=Math.cos(h);
    const uz=-Math.sin(h);
    return {cx,cz,ux,uz,nx:-uz,nz:ux,info};
  }

  function feederPoint(line,along) {
    // Remain exactly aligned with the interchange close to I-9, then acquire
    // broad countryside bends farther out. The curve is deterministic.
    const absA=Math.abs(along);
    const blend=THREE.MathUtils.smoothstep(absA,300,620);
    const seq=line.info?.seq||0;
    const wiggle=(
      Math.sin(along/330 + seq*.83)*13 +
      Math.sin(along/810 + seq*.29)*5
    )*blend;
    return {
      x:line.cx + along*line.ux + wiggle*line.nx,
      z:line.cz + along*line.uz + wiggle*line.nz
    };
  }

  function distanceToInfiniteLine(px,pz,line) {
    const dx=px-line.cx, dz=pz-line.cz;
    const along=dx*line.ux + dz*line.uz;
    const qx=line.cx + along*line.ux;
    const qz=line.cz + along*line.uz;
    return {distance:Math.hypot(px-qx,pz-qz),along,qx,qz};
  }

  function countyRouteTier(axis,id) {
    // Route tier is keyed only to the global row/column identifier, so a road
    // stays major or ordinary for its entire procedural length.
    const r=hash2D(id,axis==='ew'?73:89,405);
    return r<.28 ? 'major' : 'county';
  }

  function countyRouteWidth(axis,id) {
    return countyRouteTier(axis,id)==='major' ? 7.2 : 6.25;
  }

  function deterministicRoadName(axis,id) {
    const a=angloA[Math.floor(hash2D(id,axis==='ew'?17:29,401)*angloA.length)];
    const b=angloB[Math.floor(hash2D(id,axis==='ew'?31:43,402)*angloB.length)];
    const suffix=axis==='ew'
      ? (hash2D(id,11,403)<.52?'Road':'Avenue')
      : (hash2D(id,23,404)<.52?'Road':'Drive');
    return `${a} ${b} ${suffix}`;
  }

  function localBranchRoadName(tx,tz,salt=0) {
    const a=angloA[Math.floor(hash2D(tx,tz,430+salt)*angloA.length)];
    const b=angloB[Math.floor(hash2D(tx,tz,460+salt)*angloB.length)];
    return `${a} ${b} Lane`;
  }

  function roadDisplayName(s) {
    if(s?.roadName) return s.roadName;
    if(s?.type==='interstate-feeder' && s?.crossing?.roadName) return s.crossing.roadName;
    return null;
  }

  function roadClassForType(type,routeTier=null) {
    if(type==='interstate-feeder') return 'feeder';
    if(type==='county-east-west'||type==='county-north-south'){
      return routeTier==='major' ? 'major-county' : 'county';
    }
    if(type==='county-connector') return routeTier==='major'?'major-connector':'connector';
    if(type==='county-t-junction'){
      if(routeTier==='truck-stop') return 'truck-stop-local';
      return routeTier==='settlement'?'settlement-local':'local';
    }
    if(type==='dirt-spur') return 'dirt';
    if(type==='driveway') return 'driveway';
    return 'local';
  }

  function roadWidthForType(type) {
    const cls=roadClassForType(type);
    if(cls==='feeder') return 6.8;
    if(cls==='major-county') return 7.2;
    if(cls==='county') return 6.25;
    if(cls==='major-connector') return 6.4;
    if(cls==='connector') return 6.0;
    if(cls==='truck-stop-local') return 6.0;
    if(cls==='settlement-local') return 5.6;
    if(cls==='local') return 5.8;
    if(cls==='dirt') return 5.0;
    if(cls==='driveway') return 4.2;
    return 5.8;
  }

  function segmentRecord(ax,az,bx,bz,width,type,opts={}) {
    return {
      ax,az,bx,bz,width,type,
      dirt:!!opts.dirt,
      toInterstate:!!opts.toInterstate,
      crossing:opts.crossing||null,
      along:opts.along??null,
      roadName:opts.roadName||null,
      routeTier:opts.routeTier||null
    };
  }

  const TRUCK_STOP_CROSSING_INDEX=12; // ~0.9 mi from start.
  const TRUCK_STOP_NAME='Coyote Junction Truck Plaza';

  function truckStopWorldPoint(lx,lz) {
    return crossingLocalToWorld(TRUCK_STOP_CROSSING_INDEX,lx,lz,SURFACE_ROAD_Y);
  }

  function truckStopSegment(lx0,lz0,lx1,lz1,width,name) {
    const a=truckStopWorldPoint(lx0,lz0);
    const b=truckStopWorldPoint(lx1,lz1);
    return segmentRecord(
      a.x,a.z,b.x,b.z,width,
      'county-t-junction',
      {roadName:name,routeTier:'truck-stop'}
    );
  }

  function allTruckStopRoadSegments() {
    return [
      truckStopSegment(180,0,180,58,6.2,'Truck Plaza West Access'),
      truckStopSegment(306,0,306,58,6.2,'Truck Plaza East Access'),
      truckStopSegment(180,58,306,58,6.6,'Plaza Drive'),

      truckStopSegment(205,58,205,126,6.0,'Fuel Lane'),
      truckStopSegment(270,58,270,126,6.0,'Restaurant Row'),
      truckStopSegment(205,126,270,126,6.0,'Truck Court'),

      truckStopSegment(205,126,205,178,7.0,'Truck Court'),
      truckStopSegment(205,178,306,178,7.0,'Truck Court'),
      truckStopSegment(306,178,306,58,7.0,'Truck Court'),

      // One-way Roadhouse Grill drive-thru loop.
      truckStopSegment(270,78,292,78,4.6,'Roadhouse Drive Thru'),
      truckStopSegment(292,78,292,100,4.6,'Roadhouse Drive Thru'),
      truckStopSegment(292,100,270,100,4.6,'Roadhouse Drive Thru'),

      // One-way Chicken & Biscuits drive-thru loop.
      truckStopSegment(270,108,246,108,4.6,'Chicken Drive Thru'),
      truckStopSegment(246,108,246,126,4.6,'Chicken Drive Thru'),
      truckStopSegment(246,126,270,126,4.6,'Chicken Drive Thru'),

      // Small motel spur beyond the main truck plaza.
      truckStopSegment(306,58,354,58,5.8,'Motel Access'),
      truckStopSegment(354,58,354,116,5.8,'Motel Access')
    ];
  }

  function truckStopRoadSegmentsForTile(tx,tz) {
    return allTruckStopRoadSegments().filter(s=>{
      const m=segmentMidpoint(s);
      return worldTileIndexForCoord(m.x)===tx &&
             worldTileIndexForCoord(m.z)===tz;
    });
  }

  function roadIsTruckStopLocal(s) {
    return s?.routeTier==='truck-stop';
  }

  function addSampledCountyEW(out,row,x0,x1) {
    const steps=6;
    const roadName=deterministicRoadName('ew',row);
    const routeTier=countyRouteTier('ew',row);
    const width=countyRouteWidth('ew',row);
    let prev=countyEWPoint(row,x0);
    for(let i=1;i<=steps;i++){
      const p=countyEWPoint(row,THREE.MathUtils.lerp(x0,x1,i/steps));
      out.push(segmentRecord(
        prev.x,prev.z,p.x,p.z,
        width,
        'county-east-west',
        {roadName,routeTier}
      ));
      prev=p;
    }
  }

  function addSampledCountyNS(out,col,z0,z1) {
    const steps=6;
    const roadName=deterministicRoadName('ns',col);
    const routeTier=countyRouteTier('ns',col);
    const width=countyRouteWidth('ns',col);
    let prev=countyNSPoint(col,z0);
    for(let i=1;i<=steps;i++){
      const p=countyNSPoint(col,THREE.MathUtils.lerp(z0,z1,i/steps));
      out.push(segmentRecord(
        prev.x,prev.z,p.x,p.z,
        width,
        'county-north-south',
        {roadName,routeTier}
      ));
      prev=p;
    }
  }

  const FEEDER_ROUTE_STEP=48;

  function addGlobalFeederBins(out,line,a0,a1,info) {
    const lo=Math.min(a0,a1);
    const hi=Math.max(a0,a1);
    const first=Math.floor(lo/FEEDER_ROUTE_STEP);
    const last=Math.ceil(hi/FEEDER_ROUTE_STEP);

    for(let bin=first;bin<last;bin++){
      const s0=bin*FEEDER_ROUTE_STEP;
      const s1=(bin+1)*FEEDER_ROUTE_STEP;
      if(s1<lo||s0>hi) continue;

      const p0=feederPoint(line,s0);
      const p1=feederPoint(line,s1);
      out.push(segmentRecord(
        p0.x,p0.z,p1.x,p1.z,
        roadWidthForType('interstate-feeder'),
        'interstate-feeder',
        {toInterstate:true,crossing:info,along:(s0+s1)/2,roadName:info.roadName,routeTier:'major'}
      ));
    }
  }

  function nearestPointOnSegments(px,pz,segments,filterFn=null) {
    let best=null;
    for(const s of segments){
      if(filterFn && !filterFn(s)) continue;
      const hit=pointSegmentDistance2D(px,pz,s.ax,s.az,s.bx,s.bz);
      if(!best || hit.distance<best.distance){
        best={
          distance:hit.distance,
          x:THREE.MathUtils.lerp(s.ax,s.bx,hit.t),
          z:THREE.MathUtils.lerp(s.az,s.bz,hit.t),
          segment:s,
          t:hit.t
        };
      }
    }
    return best;
  }

  function isMajorSurfaceRoadType(type) {
    return type==='county-east-west' ||
           type==='county-north-south' ||
           type==='interstate-feeder' ||
           type==='county-connector';
  }

  function snapBranchEndpointsToNearbyRoads(segments) {
    const majors=segments.filter(s=>!s.dirt && isMajorSurfaceRoadType(s.type));
    const out=[];

    for(const s of segments){
      const branchLike=
        s.type==='county-t-junction' ||
        s.type==='county-connector' ||
        s.type==='dirt-spur';

      if(!branchLike){
        out.push(s);
        continue;
      }

      let ax=s.ax,az=s.az,bx=s.bx,bz=s.bz;

      // Preserve the authored origin; only the far endpoint is allowed to snap.
      // This converts "almost intersects" into a real centerline node.
      let best=null;
      for(const m of majors){
        // Don't snap back onto the road the branch already starts from.
        const originHit=pointSegmentDistance2D(ax,az,m.ax,m.az,m.bx,m.bz);
        if(originHit.distance<.75) continue;

        const hit=pointSegmentDistance2D(bx,bz,m.ax,m.az,m.bx,m.bz);
        if(hit.distance<=5.5 && hit.t>.03 && hit.t<.97 &&
           (!best || hit.distance<best.distance)){
          best={
            distance:hit.distance,
            x:THREE.MathUtils.lerp(m.ax,m.bx,hit.t),
            z:THREE.MathUtils.lerp(m.az,m.bz,hit.t)
          };
        }
      }

      if(best){
        bx=best.x;bz=best.z;
      }

      out.push(segmentRecord(
        ax,az,bx,bz,s.width,s.type,{
          dirt:s.dirt,
          toInterstate:s.toInterstate,
          crossing:s.crossing,
          along:s.along,
          roadName:s.roadName,
            routeTier:s.routeTier
        }
      ));
    }
    return out;
  }

  function trimMinorBranchesAtFirstRoad(segments) {
    const majors=segments.filter(s=>!s.dirt && isMajorSurfaceRoadType(s.type));
    const out=[];

    for(const s of segments){
      if(s.type!=='dirt-spur' && s.type!=='county-t-junction'){
        out.push(s);
        continue;
      }

      let bestT=1;
      let bestHit=null;
      for(const m of majors){
        const hit=segmentIntersection2D(s,m);
        if(!hit) continue;

        // Ignore the intended origin on the host road. Anything farther along
        // the branch is a real encountered road, so terminate there instead of
        // drawing through it.
        if(hit.t>.055 && hit.t<bestT-.01){
          bestT=hit.t;
          bestHit=hit;
        }
      }

      if(bestHit){
        out.push(segmentRecord(
          s.ax,s.az,bestHit.x,bestHit.z,
          s.width,s.type,
          {
            dirt:s.dirt,
            toInterstate:s.toInterstate,
            crossing:s.crossing,
            along:s.along,
            roadName:s.roadName,
            routeTier:s.routeTier
          }
        ));
      }else{
        out.push(s);
      }
    }
    return out;
  }

  function branchPointClearOfExistingNodes(x,z,segments,minDistance=28) {
    for(const s of segments){
      if(Math.hypot(x-s.ax,z-s.az)<minDistance) return false;
      if(Math.hypot(x-s.bx,z-s.bz)<minDistance) return false;
    }
    return true;
  }

  function branchLength(ax,az,bx,bz) {
    return Math.hypot(bx-ax,bz-az);
  }

  function segmentProjectedOverlapLength(a,b) {
    const da=segmentDirectionUnit(a);
    const a0=a.ax*da.x+a.az*da.z;
    const a1=a.bx*da.x+a.bz*da.z;
    const b0=b.ax*da.x+b.az*da.z;
    const b1=b.bx*da.x+b.bz*da.z;
    const amin=Math.min(a0,a1),amax=Math.max(a0,a1);
    const bmin=Math.min(b0,b1),bmax=Math.max(b0,b1);
    return Math.max(0,Math.min(amax,bmax)-Math.max(amin,bmin));
  }

  function hamletCandidateTile(tx,tz) {
    // Keep this synchronized with hamletForTile's deterministic settlement roll.
    return hash2D(tx,tz,804)<=.20;
  }

  function roadSpacingMinimumForTile(tx,tz) {
    // Open countryside: roads should feel widely spaced.
    // Hamlet-eligible tiles: tighter local spacing is permitted.
    return hamletCandidateTile(tx,tz)?58:130;
  }

  function segmentOwnerTile(s) {
    const m=segmentMidpoint(s);
    return {
      tx:worldTileIndexForCoord(m.x),
      tz:worldTileIndexForCoord(m.z)
    };
  }

  function roadSpacingMinimumForSegment(s) {
    const o=segmentOwnerTile(s);
    return roadSpacingMinimumForTile(o.tx,o.tz);
  }

  function ruralParallelSpacingViolation(candidate,existing,minSpacing=125,minOverlap=55) {
    const dc=segmentDirectionUnit(candidate);
    const de=segmentDirectionUnit(existing);
    const parallel=Math.abs(dc.x*de.x+dc.z*de.z);
    if(parallel<.965) return false;

    if(segmentProjectedOverlapLength(candidate,existing)<minOverlap) return false;

    // A genuine intersection is never a spacing violation.
    if(segmentIntersection2D(candidate,existing)) return false;

    // Likewise, roads are allowed to converge at their endpoints.
    const endpointGap=Math.min(
      Math.hypot(candidate.ax-existing.ax,candidate.az-existing.az),
      Math.hypot(candidate.ax-existing.bx,candidate.az-existing.bz),
      Math.hypot(candidate.bx-existing.ax,candidate.bz-existing.az),
      Math.hypot(candidate.bx-existing.bx,candidate.bz-existing.bz)
    );
    if(endpointGap<18) return false;

    const cm=segmentMidpoint(candidate);
    const em=segmentMidpoint(existing);
    const toExisting=pointSegmentDistance2D(
      cm.x,cm.z,existing.ax,existing.az,existing.bx,existing.bz
    );
    const toCandidate=pointSegmentDistance2D(
      em.x,em.z,candidate.ax,candidate.az,candidate.bx,candidate.bz
    );
    return Math.min(toExisting.distance,toCandidate.distance)<minSpacing;
  }

  function minorPavedBranchClear(candidate,segments,minSpacing=125) {
    for(const s of segments){
      if(s.dirt) continue;
      if(sameLogicalRoadSegment(candidate,s)) continue;
      if(ruralParallelSpacingViolation(candidate,s,minSpacing,55)) return false;
    }
    return true;
  }


  function settlementStreetName(tx,tz,index=0) {
    const bases=['Main','Center','Market','School','Mill','Depot','Church','Oak'];
    const suffixes=['Street','Lane','Way','Avenue'];
    const a=bases[Math.floor(hash2D(tx,tz,970+index)*bases.length)];
    const b=suffixes[Math.floor(hash2D(tx,tz,980+index)*suffixes.length)];
    return `${a} ${b}`;
  }

  function bestSettlementBackboneIntersection(segments,tx,tz) {
    const paved=segments.filter(s=>{
      if(s.dirt) return false;
      const cls=roadClassForType(s.type,s.routeTier);
      return cls==='major-county'||cls==='county'||cls==='feeder';
    });
    let best=null;

    for(let i=0;i<paved.length;i++){
      for(let j=i+1;j<paved.length;j++){
        const a=paved[i],b=paved[j];
        if(roadDisplayName(a)===roadDisplayName(b)) continue;
        const hit=segmentIntersection2D(a,b);
        if(!hit) continue;

        const cx=tx*WORLD_TILE_SIZE,cz=tz*WORLD_TILE_SIZE;
        const dCenter=Math.hypot(hit.x-cx,hit.z-cz);
        if(dCenter>WORLD_TILE_SIZE*.60) continue;

        const score=roadJunctionPriority(a)+roadJunctionPriority(b)-dCenter*.02;
        if(!best||score>best.score){
          best={x:hit.x,z:hit.z,a,b,score};
        }
      }
    }
    return best;
  }

  function addSettlementLocalStreets(out,tx,tz) {
    if(!hamletCandidateTile(tx,tz)) return;

    const center=bestSettlementBackboneIntersection(out,tx,tz);
    if(!center) return;

    const main=center.a;
    const dx=main.bx-main.ax,dz=main.bz-main.az;
    const len=Math.hypot(dx,dz)||1;
    const ux=dx/len,uz=dz/len;
    const nx=-uz,nz=ux;

    const streets=[];
    const offsets=[-48,48];
    const halfLen=54+hash2D(tx,tz,991)*18;

    for(let i=0;i<offsets.length;i++){
      const along=offsets[i];
      const cx=center.x+ux*along;
      const cz=center.z+uz*along;
      streets.push(segmentRecord(
        cx-nx*halfLen,cz-nz*halfLen,
        cx+nx*halfLen,cz+nz*halfLen,
        5.6,
        'county-t-junction',
        {roadName:settlementStreetName(tx,tz,i),routeTier:'settlement'}
      ));
    }

    const side=hash2D(tx,tz,993)<.5?-1:1;
    const lateral=38+hash2D(tx,tz,994)*10;
    const a={
      x:center.x+ux*offsets[0]+nx*side*lateral,
      z:center.z+uz*offsets[0]+nz*side*lateral
    };
    const b={
      x:center.x+ux*offsets[1]+nx*side*lateral,
      z:center.z+uz*offsets[1]+nz*side*lateral
    };
    streets.push(segmentRecord(
      a.x,a.z,b.x,b.z,
      5.4,
      'county-t-junction',
      {roadName:settlementStreetName(tx,tz,2),routeTier:'settlement'}
    ));

    for(const s of streets){
      const m=segmentMidpoint(s);
      if(Math.abs(localRoadX(m.x,m.z))<120) continue;
      out.push(s);
    }
  }

  function _uncachedProceduralRoadSegmentsForTile(tx,tz) {
    const out=[];
    const half=WORLD_TILE_SIZE/2;
    const cx=tx*WORLD_TILE_SIZE;
    const cz=tz*WORLD_TILE_SIZE;
    const x0=cx-half, x1=cx+half;
    const z0=cz-half, z1=cz+half;

    // Sparse county roads, now gently curving rather than straight grid lines.
    if(positiveTileMod(tz,3)===0){
      const probe=countyEWPoint(tz,cx);
      if(Math.abs(localRoadX(probe.x,probe.z))>115){
        addSampledCountyEW(out,tz,x0,x1);
      }
    }

    if(positiveTileMod(tx,3)===1){
      const probe=countyNSPoint(tx,cz);
      if(Math.abs(localRoadX(probe.x,probe.z))>115){
        addSampledCountyNS(out,tx,z0,z1);
      }
    }

    // Long, gently curving feeder roads tied to REAL accessible I-9 crossings.
    for(const info of feederRoadCandidatesForTile(tx,tz)){
      const line=feederLineForCrossing(info);
      const probe=distanceToInfiniteLine(cx,cz,line);
      if(probe.distance>WORLD_TILE_SIZE*.90) continue;
      if(Math.abs(probe.along)<245) continue;

      const span=WORLD_TILE_SIZE*.82;
      addGlobalFeederBins(out,line,probe.along-span,probe.along+span,info);
    }

    out.push(...truckStopRoadSegmentsForTile(tx,tz));
    addSettlementLocalStreets(out,tx,tz);

    const paved=out.filter(s=>!s.dirt);

    // When a county road and an I-9 feeder occupy the same tile, occasionally
    // build a short connector so the networks interlock rather than merely pass.
    const county=paved.filter(s=>s.type.startsWith('county-'));
    const feeder=paved.filter(s=>s.type==='interstate-feeder');
    if(county.length && feeder.length && hash2D(tx,tz,180)<(hamletCandidateTile(tx,tz) ? .42 : .24)){
      const c=county[Math.floor(hash2D(tx,tz,181)*county.length)];

      // Pick a deterministic point on the chosen county segment, then project
      // that exact point to the feeder centerline. Both connector endpoints are
      // therefore centerline-to-centerline, not approximate pavement overlaps.
      const ct=.35+hash2D(tx,tz,182)*.30;
      const cxp=THREE.MathUtils.lerp(c.ax,c.bx,ct);
      const czp=THREE.MathUtils.lerp(c.az,c.bz,ct);
      const f=nearestPointOnSegments(cxp,czp,feeder);

      if(f && f.distance>28 && f.distance<112 &&
         branchPointClearOfExistingNodes(cxp,czp,paved,24)){
        const connector=segmentRecord(
          cxp,czp,f.x,f.z,
          roadWidthForType('county-connector'),
          'county-connector',{
          toInterstate:true,
          crossing:f.segment.crossing,
          roadName:`${roadDisplayName(c)||'County Road'} Connector`,
          routeTier:c.routeTier==='major'||f.segment.routeTier==='major'?'major':'connector'
        });
        if(minorPavedBranchClear(connector,paved,Math.min(110,roadSpacingMinimumForTile(tx,tz)))){
          out.push(connector);
        }
      }
    }

    // Dirt farm spurs and occasional T-junctions. These branch from existing
    // paved roads, so they never materialize as isolated strips in a field.
    if(paved.length && hash2D(tx,tz,200)<(hamletCandidateTile(tx,tz) ? .22 : .14)){
      const baseSeg=paved[Math.floor(hash2D(tx,tz,201)*paved.length)];
      const t=.34+hash2D(tx,tz,202)*.32;
      const bx=THREE.MathUtils.lerp(baseSeg.ax,baseSeg.bx,t);
      const bz=THREE.MathUtils.lerp(baseSeg.az,baseSeg.bz,t);
      const dx=baseSeg.bx-baseSeg.ax,dz=baseSeg.bz-baseSeg.az;
      const len=Math.hypot(dx,dz)||1;
      const side=hash2D(tx,tz,203)<.5?-1:1;
      const nx=(-dz/len)*side,nz=(dx/len)*side;
      const spurLen=82+hash2D(tx,tz,204)*92;
      const bend=(hash2D(tx,tz,205)-.5)*34;
      const ex=bx+nx*spurLen+(dx/len)*bend;
      const ez=bz+nz*spurLen+(dz/len)*bend;

      if(Math.abs(localRoadX(ex,ez))>55 &&
         branchPointClearOfExistingNodes(bx,bz,paved,28) &&
         branchLength(bx,bz,ex,ez)>=82){
        const midx=THREE.MathUtils.lerp(bx,ex,.52)+(dx/len)*(hash2D(tx,tz,206)-.5)*16;
        const midz=THREE.MathUtils.lerp(bz,ez,.52)+(dz/len)*(hash2D(tx,tz,207)-.5)*16;
        const spurName=`${roadDisplayName(baseSeg)||'Farm'} Spur`;
        out.push(segmentRecord(
          bx,bz,midx,midz,
          roadWidthForType('dirt-spur'),
          'dirt-spur',
          {dirt:true,roadName:spurName,routeTier:'dirt'}
        ));
        out.push(segmentRecord(
          midx,midz,ex,ez,
          roadWidthForType('dirt-spur'),
          'dirt-spur',
          {dirt:true,roadName:spurName,routeTier:'dirt'}
        ));
      }
    }

    // Some paved roads simply branch as T-junctions instead of making a
    // perfectly repetitive cross-shaped grid.
    if(county.length && hash2D(tx,tz,220)<(hamletCandidateTile(tx,tz) ? .14 : .045)){
      const base=county[Math.floor(hash2D(tx,tz,221)*county.length)];
      const bt=.40+hash2D(tx,tz,224)*.20;
      const bx=THREE.MathUtils.lerp(base.ax,base.bx,bt);
      const bz=THREE.MathUtils.lerp(base.az,base.bz,bt);
      const dx=base.bx-base.ax,dz=base.bz-base.az;
      const len=Math.hypot(dx,dz)||1;
      const side=hash2D(tx,tz,222)<.5?-1:1;
      const nx=(-dz/len)*side,nz=(dx/len)*side;
      const l=110+hash2D(tx,tz,223)*90;
      const ex=bx+nx*l,ez=bz+nz*l;
      if(Math.abs(localRoadX(ex,ez))>95 &&
         branchPointClearOfExistingNodes(bx,bz,paved,32)){
        const branch=segmentRecord(
          bx,bz,ex,ez,
          roadWidthForType('county-t-junction'),
          'county-t-junction',
          {roadName:localBranchRoadName(tx,tz,1),routeTier:'local'}
        );
        if(minorPavedBranchClear(branch,paved,roadSpacingMinimumForTile(tx,tz))){
          out.push(branch);
        }
      }
    }

    return snapBranchEndpointsToNearbyRoads(trimMinorBranchesAtFirstRoad(out));
  }

  function proceduralRoadSegmentsForTile(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(proceduralRoadCache.has(key)) return proceduralRoadCache.get(key);
    return boundedTileCacheSet(proceduralRoadCache,key,_uncachedProceduralRoadSegmentsForTile(tx,tz));
  }

  function proceduralRoadInfoAt(x,z) {
    const tx=worldTileIndexForCoord(x);
    const tz=worldTileIndexForCoord(z);
    let best=null;

    // Road pieces can extend past their owner tile, so inspect neighbors too.
    for(let dz=-1;dz<=1;dz++){
      for(let dx=-1;dx<=1;dx++){
        const tileX=tx+dx,tileZ=tz+dz;
        const segments=[
          ...proceduralRoadSegmentsForTile(tileX,tileZ),
          ...roadsideDrivewaySegmentsForTile(tileX,tileZ)
        ];
        for(const s of segments){
          const hit=pointSegmentDistance2D(x,z,s.ax,s.az,s.bx,s.bz);
          const edge=s.width/2+.28;
          if(hit.distance<=edge && (!best || hit.distance<best.distance)){
            best={
              distance:hit.distance,
              type:s.type,
              dirt:s.dirt,
              toInterstate:s.toInterstate,
              crossing:s.crossing,
              along:s.along,
              roadName:roadDisplayName(s),
              routeTier:s.routeTier
            };
          }
        }
      }
    }
    return best;
  }

  function proceduralRoadSurfaceYAt(x,z) {
    const info=proceduralRoadInfoAt(x,z);
    if(!info) return null;
    return SURFACE_ROAD_Y;
  }

  function segmentIntersection2D(a,b) {
    const x1=a.ax,z1=a.az,x2=a.bx,z2=a.bz;
    const x3=b.ax,z3=b.az,x4=b.bx,z4=b.bz;
    const den=(x1-x2)*(z3-z4)-(z1-z2)*(x3-x4);
    if(Math.abs(den)<1e-7) return null;

    const t=((x1-x3)*(z3-z4)-(z1-z3)*(x3-x4))/den;
    const u=-((x1-x2)*(z1-z3)-(z1-z2)*(x1-x3))/den;
    if(t<-.001||t>1.001||u<-.001||u>1.001) return null;

    return {
      x:x1+t*(x2-x1),
      z:z1+t*(z2-z1),
      t:THREE.MathUtils.clamp(t,0,1),
      u:THREE.MathUtils.clamp(u,0,1)
    };
  }

  function junctionKey(x,z) {
    return `${Math.round(x*4)/4},${Math.round(z*4)/4}`;
  }

  function roadDirectionAtNode(s,nodeX,nodeZ) {
    const da=Math.hypot(s.ax-nodeX,s.az-nodeZ);
    const db=Math.hypot(s.bx-nodeX,s.bz-nodeZ);
    const tx=da>db?s.ax:s.bx;
    const tz=da>db?s.az:s.bz;
    const dx=tx-nodeX,dz=tz-nodeZ;
    const len=Math.hypot(dx,dz)||1;
    return {x:dx/len,z:dz/len};
  }

  function roadsNearlyCollinearAtNode(a,b,x,z) {
    const va=roadDirectionAtNode(a,x,z);
    const vb=roadDirectionAtNode(b,x,z);
    const dot=Math.abs(va.x*vb.x+va.z*vb.z);
    return dot>.985;
  }

  function roadJunctionPriority(s) {
    if(!s) return 0;
    if(s.type==='interstate-feeder') return 6;
    if(s.type==='county-east-west'||s.type==='county-north-south') return 5;
    if(s.type==='county-connector') return 4;
    if(s.type==='county-t-junction') return 3;
    if(s.type==='dirt-spur') return 2;
    if(s.type==='driveway') return 1;
    return 3;
  }

  function segmentEndsAtPoint(s,x,z,tol=.70) {
    return Math.min(
      Math.hypot(s.ax-x,s.az-z),
      Math.hypot(s.bx-x,s.bz-z)
    )<=tol;
  }


  // -------------------------------------------------------------------
  // WORKER-ASSISTED JUNCTION PREFETCH
  //
  // Three.js object construction must stay on the main thread, but the most
  // arithmetic-heavy part of road preparation -- pairwise segment junction
  // discovery and nearby-node consolidation -- can be calculated ahead of
  // time in a Web Worker. This is deliberately a PREFETCH layer: if a tile is
  // needed before its worker result returns, the existing synchronous path is
  // still authoritative and gameplay never waits on the worker.
  // -------------------------------------------------------------------
  const serializedRoadTileCache=new Map();
  const SERIALIZED_ROAD_CACHE_LIMIT=900;
  let serializedRoadCacheHits=0;
  let serializedRoadCacheMisses=0;
  let serializedRoadRecordsBuilt=0;
  let workerPipelineFrames=0;
  let workerPipelineLastDispatches=0;
  let workerPipelineMaxDispatches=0;
  let workerPipelineRoundRobin=0;

  function serializeRoadRecord(s) {
    return {
      ax:s.ax,az:s.az,bx:s.bx,bz:s.bz,
      width:s.width,type:s.type,dirt:!!s.dirt,
      toInterstate:!!s.toInterstate,
      crossing:s.crossing||null,
      along:s.along??null,
      roadName:s.roadName||null,
      routeTier:s.routeTier||null
    };
  }

  function serializedBaseRoadsForTile(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(serializedRoadTileCache.has(key)){
      serializedRoadCacheHits++;
      return serializedRoadTileCache.get(key);
    }

    serializedRoadCacheMisses++;
    const roads=proceduralRoadSegmentsForTile(tx,tz).map(serializeRoadRecord);
    serializedRoadRecordsBuilt+=roads.length;
    boundedTileCacheSet(
      serializedRoadTileCache,
      key,
      roads,
      SERIALIZED_ROAD_CACHE_LIMIT
    );
    return roads;
  }

  const tilePlanCache=new Map();
  const tilePlanWorkerQueue=[];
  const tilePlanWorkerQueuedKeys=new Set();
  const tilePlanWorkerInFlight=new Set();
  let tilePlanWorker=null;
  let tilePlanWorkerSupported=false;
  let tilePlanWorkerCompleted=0;
  let tilePlanWorkerDispatches=0;
  let tilePlanWorkerLastMs=0;
  let tilePlanWorkerMaxMs=0;
  let tilePlanCacheHits=0;
  let tilePlanFallbacks=0;
  let tileManifestUses=0;
  let tileManifestFallbacks=0;

  const junctionWorkerPrefetchQueue=[];
  const junctionWorkerQueuedKeys=new Set();
  const junctionWorkerInFlight=new Set();
  let junctionWorker=null;
  let junctionWorkerSupported=false;
  let junctionWorkerCompleted=0;
  let junctionWorkerCacheHits=0;
  let junctionWorkerFallbacks=0;
  let junctionWorkerLastMs=0;
  let junctionWorkerMaxMs=0;
  let junctionWorkerDispatches=0;


  function createTilePlanWorker() {
    if(typeof Worker==='undefined' || typeof Blob==='undefined' || typeof URL==='undefined') return null;

    const source=`
      function hash2D(ix,iz,salt=0){
        let n=Math.imul(ix+salt*1013,374761393)^Math.imul(iz-salt*1619,668265263);
        n=Math.imul(n^(n>>>13),1274126177);
        n^=n>>>16;
        return (n>>>0)/4294967296;
      }
      function roadCenterXAtZ(z){
        return Math.sin(z/720)*7.2 +
               Math.sin(z/1320+1.15)*3.4 +
               Math.sin(z/3100+2.2)*2.0;
      }
      function roadClass(s){
        if(s.type==='interstate-feeder')return 'feeder';
        if(s.type==='county-east-west'||s.type==='county-north-south')
          return s.routeTier==='major'?'major-county':'county';
        if(s.type==='county-connector')
          return s.routeTier==='major'?'major-connector':'connector';
        if(s.type==='county-t-junction')
          return s.routeTier==='settlement'?'settlement-local':'local';
        if(s.type==='dirt-spur')return 'dirt';
        if(s.type==='driveway')return 'driveway';
        return 'local';
      }
      function pointSeg(px,pz,s){
        const abx=s.bx-s.ax,abz=s.bz-s.az;
        const apx=px-s.ax,apz=pz-s.az;
        const denom=abx*abx+abz*abz||1;
        const t=Math.max(0,Math.min(1,(apx*abx+apz*abz)/denom));
        const qx=s.ax+abx*t,qz=s.az+abz*t;
        return {distance:Math.hypot(px-qx,pz-qz),t};
      }
      function sameLogical(a,b){
        if(!a||!b)return false;
        const direct=Math.hypot(a.ax-b.ax,a.az-b.az)<.02&&Math.hypot(a.bx-b.bx,a.bz-b.bz)<.02;
        const reverse=Math.hypot(a.ax-b.bx,a.az-b.bz)<.02&&Math.hypot(a.bx-b.ax,a.bz-b.az)<.02;
        return (direct||reverse)&&a.type===b.type;
      }
      function clearOfRoadsAndSite(x,z,neighborRoads,site,clearance){
        let bestEdge=Infinity;
        for(const s of neighborRoads){
          const h=pointSeg(x,z,s);
          const edge=h.distance-(s.width||6)/2;
          if(edge<bestEdge)bestEdge=edge;
        }
        if(bestEdge<clearance)return false;
        if(site && Math.hypot(x-site.sx,z-site.sz)<clearance+22)return false;
        return true;
      }
      function makeManifest(tx,tz,neighborRoads,site){
        const WORLD_TILE_SIZE=180;
        const cx=tx*WORLD_TILE_SIZE;
        const cz=tz*WORLD_TILE_SIZE;

        const building={
          roll:hash2D(tx,tz,60),
          x:cx+(hash2D(tx,tz,61)-.5)*WORLD_TILE_SIZE*.55,
          z:cz+(hash2D(tx,tz,62)-.5)*WORLD_TILE_SIZE*.55,
          seed:hash2D(tx,tz,63)
        };
        building.interstateClear=Math.abs(building.x-roadCenterXAtZ(building.z))>65;
        building.roadClear=clearOfRoadsAndSite(
          building.x,building.z,neighborRoads,site,14
        );

        const field={
          roll:hash2D(tx,tz,31),
          x:cx+(hash2D(tx,tz,32)-.5)*WORLD_TILE_SIZE*.55,
          z:cz+(hash2D(tx,tz,33)-.5)*WORLD_TILE_SIZE*.55,
          w:28+hash2D(tx,tz,34)*34,
          d:34+hash2D(tx,tz,35)*48,
          dark:hash2D(tx,tz,36)<=.5
        };
        field.interstateClear=Math.abs(field.x-roadCenterXAtZ(field.z))>34;
        field.roadClear=clearOfRoadsAndSite(
          field.x,field.z,neighborRoads,site,18
        );

        const treeBase=1+hash2D(tx,tz,40)*5;
        const trees=[];
        for(let i=0;i<6;i++){
          const x=cx+(hash2D(tx,tz,41+i*3)-.5)*(WORLD_TILE_SIZE-18);
          const z=cz+(hash2D(tx,tz,42+i*3)-.5)*(WORLD_TILE_SIZE-18);
          trees.push({
            x,z,
            seed:hash2D(tx,tz,43+i*3),
            interstateClear:Math.abs(x-roadCenterXAtZ(z))>26,
            roadClear:clearOfRoadsAndSite(x,z,neighborRoads,site,5.5)
          });
        }

        const siteTrees=[];
        if(site){
          const count=2+Math.floor(hash2D(tx,tz,320)*4);
          for(let i=0;i<count;i++){
            const along=(hash2D(tx,tz,321+i*2)-.5)*28;
            const lateral=10+hash2D(tx,tz,322+i*2)*15;
            siteTrees.push({
              x:site.sx+site.ux*along+site.nx*lateral,
              z:site.sz+site.uz*along+site.nz*lateral,
              seed:hash2D(tx,tz,340+i)
            });
          }
        }

        return {building,field,treeBase,trees,siteTrees};
      }
      function makeSite(tx,tz,centerRoads,neighborRoads){
        const roads=centerRoads.filter(s=>{
          const cls=roadClass(s);
          const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2;
          return !s.dirt &&
            (cls==='major-county'||cls==='county'||cls==='feeder') &&
            !!s.roadName &&
            Math.abs(mx-roadCenterXAtZ(mz))>150;
        });
        if(!roads.length)return null;

        const majorHere=roads.some(s=>{
          const cls=roadClass(s);
          return cls==='major-county'||cls==='feeder';
        });
        const chanceLimit=majorHere?.34:.22;
        if(hash2D(tx,tz,300)>chanceLimit)return null;

        const preferred=majorHere
          ? roads.filter(s=>{
              const cls=roadClass(s);
              return cls==='major-county'||cls==='feeder';
            })
          : roads;
        const pool=preferred.length?preferred:roads;
        const road=pool[Math.floor(hash2D(tx,tz,301)*pool.length)];

        const t=.30+hash2D(tx,tz,302)*.40;
        const rx=road.ax+(road.bx-road.ax)*t;
        const rz=road.az+(road.bz-road.az)*t;
        const dx=road.bx-road.ax,dz=road.bz-road.az;
        const len=Math.hypot(dx,dz)||1;
        const ux=dx/len,uz=dz/len;
        const side=hash2D(tx,tz,303)<.5?-1:1;
        const nx=(-uz)*side,nz=ux*side;
        const setback=18+hash2D(tx,tz,304)*16;
        const sx=rx+nx*setback,sz=rz+nz*setback;

        let bestEdge=Infinity;
        for(const s of neighborRoads){
          if(sameLogical(s,road))continue;
          const h=pointSeg(sx,sz,s);
          const edge=h.distance-(s.width||6)/2;
          if(edge<bestEdge)bestEdge=edge;
        }
        if(bestEdge<=20)return null;

        const typeRoll=hash2D(tx,tz,305);
        const cls=roadClass(road);
        const developed=cls==='major-county'||cls==='feeder';
        const type=developed
          ? (typeRoll<.30?'farm':typeRoll<.58?'store':typeRoll<.82?'gas':'cluster')
          : (typeRoll<.58?'farm':typeRoll<.77?'store':typeRoll<.90?'gas':'cluster');

        return {
          tx,tz,type,road,rx,rz,sx,sz,ux,uz,nx,nz,setback,side,
          roadName:road.roadName||null,
          name:null,
          driveway:{
            ax:rx,az:rz,
            bx:sx-nx*5,bz:sz-nz*5,
            width:4.2,
            type:'driveway',
            dirt:false,
            routeTier:'driveway',
            roadName:road.roadName?road.roadName+' Access':null
          }
        };
      }

      self.onmessage=e=>{
        const {tx,tz,key,centerRoads,neighborRoads}=e.data;
        const started=performance.now();
        const site=makeSite(tx,tz,centerRoads,neighborRoads);
        const manifest=makeManifest(tx,tz,neighborRoads,site);
        self.postMessage({tx,tz,key,site,manifest,workerMs:performance.now()-started});
      };
    `;

    try{
      const blob=new Blob([source],{type:'application/javascript'});
      const url=URL.createObjectURL(blob);
      const worker=new Worker(url);
      URL.revokeObjectURL(url);
      return worker;
    }catch(err){
      console.warn('Interstate Drive tile-plan worker unavailable:',err);
      return null;
    }
  }

  function initTilePlanWorker() {
    if(tilePlanWorker) return;
    tilePlanWorker=createTilePlanWorker();
    tilePlanWorkerSupported=!!tilePlanWorker;
    if(!tilePlanWorker) return;

    tilePlanWorker.onmessage=e=>{
      const data=e.data||{};
      const key=data.key;
      tilePlanWorkerInFlight.delete(key);
      if(!tilePlanCache.has(key)){
        boundedTileCacheSet(tilePlanCache,key,{
          site:data.site||null,
          manifest:data.manifest||null
        });
      }
      tilePlanWorkerCompleted++;
      tilePlanWorkerLastMs=data.workerMs||0;
      tilePlanWorkerMaxMs=Math.max(tilePlanWorkerMaxMs,tilePlanWorkerLastMs);
    };
    tilePlanWorker.onerror=err=>{
      console.warn('Interstate Drive tile-plan worker error; synchronous planning retained.',err);
      tilePlanWorkerSupported=false;
    };
  }

  function serializeBaseRoadsForTile(tx,tz) {
    return serializedBaseRoadsForTile(tx,tz);
  }

  function serializeNeighborBaseRoads(tx,tz) {
    const out=[];
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        out.push(...serializedBaseRoadsForTile(tx+ox,tz+oz));
      }
    }
    return out;
  }

  function queueTilePlanWorker(tx,tz,priority=0) {
    if(!tilePlanWorkerSupported) return;
    const key=tileCacheKey(tx,tz);
    if(tilePlanCache.has(key)){ tilePlanCacheHits++; return; }
    if(tilePlanWorkerQueuedKeys.has(key)||tilePlanWorkerInFlight.has(key)) return;
    tilePlanWorkerQueuedKeys.add(key);
    tilePlanWorkerQueue.push({tx,tz,key,priority});
  }

  function pumpTilePlanWorker(maxDispatch=1) {
    if(!tilePlanWorkerSupported||!tilePlanWorker) return;
    let dispatched=0;
    while(tilePlanWorkerQueue.length&&dispatched<maxDispatch&&tilePlanWorkerInFlight.size<3){
      const item=tilePlanWorkerQueue.shift();
      tilePlanWorkerQueuedKeys.delete(item.key);
      if(tilePlanCache.has(item.key)){ tilePlanCacheHits++; continue; }

      const centerRoads=serializeBaseRoadsForTile(item.tx,item.tz);
      const neighborRoads=serializeNeighborBaseRoads(item.tx,item.tz);

      tilePlanWorkerInFlight.add(item.key);
      tilePlanWorkerDispatches++;
      tilePlanWorker.postMessage({
        tx:item.tx,tz:item.tz,key:item.key,
        centerRoads,neighborRoads
      });
      dispatched++;
    }
  }

  function createJunctionWorker() {
    if(typeof Worker==='undefined' || typeof Blob==='undefined' || typeof URL==='undefined') return null;

    const source=`
      const WORLD_TILE_SIZE=180;

      function tileIndex(v){
        return Math.floor((v + WORLD_TILE_SIZE/2) / WORLD_TILE_SIZE);
      }
      function pointSeg(px,pz,ax,az,bx,bz){
        const abx=bx-ax,abz=bz-az;
        const apx=px-ax,apz=pz-az;
        const denom=abx*abx+abz*abz||1;
        const t=Math.max(0,Math.min(1,(apx*abx+apz*abz)/denom));
        const qx=ax+abx*t,qz=az+abz*t;
        return {distance:Math.hypot(px-qx,pz-qz),t};
      }
      function intersection(a,b){
        const x1=a.ax,y1=a.az,x2=a.bx,y2=a.bz;
        const x3=b.ax,y3=b.az,x4=b.bx,y4=b.bz;
        const den=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
        if(Math.abs(den)<1e-8) return null;
        const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/den;
        const u=-((x1-x2)*(y1-y3)-(y1-y2)*(x1-x3))/den;
        if(t<-.0001||t>1.0001||u<-.0001||u>1.0001) return null;
        return {x:x1+t*(x2-x1),z:y1+t*(y2-y1)};
      }
      function priority(s){
        if(!s)return 0;
        if(s.type==='interstate-feeder')return 6;
        if(s.type==='county-east-west'||s.type==='county-north-south')return 5;
        if(s.type==='county-connector')return 4;
        if(s.type==='county-t-junction')return 3;
        if(s.type==='dirt-spur')return 2;
        if(s.type==='driveway')return 1;
        return 3;
      }
      function endsAt(s,x,z,tol=.70){
        return Math.min(Math.hypot(s.ax-x,s.az-z),Math.hypot(s.bx-x,s.bz-z))<=tol;
      }
      function direction(s,x,z){
        const da=Math.hypot(s.ax-x,s.az-z),db=Math.hypot(s.bx-x,s.bz-z);
        const tx=da>db?s.ax:s.bx,tz=da>db?s.az:s.bz;
        const dx=tx-x,dz=tz-z,len=Math.hypot(dx,dz)||1;
        return {x:dx/len,z:dz/len};
      }
      function collinear(a,b,x,z){
        const va=direction(a,x,z),vb=direction(b,x,z);
        return Math.abs(va.x*vb.x+va.z*vb.z)>.985;
      }
      function sameRoad(a,b){
        return Math.abs(a.ax-b.ax)<.01&&Math.abs(a.az-b.az)<.01&&
               Math.abs(a.bx-b.bx)<.01&&Math.abs(a.bz-b.bz)<.01&&
               a.type===b.type;
      }
      function collect(tx,tz,segments){
        const unique=[],seen=new Set();
        for(const s of segments){
          const a=s.ax.toFixed(2)+','+s.az.toFixed(2);
          const b=s.bx.toFixed(2)+','+s.bz.toFixed(2);
          const k=(a<b?a+'|'+b:b+'|'+a)+'|'+s.type;
          if(seen.has(k))continue;
          seen.add(k);unique.push(s);
        }
        const nodes=new Map();
        function register(x,z,s1,s2,kind){
          if(tileIndex(x)!==tx||tileIndex(z)!==tz)return;
          const k=(Math.round(x*4)/4)+','+(Math.round(z*4)/4);
          const current=nodes.get(k);
          const roads=current&&current.roads?[...current.roads]:[];
          for(const s of [s1,s2]){
            if(!s)continue;
            if(!roads.some(r=>sameRoad(r,s)))roads.push(s);
          }
          const maxWidth=Math.max(s1&&s1.width||0,s2&&s2.width||0,5);
          const hasPaved=roads.some(r=>!r.dirt);
          const maxPriority=Math.max(...roads.map(priority));
          const teeLike=kind==='tee'||roads.some(r=>endsAt(r,x,z)&&priority(r)<maxPriority);
          nodes.set(k,{
            x,z,
            radius:Math.max(teeLike?4.8:4.25,maxWidth*(teeLike?.82:.72)),
            dirt:!hasPaved,
            kind:teeLike?'tee':kind,
            roads
          });
        }
        for(let i=0;i<unique.length;i++){
          const a=unique[i];
          for(let j=i+1;j<unique.length;j++){
            const b=unique[j];
            const hit=intersection(a,b);
            if(hit){register(hit.x,hit.z,a,b,'crossing');continue;}
            for(const p of [[a.ax,a.az],[a.bx,a.bz]]){
              const h=pointSeg(p[0],p[1],b.ax,b.az,b.bx,b.bz);
              if(h.distance<.55&&h.t>.035&&h.t<.965)register(p[0],p[1],a,b,'tee');
            }
            for(const p of [[b.ax,b.az],[b.bx,b.bz]]){
              const h=pointSeg(p[0],p[1],a.ax,a.az,a.bx,a.bz);
              if(h.distance<.55&&h.t>.035&&h.t<.965)register(p[0],p[1],a,b,'tee');
            }
            for(const pa of [[a.ax,a.az],[a.bx,a.bz]]){
              for(const pb of [[b.ax,b.az],[b.bx,b.bz]]){
                if(Math.hypot(pa[0]-pb[0],pa[1]-pb[1])<.35){
                  const nx=(pa[0]+pb[0])/2,nz=(pa[1]+pb[1])/2;
                  if(!collinear(a,b,nx,nz))register(nx,nz,a,b,'endpoint');
                }
              }
            }
          }
        }
        return [...nodes.values()];
      }
      function consolidate(nodes){
        const pending=[...nodes],result=[];
        while(pending.length){
          const seed=pending.shift(),cluster=[seed];
          for(let i=pending.length-1;i>=0;i--){
            const n=pending[i];
            if(Math.hypot(n.x-seed.x,n.z-seed.z)<=6){
              cluster.push(n);pending.splice(i,1);
            }
          }
          if(cluster.length===1){result.push(seed);continue;}
          const roads=[];
          for(const n of cluster)for(const r of n.roads||[]){
            if(!roads.some(q=>sameRoad(q,r)))roads.push(r);
          }
          let weightSum=0,x=0,z=0;
          for(const n of cluster){
            const w=Math.max(1,n.radius);x+=n.x*w;z+=n.z*w;weightSum+=w;
          }
          x/=weightSum;z/=weightSum;
          const dirs=[];
          for(const r of roads){
            const v=direction(r,x,z);
            if(!dirs.some(d=>Math.abs(d.x*v.x+d.z*v.z)>.985))dirs.push(v);
          }
          result.push({
            x,z,
            radius:Math.max(...cluster.map(n=>n.radius))+Math.min(2,(cluster.length-1)*.55),
            dirt:roads.length?roads.every(r=>r.dirt):cluster.every(n=>n.dirt),
            kind:dirs.length>=4?'multi':dirs.length===3?'tee':cluster.some(n=>n.kind==='tee')?'tee':'crossing',
            roads
          });
        }
        return result;
      }
      self.onmessage=e=>{
        const {tx,tz,key,segments,startedAt}=e.data;
        const started=performance.now();
        const raw=collect(tx,tz,segments);
        const consolidated=consolidate(raw);
        self.postMessage({
          tx,tz,key,raw,consolidated,startedAt,
          workerMs:performance.now()-started
        });
      };
    `;

    try{
      const blob=new Blob([source],{type:'application/javascript'});
      const url=URL.createObjectURL(blob);
      const worker=new Worker(url);
      URL.revokeObjectURL(url);
      return worker;
    }catch(err){
      console.warn('Interstate Drive junction worker unavailable:',err);
      return null;
    }
  }

  function initJunctionWorker() {
    if(junctionWorker) return;
    junctionWorker=createJunctionWorker();
    junctionWorkerSupported=!!junctionWorker;
    if(!junctionWorker) return;

    junctionWorker.onmessage=e=>{
      const data=e.data||{};
      const key=data.key;
      junctionWorkerInFlight.delete(key);

      // Never overwrite a synchronous authoritative result that was computed
      // while the worker was busy.
      if(!junctionCache.has(key)){
        boundedTileCacheSet(junctionCache,key,data.raw||[]);
      }
      if(!consolidatedJunctionCache.has(key)){
        boundedTileCacheSet(consolidatedJunctionCache,key,data.consolidated||[]);
      }

      junctionWorkerCompleted++;
      junctionWorkerLastMs=data.workerMs||0;
      junctionWorkerMaxMs=Math.max(junctionWorkerMaxMs,junctionWorkerLastMs);
    };
    junctionWorker.onerror=err=>{
      console.warn('Interstate Drive junction worker error; synchronous fallback retained.',err);
      junctionWorkerSupported=false;
    };
  }

  function serializeJunctionSegmentsForTile(tx,tz) {
    const segments=[];
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        const ntx=tx+ox,ntz=tz+oz;
        segments.push(...serializedBaseRoadsForTile(ntx,ntz));
        const plan=tilePlanCache.get(tileCacheKey(ntx,ntz));
        if(plan?.site?.driveway){
          // The driveway is already plain data, but normalize it through the
          // same serializer so both workers receive one consistent schema.
          segments.push(serializeRoadRecord(plan.site.driveway));
        }
      }
    }
    return segments;
  }

  function queueJunctionWorkerPrefetch(tx,tz,priority=0) {
    if(!junctionWorkerSupported) return;
    const key=tileCacheKey(tx,tz);
    if(junctionCache.has(key) || consolidatedJunctionCache.has(key)){
      junctionWorkerCacheHits++;
      return;
    }
    if(junctionWorkerQueuedKeys.has(key) || junctionWorkerInFlight.has(key)) return;
    junctionWorkerQueuedKeys.add(key);
    junctionWorkerPrefetchQueue.push({tx,tz,key,priority});
  }

  function pumpJunctionWorkerPrefetch(maxDispatch=1) {
    if(!junctionWorkerSupported || !junctionWorker) return;
    let dispatched=0;
    while(junctionWorkerPrefetchQueue.length && dispatched<maxDispatch && junctionWorkerInFlight.size<3){
      const item=junctionWorkerPrefetchQueue.shift();
      junctionWorkerQueuedKeys.delete(item.key);
      if(junctionCache.has(item.key) || consolidatedJunctionCache.has(item.key)){
        junctionWorkerCacheHits++;
        continue;
      }
      let plansReady=true;
      for(let oz=-1;oz<=1&&plansReady;oz++){
        for(let ox=-1;ox<=1;ox++){
          if(!tilePlanCache.has(tileCacheKey(item.tx+ox,item.tz+oz))){
            plansReady=false;
            break;
          }
        }
      }
      if(!plansReady){
        junctionWorkerPrefetchQueue.push(item);
        junctionWorkerQueuedKeys.add(item.key);
        break;
      }

      const segments=serializeJunctionSegmentsForTile(item.tx,item.tz);
      junctionWorkerInFlight.add(item.key);
      junctionWorkerDispatches++;
      junctionWorker.postMessage({
        tx:item.tx,tz:item.tz,key:item.key,segments,
        startedAt:performance.now()
      });
      dispatched++;
    }
  }


  function processUnifiedWorkerPipeline(dt) {
    workerPipelineFrames++;

    // One feed envelope for both worker stages. A normal frame dispatches at
    // most one job; very fast frames may dispatch two. The starting stage
    // rotates so a large tile-plan queue cannot permanently starve junctions.
    const frameMs=Math.max(.1,dt*1000);
    const maxDispatches=frameMs<13 ? 2 : 1;
    let dispatched=0;

    for(let pass=0;pass<2 && dispatched<maxDispatches;pass++){
      const stage=(workerPipelineRoundRobin+pass)%2;

      if(stage===0 && tilePlanWorkerSupported && tilePlanWorker &&
         tilePlanWorkerQueue.length && tilePlanWorkerInFlight.size<3){
        const before=tilePlanWorkerDispatches;
        pumpTilePlanWorker(1);
        if(tilePlanWorkerDispatches>before) dispatched++;
      }

      if(stage===1 && dispatched<maxDispatches &&
         junctionWorkerSupported && junctionWorker &&
         junctionWorkerPrefetchQueue.length && junctionWorkerInFlight.size<3){
        const before=junctionWorkerDispatches;
        pumpJunctionWorkerPrefetch(1);
        if(junctionWorkerDispatches>before) dispatched++;
      }
    }

    workerPipelineRoundRobin=(workerPipelineRoundRobin+1)%2;
    workerPipelineLastDispatches=dispatched;
    workerPipelineMaxDispatches=Math.max(workerPipelineMaxDispatches,dispatched);
  }

  function scheduleWorkerPrefetchFromTileQueue(limit=14) {
    if(!junctionWorkerSupported) return;
    let count=0;
    for(const item of tileStreamQueue){
      if(count>=limit) break;
      const dist=tileChebyshevDistance(
        item.tx,item.tz,tileStreamCenterX,tileStreamCenterZ
      );
      // The 3x3 safety ring must always be able to fall back synchronously.
      // Worker prefetch is reserved for outer tiles where we have lead time.
      if(dist<=1) continue;
      for(let oz=-1;oz<=1;oz++){
        for(let ox=-1;ox<=1;ox++){
          queueTilePlanWorker(item.tx+ox,item.tz+oz,item.priority+Math.abs(ox)+Math.abs(oz));
        }
      }
      queueJunctionWorkerPrefetch(item.tx,item.tz,item.priority);
      count++;
    }
    tilePlanWorkerQueue.sort((a,b)=>a.priority-b.priority);
    junctionWorkerPrefetchQueue.sort((a,b)=>a.priority-b.priority);
  }

  function _uncachedCollectSurfaceJunctionsForTile(tx,tz) {
    const candidates=[];
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        candidates.push(...proceduralRoadSegmentsForTile(tx+ox,tz+oz));
        candidates.push(...roadsideDrivewaySegmentsForTile(tx+ox,tz+oz));
      }
    }

    const unique=[];
    const seenSeg=new Set();
    for(const s of candidates){
      const a=`${s.ax.toFixed(2)},${s.az.toFixed(2)}`;
      const b=`${s.bx.toFixed(2)},${s.bz.toFixed(2)}`;
      const k=a<b?`${a}|${b}|${s.type}`:`${b}|${a}|${s.type}`;
      if(seenSeg.has(k)) continue;
      seenSeg.add(k);
      unique.push(s);
    }

    const nodes=new Map();
    const register=(x,z,s1,s2,kind)=>{
      if(worldTileIndexForCoord(x)!==tx ||
         worldTileIndexForCoord(z)!==tz) return;

      const k=junctionKey(x,z);
      const maxWidth=Math.max(s1?.width||0,s2?.width||0,5.0);
      const current=nodes.get(k);
      const roads=current?.roads ? [...current.roads] : [];

      for(const s of [s1,s2]){
        if(!s) continue;
        if(!roads.some(r=>
          Math.abs(r.ax-s.ax)<.01&&Math.abs(r.az-s.az)<.01&&
          Math.abs(r.bx-s.bx)<.01&&Math.abs(r.bz-s.bz)<.01&&
          r.type===s.type
        )) roads.push(s);
      }

      const hasPaved=roads.some(r=>!r.dirt);
      const teeLike=kind==='tee' ||
        roads.some(r=>segmentEndsAtPoint(r,x,z) &&
          roadJunctionPriority(r)<Math.max(...roads.map(roadJunctionPriority)));

      nodes.set(k,{
        x,z,
        radius:Math.max(teeLike?4.8:4.25,maxWidth*(teeLike ? .82 : .72)),
        dirt:!hasPaved,
        kind:teeLike?'tee':kind,
        roads
      });
    };

    for(let i=0;i<unique.length;i++){
      const a=unique[i];
      for(let j=i+1;j<unique.length;j++){
        const b=unique[j];

        const hit=segmentIntersection2D(a,b);
        if(hit){
          register(hit.x,hit.z,a,b,'crossing');
          continue;
        }

        for(const [ex,ez] of [[a.ax,a.az],[a.bx,a.bz]]){
          const h=pointSegmentDistance2D(ex,ez,b.ax,b.az,b.bx,b.bz);
          if(h.distance<.55 && h.t>.035 && h.t<.965){
            register(ex,ez,a,b,'tee');
          }
        }
        for(const [ex,ez] of [[b.ax,b.az],[b.bx,b.bz]]){
          const h=pointSegmentDistance2D(ex,ez,a.ax,a.az,a.bx,a.bz);
          if(h.distance<.55 && h.t>.035 && h.t<.965){
            register(ex,ez,a,b,'tee');
          }
        }

        const ptsA=[[a.ax,a.az],[a.bx,a.bz]];
        const ptsB=[[b.ax,b.az],[b.bx,b.bz]];
        for(const pa of ptsA){
          for(const pb of ptsB){
            if(Math.hypot(pa[0]-pb[0],pa[1]-pb[1])<.35){
              const nx=(pa[0]+pb[0])/2,nz=(pa[1]+pb[1])/2;
              if(!roadsNearlyCollinearAtNode(a,b,nx,nz)){
                register(nx,nz,a,b,'endpoint');
              }
            }
          }
        }
      }
    }
    return [...nodes.values()];
  }

  function collectSurfaceJunctionsForTile(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(junctionCache.has(key)) return junctionCache.get(key);
    junctionWorkerFallbacks++;
    return boundedTileCacheSet(junctionCache,key,_uncachedCollectSurfaceJunctionsForTile(tx,tz));
  }

  function roadVectorAwayFromNode(s,node) {
    const da=Math.hypot(s.ax-node.x,s.az-node.z);
    const db=Math.hypot(s.bx-node.x,s.bz-node.z);
    const tx=da>db?s.ax:s.bx;
    const tz=da>db?s.az:s.bz;
    const dx=tx-node.x,dz=tz-node.z;
    const len=Math.hypot(dx,dz)||1;
    return {x:dx/len,z:dz/len};
  }

  function consolidateNearbyJunctions(nodes) {
    const pending=[...nodes];
    const result=[];

    while(pending.length){
      const seed=pending.shift();
      const cluster=[seed];

      for(let i=pending.length-1;i>=0;i--){
        const n=pending[i];
        if(Math.hypot(n.x-seed.x,n.z-seed.z)<=6.0){
          cluster.push(n);
          pending.splice(i,1);
        }
      }

      if(cluster.length===1){
        result.push(seed);
        continue;
      }

      const roads=[];
      for(const n of cluster){
        for(const r of n.roads||[]){
          if(!roads.some(q=>
            Math.abs(q.ax-r.ax)<.01&&Math.abs(q.az-r.az)<.01&&
            Math.abs(q.bx-r.bx)<.01&&Math.abs(q.bz-r.bz)<.01&&
            q.type===r.type
          )) roads.push(r);
        }
      }

      // Weight toward the more important / larger junction in the cluster.
      let weightSum=0,x=0,z=0;
      for(const n of cluster){
        const w=Math.max(1,n.radius);
        x+=n.x*w;z+=n.z*w;weightSum+=w;
      }
      x/=weightSum;z/=weightSum;

      const directions=[];
      for(const r of roads){
        const v=roadDirectionAtNode(r,x,z);
        if(!directions.some(d=>Math.abs(d.x*v.x+d.z*v.z)>.985)){
          directions.push(v);
        }
      }

      result.push({
        x,z,
        radius:Math.max(...cluster.map(n=>n.radius))+Math.min(2.0,(cluster.length-1)*.55),
        dirt:roads.length?roads.every(r=>r.dirt):cluster.every(n=>n.dirt),
        kind:directions.length>=4?'multi':
             directions.length===3?'tee':
             cluster.some(n=>n.kind==='tee')?'tee':'crossing',
        roads
      });
    }

    return result;
  }

  function consolidatedSurfaceJunctionsForTile(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(consolidatedJunctionCache.has(key)) return consolidatedJunctionCache.get(key);
    return boundedTileCacheSet(
      consolidatedJunctionCache,
      key,
      consolidateNearbyJunctions(collectSurfaceJunctionsForTile(tx,tz))
    );
  }


  function approachAngle(a) {
    return Math.atan2(a.v.z,a.v.x);
  }

  function sortedJunctionApproaches(node) {
    return uniqueJunctionApproaches(node)
      .slice()
      .sort((a,b)=>approachAngle(a)-approachAngle(b));
  }

  function addQuadraticTurnRibbon(group,p0,p1,control,width,color) {
    const steps=9;
    let prev=p0;
    for(let i=1;i<=steps;i++){
      const t=i/steps,u=1-t;
      const p={
        x:u*u*p0.x+2*u*t*control.x+t*t*p1.x,
        z:u*u*p0.z+2*u*t*control.z+t*t*p1.z
      };
      addFlatSurfaceStripBetween(
        group,prev.x,prev.z,p.x,p.z,
        width,color,SURFACE_ROAD_Y+.050,.015,.020
      );
      prev=p;
    }
  }

  function curvedTurningApronPlans(node) {
    if(node.dirt) return [];
    const approaches=sortedJunctionApproaches(node);
    if(approaches.length<2) return [];

    const radius=(node.kind==='multi'?node.radius+1.0:node.radius)+2.6;
    const plans=[];

    for(let i=0;i<approaches.length;i++){
      const a=approaches[i];
      const b=approaches[(i+1)%approaches.length];

      let diff=approachAngle(b)-approachAngle(a);
      if(diff<=0) diff+=Math.PI*2;
      if(diff>Math.PI*.78) continue;

      const p0={
        x:node.x+a.v.x*radius,
        z:node.z+a.v.z*radius
      };
      const p1={
        x:node.x+b.v.x*radius,
        z:node.z+b.v.z*radius
      };

      const bisX=a.v.x+b.v.x,bisZ=a.v.z+b.v.z;
      const bisLen=Math.hypot(bisX,bisZ)||1;
      const control={
        x:node.x+(bisX/bisLen)*node.radius*.42,
        z:node.z+(bisZ/bisLen)*node.radius*.42
      };

      plans.push({
        p0,p1,control,
        width:Math.max(3.2,Math.min(a.road.width,b.road.width)*.62)
      });
    }
    return plans;
  }

  function addCurvedTurningApronPlan(group,plan) {
    addQuadraticTurnRibbon(
      group,
      plan.p0,
      plan.p1,
      plan.control,
      plan.width,
      COLORS.asphalt2
    );
  }

  function addCurvedTurningAprons(group,node) {
    for(const plan of curvedTurningApronPlans(node)){
      addCurvedTurningApronPlan(group,plan);
    }
  }


  function addJunctionApproachFlare(group,node,s) {
    if(!s || s.dirt) return;

    const hit=pointSegmentDistance2D(node.x,node.z,s.ax,s.az,s.bx,s.bz);
    if(hit.distance>.75) return;

    const v=roadVectorAwayFromNode(s,node);
    const length=node.kind==='multi'?8.5:node.kind==='tee'?7.5:5.5;
    const startX=node.x+v.x*.4;
    const startZ=node.z+v.z*.4;
    const endX=node.x+v.x*length;
    const endZ=node.z+v.z*length;
    const width=Math.max(s.width,node.radius*(node.kind==='multi'?1.52:1.38));

    // Short widened throat creates a rounded, forgiving turn mouth. The
    // circular node pad supplies the actual corner radius.
    addFlatSurfaceStripBetween(
      group,startX,startZ,endX,endZ,
      width,COLORS.asphalt2,SURFACE_ROAD_Y,.02
    );
  }

  function namedRoadsAtJunction(node) {
    const byName=new Map();
    for(const r of node.roads||[]){
      const name=roadDisplayName(r);
      if(!name || r.type==='driveway' || r.dirt) continue;
      const existing=byName.get(name);
      if(!existing || roadJunctionPriority(r)>roadJunctionPriority(existing)){
        byName.set(name,r);
      }
    }
    return [...byName.entries()]
      .sort((a,b)=>roadJunctionPriority(b[1])-roadJunctionPriority(a[1]));
  }

  function makeFixedCrossStreetSign(name,arrowMode='both',scaleX=3.75) {
    const key=`${String(name).toUpperCase().slice(0,26)}|${arrowMode}|${scaleX.toFixed(2)}`;
    let asset=crossStreetSignCache.get(key);

    if(!asset){
      const c=document.createElement('canvas');
      c.width=900;c.height=220;
      const ctx=c.getContext('2d');
      ctx.fillStyle='#237447';
      ctx.fillRect(8,18,884,184);
      ctx.strokeStyle='#f4f1df';
      ctx.lineWidth=8;
      ctx.strokeRect(8,18,884,184);
      ctx.fillStyle='#fffdf0';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.font='bold 58px Arial';
      ctx.fillText(String(name).toUpperCase().slice(0,26),450,83);

      ctx.strokeStyle='#fffdf0';
      ctx.fillStyle='#fffdf0';
      ctx.lineWidth=12;
      const y=158;
      const drawLeft=arrowMode==='left'||arrowMode==='both';
      const drawRight=arrowMode==='right'||arrowMode==='both';
      ctx.beginPath();ctx.moveTo(drawLeft?270:365,y);ctx.lineTo(drawRight?630:535,y);ctx.stroke();
      if(drawLeft){
        ctx.beginPath();ctx.moveTo(270,y);ctx.lineTo(310,y-25);ctx.lineTo(310,y+25);ctx.closePath();ctx.fill();
      }
      if(drawRight){
        ctx.beginPath();ctx.moveTo(630,y);ctx.lineTo(590,y-25);ctx.lineTo(590,y+25);ctx.closePath();ctx.fill();
      }

      const tex=new THREE.CanvasTexture(c);
      tex.minFilter=THREE.LinearFilter;
      asset={
        geometry:new THREE.PlaneGeometry(scaleX,scaleX*.245),
        material:new THREE.MeshBasicMaterial({map:tex,side:THREE.FrontSide,transparent:true})
      };
      if(crossStreetSignCache.size<480) crossStreetSignCache.set(key,asset);
    }

    const mesh=new THREE.Mesh(asset.geometry,asset.material);
    mesh.userData.sharedSignAsset=true;
    return mesh;
  }

  function crossStreetDirectionsForApproach(node,approach) {
    const currentName=roadDisplayName(approach.road);
    const driving={x:-approach.v.x,z:-approach.v.z};
    const right={x:-driving.z,z:driving.x};
    const byName=new Map();

    for(const r of node.roads||[]){
      if(r.dirt||r.type==='driveway') continue;
      const name=roadDisplayName(r);
      if(!name||name===currentName) continue;
      const v=roadVectorAwayFromNode(r,node);
      // Only advertise the road being crossed/turned onto, not another nearly
      // parallel route that happens to participate in a complex node.
      if(Math.abs(v.x*driving.x+v.z*driving.z)>.72) continue;
      const side=v.x*right.x+v.z*right.z;
      const entry=byName.get(name)||{name,left:false,right:false,priority:roadJunctionPriority(r)};
      if(side<-.12) entry.left=true;
      if(side>.12) entry.right=true;
      entry.priority=Math.max(entry.priority,roadJunctionPriority(r));
      byName.set(name,entry);
    }
    return [...byName.values()].sort((a,b)=>b.priority-a.priority);
  }

  function addCrossroadNameForApproach(group,node,approach) {
    if(node.kind==='endpoint') return false;

    const cross=crossStreetDirectionsForApproach(node,approach)[0];
    if(!cross) return false;

    const v=approach.v;
    const nx=-v.z,nz=v.x;
    const distance=node.radius+10.5;
    const sx=node.x+v.x*distance+nx*(approach.road.width/2+1.65);
    const sz=node.z+v.z*distance+nz*(approach.road.width/2+1.65);
    const arrowMode=cross.left&&cross.right?'both':cross.left?'left':'right';

    const post=box(.075,2.35,.075,0x747972);
    post.position.set(sx,WORLD_FLAT_GROUND_Y+1.20,sz);
    group.add(post);

    const sign=makeFixedCrossStreetSign(cross.name,arrowMode,3.8);
    sign.position.set(sx,WORLD_FLAT_GROUND_Y+2.30,sz);
    sign.rotation.y=Math.atan2(v.x,v.z);
    group.add(sign);
    return true;
  }

  function addCrossroadNameAssembly(group,node) {
    if(node.kind==='endpoint') return;
    const approaches=uniqueJunctionApproaches(node);
    if(approaches.length<2) return;

    for(const approach of approaches){
      addCrossroadNameForApproach(group,node,approach);
    }
  }


  function makeStopSignSprite() {
    if(!stopSignMaterialCache.material){
      const c=document.createElement('canvas');
      c.width=256;c.height=256;
      const ctx=c.getContext('2d');
      ctx.translate(128,128);
      ctx.beginPath();
      for(let i=0;i<8;i++){
        const a=Math.PI/8+i*Math.PI/4;
        const x=Math.cos(a)*102,y=Math.sin(a)*102;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fillStyle='#b32622';ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=10;ctx.stroke();
      ctx.fillStyle='#fff';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold 54px Arial';
      ctx.fillText('STOP',0,5);
      const tex=new THREE.CanvasTexture(c);
      tex.minFilter=THREE.LinearFilter;
      stopSignMaterialCache.material=new THREE.MeshBasicMaterial({
        map:tex,
        side:THREE.FrontSide,
        transparent:true
      });
    }

    const mesh=new THREE.Mesh(
      new THREE.PlaneGeometry(1.35,1.35),
      stopSignMaterialCache.material
    );
    mesh.userData.sharedSignAsset=true;
    return mesh;
  }

  function uniqueJunctionApproaches(node) {
    const approaches=[];
    for(const r of node.roads||[]){
      if(r.type==='driveway'||r.dirt) continue;
      const v=roadVectorAwayFromNode(r,node);

      // Collapse collinear pieces into one approach direction.
      const existing=approaches.find(a=>a.v.x*v.x+a.v.z*v.z>.985);
      if(existing){
        if(roadJunctionPriority(r)>roadJunctionPriority(existing.road)){
          existing.road=r;
          existing.v=v;
        }
      }else{
        approaches.push({road:r,v});
      }
    }
    return approaches;
  }

  function controlledApproachesForJunction(node) {
    const approaches=uniqueJunctionApproaches(node);
    if(approaches.length<2) return [];

    if(node.kind==='tee'){
      const maxP=Math.max(...approaches.map(a=>roadJunctionPriority(a.road)));
      const ending=approaches.filter(a=>segmentEndsAtPoint(a.road,node.x,node.z));
      const preferredPool=ending.length?ending:approaches;
      const minor=preferredPool
        .slice()
        .sort((a,b)=>roadJunctionPriority(a.road)-roadJunctionPriority(b.road))[0];
      return minor && roadJunctionPriority(minor.road)<maxP ? [minor] : [];
    }

    if(node.kind==='multi'||node.kind==='crossing'){
      const priorities=approaches.map(a=>roadJunctionPriority(a.road));
      const maxP=Math.max(...priorities);
      const minP=Math.min(...priorities);

      if(maxP>minP){
        return approaches.filter(a=>roadJunctionPriority(a.road)<maxP);
      }

      // Equal-priority rural four-way: an all-way stop is more believable than
      // an uncontrolled pile of same-class county roads.
      return approaches.length>=4?approaches:[];
    }

    return [];
  }

  function addStopControlForApproach(group,node,approach) {
    const road=approach.road;
    const v=approach.v;
    const nx=-v.z,nz=v.x;

    const lineX=node.x+v.x*5.3;
    const lineZ=node.z+v.z*5.3;
    const half=Math.max(2.15,road.width*.38);
    addFlatSurfaceStripBetween(
      group,
      lineX-nx*half,lineZ-nz*half,
      lineX+nx*half,lineZ+nz*half,
      .22,COLORS.line,ROAD_MARKING_Y+.010,.01,.018
    );

    const sideX=lineX+nx*(road.width/2+1.35);
    const sideZ=lineZ+nz*(road.width/2+1.35);
    const sign=makeStopSignSprite();
    sign.position.set(sideX,WORLD_FLAT_GROUND_Y+2.35,sideZ);
    // PlaneGeometry faces +Z. approach.v points outward from the junction,
    // exactly where an approaching driver is located.
    sign.rotation.y=Math.atan2(v.x,v.z);
    group.add(sign);

    const post=box(.07,1.95,.07,0x777a72);
    post.position.set(sideX,WORLD_FLAT_GROUND_Y+1.02,sideZ);
    group.add(post);
  }

  function addStopControl(group,node) {
    for(const approach of controlledApproachesForJunction(node)){
      addStopControlForApproach(group,node,approach);
    }
  }

  let junctionSubstageCalls=0;
  let junctionSubstageCompleted=0;
  let junctionSubstageLastMs=0;
  let junctionSubstageMaxMs=0;

  function createSurfaceJunctionBuildState(node) {
    const approaches=uniqueJunctionApproaches(node);
    const pavedRoads=(node.roads||[]).filter(
      r=>!r.dirt && r.type!=='driveway'
    );
    const truckStopOnly=
      pavedRoads.length>0 &&
      pavedRoads.every(roadIsTruckStopLocal);

    let skip=false;
    if(approaches.length<2){
      skip=true;
    }else if(!truckStopOnly){
      const roadNames=new Set((node.roads||[])
        .filter(r=>!r.dirt && r.type!=='driveway')
        .map(r=>roadDisplayName(r)||r.type));

      if(roadNames.size<=1 && approaches.length===2){
        const dot=
          approaches[0].v.x*approaches[1].v.x +
          approaches[0].v.z*approaches[1].v.z;
        if(dot<-.94) skip=true;
      }
    }

    return {
      node,
      approaches,
      controlled:skip?[]:controlledApproachesForJunction(node),
      flares:skip||truckStopOnly?[]:[...(node.roads||[])],
      aprons:skip||truckStopOnly?[]:curvedTurningApronPlans(node),
      truckStopOnly,
      skip,
      phase:skip?'done':truckStopOnly?'stop':'disk',
      flareIndex:0,
      apronIndex:0,
      stopIndex:0,
      signIndex:0
    };
  }

  function processSurfaceJunctionBuildStage(group,state,maxOps=1) {
    const started=performance.now();
    const startingPhase=state.phase;
    let ops=0;

    while(state.phase!=='done' && ops<maxOps){
      if(state.phase==='disk'){
        const node=state.node;
        const color=node.dirt?COLORS.dirt:COLORS.asphalt2;
        const effectiveRadius=
          node.kind==='multi'?node.radius+1.25:node.radius;

        const disk=new THREE.Mesh(
          new THREE.CylinderGeometry(
            effectiveRadius,effectiveRadius,.018,32
          ),
          mat(color)
        );
        disk.position.set(
          node.x,
          SURFACE_ROAD_Y+.071,
          node.z
        );
        group.add(disk);

        state.phase=state.flares.length?'flare':
                    state.aprons.length?'apron':
                    state.controlled.length?'stop':
                    state.approaches.length?'cross-sign':'regional';
        ops++;
        continue;
      }

      if(state.phase==='flare'){
        addJunctionApproachFlare(
          group,
          state.node,
          state.flares[state.flareIndex++]
        );
        if(state.flareIndex>=state.flares.length){
          state.phase=state.aprons.length?'apron':
                      state.controlled.length?'stop':
                      state.approaches.length?'cross-sign':'regional';
        }
        ops++;
        continue;
      }

      if(state.phase==='apron'){
        addCurvedTurningApronPlan(
          group,
          state.aprons[state.apronIndex++]
        );
        if(state.apronIndex>=state.aprons.length){
          state.phase=state.controlled.length?'stop':
                      state.approaches.length?'cross-sign':'regional';
        }
        ops++;
        continue;
      }

      if(state.phase==='stop'){
        if(state.stopIndex<state.controlled.length){
          addStopControlForApproach(
            group,
            state.node,
            state.controlled[state.stopIndex++]
          );
          ops++;
        }
        if(state.stopIndex>=state.controlled.length){
          state.phase=state.approaches.length?'cross-sign':'regional';
        }
        continue;
      }

      if(state.phase==='cross-sign'){
        if(state.signIndex<state.approaches.length){
          addCrossroadNameForApproach(
            group,
            state.node,
            state.approaches[state.signIndex++]
          );
          ops++;
        }
        if(state.signIndex>=state.approaches.length){
          state.phase='regional';
        }
        continue;
      }

      if(state.phase==='regional'){
        addRegionalDestinationGuides(group,state.node);
        state.phase='done';
        ops++;
      }
    }

    junctionSubstageCalls++;
    const elapsed=performance.now()-started;
    if(startingPhase!=='done'){
      recordJunctionPhase(startingPhase,elapsed);
    }
    junctionSubstageLastMs=elapsed;
    junctionSubstageMaxMs=Math.max(
      junctionSubstageMaxMs,
      elapsed
    );

    const done=state.phase==='done';
    if(done) junctionSubstageCompleted++;
    return {done,elapsed,ops};
  }

  function addSurfaceJunctionPad(group,node) {
    // Synchronous compatibility wrapper. Runtime streamed tiles use the
    // incremental state machine one operation at a time.
    const state=createSurfaceJunctionBuildState(node);
    while(state.phase!=='done'){
      processSurfaceJunctionBuildStage(group,state,Infinity);
    }
  }


  function segmentMidpointOwnedByTile(s,tx,tz) {
    const mx=(s.ax+s.bx)/2;
    const mz=(s.az+s.bz)/2;
    return worldTileIndexForCoord(mx)===tx &&
           worldTileIndexForCoord(mz)===tz;
  }

  function segmentDirectionUnit(s) {
    const dx=s.bx-s.ax,dz=s.bz-s.az;
    const len=Math.hypot(dx,dz)||1;
    return {x:dx/len,z:dz/len,len};
  }

  function segmentMidpoint(s) {
    return {x:(s.ax+s.bx)/2,z:(s.az+s.bz)/2};
  }

  function segmentsNearlyCoincident(a,b) {
    if(!!a.dirt!==!!b.dirt) return false;

    const da=segmentDirectionUnit(a);
    const db=segmentDirectionUnit(b);
    const parallel=Math.abs(da.x*db.x+da.z*db.z);
    if(parallel<.997) return false;

    const ma=segmentMidpoint(a),mb=segmentMidpoint(b);
    if(Math.hypot(ma.x-mb.x,ma.z-mb.z)>2.1) return false;

    const h1=pointSegmentDistance2D(a.ax,a.az,b.ax,b.az,b.bx,b.bz);
    const h2=pointSegmentDistance2D(a.bx,a.bz,b.ax,b.az,b.bx,b.bz);
    const h3=pointSegmentDistance2D(b.ax,b.az,a.ax,a.az,a.bx,a.bz);
    const h4=pointSegmentDistance2D(b.bx,b.bz,a.ax,a.az,a.bx,a.bz);

    return Math.min(h1.distance,h2.distance)<.65 &&
           Math.min(h3.distance,h4.distance)<.65;
  }

  function preferredOverlappingSegment(a,b) {
    const pa=roadJunctionPriority(a),pb=roadJunctionPriority(b);
    if(pa!==pb) return pa>pb?a:b;

    const la=segmentDirectionUnit(a).len;
    const lb=segmentDirectionUnit(b).len;
    return la>=lb?a:b;
  }

  function _uncachedRenderableSegmentsForTile(tx,tz) {
    const raw=proceduralRoadSegmentsForTile(tx,tz);
    const keyed=new Map();

    for(const s of raw){
      // County EW/NS roads are authored exactly across this centered tile's
      // x0..x1 / z0..z1 span. Do NOT reassign those pieces by midpoint.
      //
      // Feeder roads, however, are sampled in global 48 m bins and can be
      // rediscovered by neighboring tiles, so midpoint ownership is appropriate.
      if(s.type==='interstate-feeder' &&
         !segmentMidpointOwnedByTile(s,tx,tz)){
        continue;
      }

      // Exact duplicates are type-agnostic at the pavement level.
      const a=`${s.ax.toFixed(2)},${s.az.toFixed(2)}`;
      const b=`${s.bx.toFixed(2)},${s.bz.toFixed(2)}`;
      const surface=s.dirt?'dirt':'paved';
      const key=a<b?`${a}|${b}|${surface}`:`${b}|${a}|${surface}`;

      const existing=keyed.get(key);
      if(!existing){
        keyed.set(key,s);
      }else{
        keyed.set(key,preferredOverlappingSegment(existing,s));
      }
    }

    const candidates=[...keyed.values()]
      .sort((a,b)=>roadJunctionPriority(b)-roadJunctionPriority(a));

    const out=[];
    for(const s of candidates){
      let replaced=false;
      for(let i=0;i<out.length;i++){
        if(!segmentsNearlyCoincident(s,out[i])) continue;

        const preferred=preferredOverlappingSegment(s,out[i]);
        if(preferred===s) out[i]=s;
        replaced=true;
        break;
      }
      if(!replaced) out.push(s);
    }

    return out;
  }

  function renderableSegmentsForTile(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(renderableRoadCache.has(key)) return renderableRoadCache.get(key);
    return boundedTileCacheSet(renderableRoadCache,key,_uncachedRenderableSegmentsForTile(tx,tz));
  }

  function segmentOwnedRenderKey(s) {
    const a=`${s.ax.toFixed(1)},${s.az.toFixed(1)}`;
    const b=`${s.bx.toFixed(1)},${s.bz.toFixed(1)}`;
    return a<b?`${a}|${b}|${s.dirt?'d':'p'}`:`${b}|${a}|${s.dirt?'d':'p'}`;
  }

  function roadIsRegionalBackbone(s) {
    const cls=roadClassForType(s.type,s.routeTier);
    return cls==='major-county'||cls==='county'||cls==='feeder';
  }

  function roadIsSettlementLocal(s) {
    return roadClassForType(s.type,s.routeTier)==='settlement-local';
  }

  function deterministicRoadConflictKey(s) {
    const name=roadDisplayName(s)||s.type||'road';
    const m=segmentMidpoint(s);
    return `${roadJunctionPriority(s).toString().padStart(3,'0')}|${name}|${m.x.toFixed(2)}|${m.z.toFixed(2)}`;
  }

  function shouldSuppressForCrossTileSpacing(candidate,other) {
    if(candidate.dirt||other.dirt) return false;
    if(roadIsTruckStopLocal(candidate)||roadIsTruckStopLocal(other)) return false;
    if(sameLogicalRoadSegment(candidate,other)) return false;
    if(roadDisplayName(candidate) &&
       roadDisplayName(candidate)===roadDisplayName(other)) return false;

    const cBackbone=roadIsRegionalBackbone(candidate);
    const oBackbone=roadIsRegionalBackbone(other);

    // Never suppress the persistent regional skeleton. Minor roads adapt to it.
    if(cBackbone && oBackbone) return false;

    let spacing=Math.min(
      roadSpacingMinimumForSegment(candidate),
      roadSpacingMinimumForSegment(other)
    );
    if(!(roadIsSettlementLocal(candidate)&&roadIsSettlementLocal(other))){
      spacing=Math.max(spacing,110);
    }
    if(!ruralParallelSpacingViolation(candidate,other,spacing,55)) return false;

    if(cBackbone && !oBackbone) return false;
    if(!cBackbone && oBackbone) return true;

    // Minor-vs-minor: deterministic winner independent of which tile asks.
    return deterministicRoadConflictKey(candidate) <
           deterministicRoadConflictKey(other);
  }

  function _uncachedNeighborAwareRenderableSegments(tx,tz) {
    const own=renderableSegmentsForTile(tx,tz);
    const neighbors=[];

    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        if(ox===0&&oz===0) continue;
        neighbors.push(...renderableSegmentsForTile(tx+ox,tz+oz));
      }
    }

    const result=[];
    for(const s of own){
      if(s.type==='interstate-feeder'){
        const sm=segmentMidpoint(s);
        const ownerX=worldTileIndexForCoord(sm.x);
        const ownerZ=worldTileIndexForCoord(sm.z);
        if(ownerX!==tx||ownerZ!==tz) continue;
      }

      let suppress=false;
      if(!roadIsRegionalBackbone(s) && !s.dirt){
        for(const n of neighbors){
          if(shouldSuppressForCrossTileSpacing(s,n)){
            suppress=true;
            break;
          }
        }
      }
      if(!suppress) result.push(s);
    }

    return result;
  }

  function neighborAwareRenderableSegments(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(neighborRoadCache.has(key)) return neighborRoadCache.get(key);
    return boundedTileCacheSet(neighborRoadCache,key,_uncachedNeighborAwareRenderableSegments(tx,tz));
  }

  function roadEndpointKey(x,z) {
    return `${x.toFixed(2)},${z.toFixed(2)}`;
  }

  function auditRuralParallelSpacing(tx,tz) {
    const own=neighborAwareRenderableSegments(tx,tz)
      .filter(s=>!s.dirt && s.type!=='driveway');
    const nearby=[];

    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        nearby.push(
          ...neighborAwareRenderableSegments(tx+ox,tz+oz)
            .filter(s=>!s.dirt && s.type!=='driveway')
        );
      }
    }

    const issues=[];
    const seen=new Set();

    for(const a of own){
      for(const b of nearby){
        if(sameLogicalRoadSegment(a,b)) continue;
        if(roadDisplayName(a)===roadDisplayName(b)) continue;

        const spacing=Math.min(
          roadSpacingMinimumForSegment(a),
          roadSpacingMinimumForSegment(b)
        );
        if(!ruralParallelSpacingViolation(a,b,spacing,55)) continue;

        const ka=deterministicRoadConflictKey(a);
        const kb=deterministicRoadConflictKey(b);
        const key=ka<kb?`${ka}::${kb}`:`${kb}::${ka}`;
        if(seen.has(key)) continue;
        seen.add(key);

        issues.push({
          a:roadDisplayName(a)||a.type,
          b:roadDisplayName(b)||b.type,
          spacing,
          settlementZone:spacing<100,
          tx,tz
        });
      }
    }
    return issues;
  }

  function auditUnexpectedMajorDeadEnds(tx,tz) {
    const here=renderableSegmentsForTile(tx,tz);
    const nearby=[];
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        nearby.push(...renderableSegmentsForTile(tx+ox,tz+oz));
      }
    }

    const dead=[];
    for(const s of here){
      if(!['county-east-west','county-north-south','interstate-feeder'].includes(s.type)) continue;

      for(const endpoint of [
        {x:s.ax,z:s.az},
        {x:s.bx,z:s.bz}
      ]){
        // Ignore endpoints well inside a tile if they are part of a real
        // junction; this audit is about accidental route truncation.
        const touching=nearby.filter(n=>{
          if(n===s) return false;
          if(roadDisplayName(n)!==roadDisplayName(s)) return false;
          const d=Math.min(
            Math.hypot(endpoint.x-n.ax,endpoint.z-n.az),
            Math.hypot(endpoint.x-n.bx,endpoint.z-n.bz)
          );
          return d<.20;
        });

        if(!touching.length){
          const cx=tx*WORLD_TILE_SIZE,cz=tz*WORLD_TILE_SIZE;
          const half=WORLD_TILE_SIZE/2;
          const onBoundary=
            Math.abs(Math.abs(endpoint.x-cx)-half)<.10 ||
            Math.abs(Math.abs(endpoint.z-cz)-half)<.10;

          if(onBoundary){
            dead.push({
              roadName:roadDisplayName(s),
              type:s.type,
              x:endpoint.x,z:endpoint.z
            });
          }
        }
      }
    }
    return dead;
  }

  function auditTileRoadContinuity(tx,tz) {
    const here=renderableSegmentsForTile(tx,tz);
    const neighbors=[];
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        if(ox===0&&oz===0) continue;
        neighbors.push(...renderableSegmentsForTile(tx+ox,tz+oz));
      }
    }

    let boundaryEndpoints=0;
    let matchedEndpoints=0;
    const half=WORLD_TILE_SIZE/2;
    const cx=tx*WORLD_TILE_SIZE,cz=tz*WORLD_TILE_SIZE;
    const minX=cx-half,maxX=cx+half,minZ=cz-half,maxZ=cz+half;

    const nearBoundary=(x,z)=>
      Math.abs(x-minX)<.05||Math.abs(x-maxX)<.05||
      Math.abs(z-minZ)<.05||Math.abs(z-maxZ)<.05;

    for(const s of here){
      if(!['county-east-west','county-north-south','interstate-feeder'].includes(s.type)) continue;
      for(const [x,z] of [[s.ax,s.az],[s.bx,s.bz]]){
        if(!nearBoundary(x,z)) continue;
        boundaryEndpoints++;

        const name=roadDisplayName(s);
        const mate=neighbors.some(n=>{
          if(roadDisplayName(n)!==name) return false;
          return Math.min(
            Math.hypot(x-n.ax,z-n.az),
            Math.hypot(x-n.bx,z-n.bz)
          )<.15;
        });
        if(mate) matchedEndpoints++;
      }
    }

    return {boundaryEndpoints,matchedEndpoints};
  }

  function boundaryRouteNodesForTile(tx,tz,segments) {
    const half=WORLD_TILE_SIZE/2;
    const cx=tx*WORLD_TILE_SIZE,cz=tz*WORLD_TILE_SIZE;
    const minX=cx-half,maxX=cx+half,minZ=cz-half,maxZ=cz+half;
    const nodes=new Map();

    const nearBoundary=(x,z)=>
      Math.abs(x-minX)<.35||Math.abs(x-maxX)<.35||
      Math.abs(z-minZ)<.35||Math.abs(z-maxZ)<.35;

    for(const s of segments){
      if(!['county-east-west','county-north-south','interstate-feeder'].includes(s.type)) continue;
      for(const [x,z] of [[s.ax,s.az],[s.bx,s.bz]]){
        if(!nearBoundary(x,z)) continue;
        const key=`${x.toFixed(2)},${z.toFixed(2)}`;
        const prev=nodes.get(key);
        nodes.set(key,{
          x,z,
          radius:Math.max(prev?.radius||0,s.width*.54),
          dirt:false
        });
      }
    }
    return [...nodes.values()];
  }

  function addBoundaryRouteSeamCap(group,node) {
    // Deprecated in v0.6.2. Exact route strips provide their own continuity.
    return;
  }

  function makeRoadNameSprite(name) {
    return makeTextSprite([name],3.5,.95,false);
  }

  function addRegionalDistanceBoard(group,tx,tz,segments) {
    // Disabled in-world in v0.6.2 pending corridor-level deduplication.
    return;
    // Roughly one board every several tiles, with deterministic spacing.
    if(hash2D(tx,tz,920)>.055) return;
    if(positiveTileMod(tx+tz*2,5)!==0) return;

    const candidates=segments.filter(s=>{
      const cls=roadClassForType(s.type,s.routeTier);
      return (cls==='major-county'||cls==='feeder'||cls==='county') &&
        roadDisplayName(s) && !s.dirt;
    });
    if(!candidates.length) return;

    const s=candidates[Math.floor(hash2D(tx,tz,921)*candidates.length)];
    const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2;
    if(Math.abs(localRoadX(mx,mz))<130) return;

    const dx=s.bx-s.ax,dz=s.bz-s.az;
    const len=Math.hypot(dx,dz)||1;
    const dirs=[
      {v:{x:dx/len,z:dz/len}},
      {v:{x:-dx/len,z:-dz/len}}
    ];

    let best=null;
    for(const d of dirs){
      const fake={road:s,v:d.v};
      const found=nearestHamletAlongApproach({x:mx,z:mz},fake,4200);
      if(found && (!best||found.distance<best.distance)) best={...found,v:d.v};
    }
    if(!best) return;
    if(best.distance<520) return;

    const nx=-best.v.z,nz=best.v.x;
    const side=hash2D(tx,tz,922)<.5?-1:1;
    const x=mx+nx*side*(s.width/2+2.2);
    const z=mz+nz*side*(s.width/2+2.2);

    const sign=makeRegionalDestinationSprite(
      best.hamlet.name,best.distance,best.roadName
    );
    sign.position.set(x,WORLD_FLAT_GROUND_Y+3.0,z);
    group.add(sign);

    const post=box(.08,2.35,.08,0x777a72);
    post.position.set(x,WORLD_FLAT_GROUND_Y+1.20,z);
    group.add(post);
  }

  function addSparseRoadNameSigns(group,tx,tz,segments) {
    // Disabled: a roadside sign should not repeatedly announce the road the
    // player is already driving on. Cross-street signs at actual junctions own
    // road-name guidance now.
    return;
    const candidates=segments.filter(s=>{
      const cls=roadClassForType(s.type,s.routeTier);
      return (cls==='major-county'||cls==='county'||cls==='feeder') && roadDisplayName(s);
    });
    if(!candidates.length) return;

    // Roughly one route-name sign every few tiles, deterministic.
    if(hash2D(tx,tz,610)>.34) return;

    const s=candidates[Math.floor(hash2D(tx,tz,611)*candidates.length)];
    const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2;
    if(Math.abs(localRoadX(mx,mz))<90) return;

    const dx=s.bx-s.ax,dz=s.bz-s.az;
    const len=Math.hypot(dx,dz)||1;
    const nx=-dz/len,nz=dx/len;
    const side=hash2D(tx,tz,612)<.5?-1:1;
    const x=mx+nx*side*(s.width/2+2.0);
    const z=mz+nz*side*(s.width/2+2.0);

    const sign=makeRoadNameSprite(roadDisplayName(s));
    sign.position.set(x,WORLD_FLAT_GROUND_Y+2.05,z);
    group.add(sign);

    const post=box(.065,1.65,.065,0x777a72);
    post.position.set(x,WORLD_FLAT_GROUND_Y+.84,z+.02);
    group.add(post);
  }

  function beginProceduralTileRoadBuild(group,tx,tz) {
    if(group.userData.roadBuildState) return group.userData.roadBuildState;

    const state={
      tx,tz,
      phase:'segments',
      segments:neighborAwareRenderableSegments(tx,tz),
      segmentIndex:0,
      junctions:null,
      junctionIndex:0,
      junctionWork:null,
      startedAt:performance.now(),
      accumulatedMs:0
    };
    group.userData.roadMarkingBatch={yellow:[],white:[]};
    group.userData.roadBuildState=state;
    return state;
  }

  function finishProceduralTileRoadSigns(group,state) {
    const {tx,tz,segments}=state;

    addSparseRoadNameSigns(group,tx,tz,segments);
    addRegionalDistanceBoard(group,tx,tz,segments);

    const feeder=segments.filter(s=>s.type==='interstate-feeder' && s.crossing);
    if(feeder.length){
      const f=feeder[Math.floor(feeder.length/2)];
      const mx=(f.ax+f.bx)/2,mz=(f.az+f.bz)/2;
      const dx=f.bx-f.ax,dz=f.bz-f.az;
      const freewayDistance=Math.abs(localRoadX(mx,mz));
      const signBand=Math.floor(freewayDistance/WORLD_TILE_SIZE);
      if(signBand>=2 && positiveTileMod(signBand,3)===0 && hash2D(tx,tz,250)<.62){
        addInterstateDirectionSign(group,mx,mz,dx,dz);
      }
    }
  }

  function processProceduralTileRoadBuildStage(group,tx,tz,maxSegments=5,maxJunctions=1) {
    const started=performance.now();
    const state=beginProceduralTileRoadBuild(group,tx,tz);

    if(state.phase==='segments'){
      const phaseStarted=performance.now();
      let processed=0;
      while(state.segmentIndex<state.segments.length && processed<maxSegments){
        const s=state.segments[state.segmentIndex++];
        if(s.dirt){
          addWorldDirtRoadSegment(group,s.ax,s.az,s.bx,s.bz,s.width);
        }else{
          addWorldPavedRoadSegment(
            group,s.ax,s.az,s.bx,s.bz,
            s.width,s.type,s.routeTier
          );
        }
        processed++;
      }
      if(state.segmentIndex>=state.segments.length){
        state.phase='markings';
      }
      recordRoadBuildPhase('segments',performance.now()-phaseStarted);
    }

    if(state.phase==='markings'){
      const phaseStarted=performance.now();
      // At most two InstancedMeshes (yellow + white). Keep this as its own
      // stage instead of coupling it to all road strips in the same frame.
      flushRoadMarkingBatch(group);
      state.phase='junctions';
      state.junctions=consolidatedSurfaceJunctionsForTile(tx,tz);
      state.junctionIndex=0;
      recordRoadBuildPhase('markings',performance.now()-phaseStarted);
    }

    if(state.phase==='junctions'){
      const phaseStarted=performance.now();
      let processed=0;

      while(state.junctionIndex<state.junctions.length &&
            processed<maxJunctions){
        if(!state.junctionWork){
          state.junctionWork=createSurfaceJunctionBuildState(
            state.junctions[state.junctionIndex]
          );
        }

        const result=processSurfaceJunctionBuildStage(
          group,
          state.junctionWork,
          1
        );
        processed++;

        if(result.done){
          state.junctionIndex++;
          state.junctionWork=null;
        }
      }

      if(state.junctionIndex>=state.junctions.length){
        state.phase='signs';
      }
      recordRoadBuildPhase('junctions',performance.now()-phaseStarted);
    }

    if(state.phase==='signs'){
      const phaseStarted=performance.now();
      finishProceduralTileRoadSigns(group,state);
      state.phase='done';
      recordRoadBuildPhase('signs',performance.now()-phaseStarted);
    }

    const elapsed=performance.now()-started;
    state.accumulatedMs+=elapsed;
    const done=state.phase==='done';

    if(done){
      group.userData.roadBuildMs=state.accumulatedMs;
      delete group.userData.roadBuildState;
    }

    return {done,elapsed};
  }

  function addProceduralTileRoads(group,tx,tz) {
    // Synchronous wrapper retained for startup, teleport, and the immediate
    // safety neighborhood. Runtime outer tiles use the staged processor.
    let result={done:false,elapsed:0};
    while(!result.done){
      result=processProceduralTileRoadBuildStage(group,tx,tz,Infinity,Infinity);
    }
    return group.userData.roadBuildMs||0;
  }


  function roadNameSeed(name) {
    let h=2166136261;
    for(let i=0;i<(name||'').length;i++){
      h^=(name.charCodeAt(i)&255);
      h=Math.imul(h,16777619);
    }
    return (h>>>0)/4294967295;
  }

  function corridorDevelopmentScore(site) {
    const cls=roadClassForType(site?.road?.type,site?.road?.routeTier);
    let score=roadNameSeed(site?.roadName);
    if(cls==='major-county'||cls==='feeder') score+=.26;
    if(site?.type==='gas'||site?.type==='store') score+=.12;
    return THREE.MathUtils.clamp(score,0,1);
  }

  const countrysideDevelopmentBatchMaterials=new Map();

  function queueCountrysideDevelopmentBox(group,x,y,z,w,h,d,color,rotationY=0) {
    const batches=group.userData?.developmentBoxBatches;
    if(!batches) return false;
    const key=String(color);
    if(!batches.has(key)) batches.set(key,{color,items:[]});
    batches.get(key).items.push({x,y,z,w,h,d,rotationY});
    return true;
  }

  function addCountrysideDevelopmentBox(group,x,y,z,w,h,d,color,rotationY=0) {
    if(queueCountrysideDevelopmentBox(group,x,y,z,w,h,d,color,rotationY)) return null;
    const mesh=box(w,h,d,color);
    mesh.position.set(x,y,z);
    mesh.rotation.y=rotationY;
    group.add(mesh);
    return mesh;
  }

  function flushCountrysideDevelopmentBatches(group,maxBatches=Infinity) {
    const batches=group.userData?.developmentBoxBatches;
    if(!batches) return {done:true,processed:0};

    const dummy=new THREE.Object3D();
    let processed=0;

    for(const [key,batch] of [...batches.entries()]){
      if(processed>=maxBatches) break;
      batches.delete(key);
      const {color,items}=batch;
      if(!items.length) continue;

      let material=countrysideDevelopmentBatchMaterials.get(color);
      if(!material){
        material=mat(color);
        countrysideDevelopmentBatchMaterials.set(color,material);
      }

      const mesh=new THREE.InstancedMesh(instancedUnitBoxGeo,material,items.length);
      mesh.userData.sharedGeometry=true;

      items.forEach((p,i)=>{
        dummy.position.set(p.x,p.y,p.z);
        dummy.rotation.set(0,p.rotationY,0);
        dummy.scale.set(p.w,p.h,p.d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      group.add(mesh);
      processed++;
    }

    const done=batches.size===0;
    if(done) delete group.userData.developmentBoxBatches;
    return {done,processed};
  }

  function addRouteCorridorCompanions(group,site) {
    const score=corridorDevelopmentScore(site);
    if(score<.55) return;

    const count=score>.82?2:1;
    const y=WORLD_FLAT_GROUND_Y;
    for(let i=0;i<count;i++){
      const along=(i===0?1:-1)*(34+hash2D(site.tx,site.tz,700+i)*34);
      const opposite=(hash2D(site.tx,site.tz,710+i)<.34)?-1:1;
      const sideN=opposite<0?-site.nx:site.nx;
      const sideZ=opposite<0?-site.nz:site.nz;
      const setback=16+hash2D(site.tx,site.tz,720+i)*12;
      const cx=site.rx+site.ux*along+sideN*setback;
      const cz=site.rz+site.uz*along+sideZ*setback;

      // Skip anything too close to the freeway or any non-host road.
      if(Math.abs(localRoadX(cx,cz))<95) continue;
      if(!parcelClearOfOtherRoads(cx,cz,8.5,site.tx,site.tz,site.road,3.5)) continue;

      const bw=7.5+hash2D(site.tx,site.tz,730+i)*4.5;
      const bh=2.8+hash2D(site.tx,site.tz,740+i)*1.0;
      const bd=7.5+hash2D(site.tx,site.tz,750+i)*4.0;
      const bc=hash2D(site.tx,site.tz,760+i)<.5?0x806b55:0x7b705f;
      const brot=Math.atan2(site.ux,site.uz);

      addCountrysideDevelopmentBox(
        group,cx,y+bh/2,cz,bw,bh,bd,bc,brot
      );
      addCountrysideDevelopmentBox(
        group,cx,y+bh+.18,cz,bw+1.0,.36,bd+1.0,0x514b43,brot
      );

      // Short access connection back toward the named host route.
      const roadX=site.rx+site.ux*along;
      const roadZ=site.rz+site.uz*along;
      addWorldPavedRoadSegment(
        group,roadX,roadZ,
        cx-sideN*4.2,cz-sideZ*4.2,
        roadWidthForType('driveway'),
        'driveway','driveway'
      );
    }
  }

  function deterministicHamletName(tx,tz) {
    const a=angloA[Math.floor(hash2D(tx,tz,801)*angloA.length)];
    const b=angloB[Math.floor(hash2D(tx,tz,802)*angloB.length)];
    const style=hash2D(tx,tz,803);
    if(style<.34) return `${a} ${b}`;
    if(style<.67) return `${a} Crossing`;
    return `${a} Grove`;
  }

  const hamletTileCache=new Map();
  function hamletTileCacheKey(tx,tz) { return `${tx},${tz}`; }

  function hamletForTile(tx,tz) {
    const cacheKey=hamletTileCacheKey(tx,tz);
    if(hamletTileCache.has(cacheKey)) return hamletTileCache.get(cacheKey);

    // Hamlets are tied to REAL named-road junctions, not arbitrary scenery.
    const nodes=consolidatedSurfaceJunctionsForTile(tx,tz);
    const viable=nodes.filter(node=>{
      if(Math.abs(localRoadX(node.x,node.z))<180) return false;
      const named=namedRoadsAtJunction(node);
      if(named.length<2) return false;

      const classes=named.map(([,r])=>roadClassForType(r.type,r.routeTier));
      const hasImportant=classes.some(c=>
        c==='major-county'||c==='feeder'||c==='county'||c==='settlement-local'
      );
      return hasImportant && (node.kind==='tee'||node.kind==='multi'||node.kind==='crossing');
    });
    if(!viable.length){
      hamletTileCache.set(cacheKey,null);
      trimHamletCache();
      return null;
    }

    // About one in five eligible crossroad tiles becomes a tiny settlement.
    // This is the same deterministic predicate used by road spacing.
    if(!hamletCandidateTile(tx,tz)){
      hamletTileCache.set(cacheKey,null);
      trimHamletCache();
      return null;
    }

    const node=viable[Math.floor(hash2D(tx,tz,805)*viable.length)];
    const roads=namedRoadsAtJunction(node);
    const hamlet={
      tx,tz,
      x:node.x,z:node.z,
      node,
      name:deterministicHamletName(tx,tz),
      roads:roads.slice(0,2).map(([name,r])=>({name,road:r})),
      scale:.85+hash2D(tx,tz,806)*.35
    };
    hamletTileCache.set(cacheKey,hamlet);
    trimHamletCache();
    return hamlet;
  }

  function trimHamletCache(maxEntries=TILE_CACHE_LIMIT) {
    if(hamletTileCache.size<=maxEntries) return;
    const removeCount=hamletTileCache.size-maxEntries;
    let removed=0;
    for(const key of hamletTileCache.keys()){
      hamletTileCache.delete(key);
      removed++;
      if(removed>=removeCount) break;
    }
  }

  function regionalHamletsAround(x,z,tileRadius=8) {
    const tx=worldTileIndexForCoord(x);
    const tz=worldTileIndexForCoord(z);
    const out=[];
    const seen=new Set();

    for(let oz=-tileRadius;oz<=tileRadius;oz++){
      for(let ox=-tileRadius;ox<=tileRadius;ox++){
        const h=hamletForTile(tx+ox,tz+oz);
        if(!h) continue;
        const key=`${h.tx},${h.tz}`;
        if(seen.has(key)) continue;
        seen.add(key);
        out.push(h);
      }
    }
    return out;
  }

  function hamletUsesRoadName(hamlet,roadName) {
    if(!hamlet||!roadName) return false;
    return (hamlet.roads||[]).some(r=>r.name===roadName);
  }

  function nearestHamletAlongApproach(node,approach,maxDistance=3200) {
    const roadName=roadDisplayName(approach?.road);
    if(!roadName) return null;

    let best=null;
    const step=Math.max(WORLD_TILE_SIZE*.9,240);
    const seenTiles=new Set();

    // Scan only a thin corridor in front of the sign. v0.6.0/0.6.1 searched a
    // full 21x21 tile square from every rendered junction, which multiplied
    // into thousands of expensive junction reconstructions during startup.
    for(let dist=step;dist<=maxDistance;dist+=step){
      const cx=node.x+approach.v.x*dist;
      const cz=node.z+approach.v.z*dist;
      const tx=worldTileIndexForCoord(cx);
      const tz=worldTileIndexForCoord(cz);

      // Check the sampled tile plus immediate side neighbors so curved routes
      // and slightly offset hamlets are still found.
      for(let oz=-1;oz<=1;oz++){
        for(let ox=-1;ox<=1;ox++){
          const k=`${tx+ox},${tz+oz}`;
          if(seenTiles.has(k)) continue;
          seenTiles.add(k);

          const h=hamletForTile(tx+ox,tz+oz);
          if(!h || !hamletUsesRoadName(h,roadName)) continue;

          const dx=h.x-node.x,dz=h.z-node.z;
          const distance=Math.hypot(dx,dz);
          if(distance<260||distance>maxDistance) continue;

          const dot=(dx*approach.v.x+dz*approach.v.z)/Math.max(1,distance);
          if(dot<.72) continue;

          const cls=roadClassForType(approach.road.type,approach.road.routeTier);
          const corridorBonus=(cls==='major-county'||cls==='feeder')?260:
                              cls==='county'?120:0;
          const ideal=1450;
          const rangePenalty=Math.abs(distance-ideal)*.22;
          const directionBonus=dot*220;
          const score=distance+rangePenalty-directionBonus-corridorBonus;

          if(!best||score<best.score){
            best={hamlet:h,distance,roadName,dot,score};
          }
        }
      }
    }
    return best;
  }

  function makeRegionalDestinationSprite(name,distanceMeters,roadName) {
    const c=document.createElement('canvas');
    c.width=900;c.height=300;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1a6138';
    ctx.fillRect(8,8,884,284);
    ctx.strokeStyle='#fff';
    ctx.lineWidth=9;
    ctx.strokeRect(8,8,884,284);

    ctx.fillStyle='#fffdf0';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 58px Arial';
    ctx.fillText(String(name).toUpperCase().slice(0,28),450,72);

    const miles=distanceMeters/1609.344;
    ctx.font='bold 44px Arial';
    ctx.fillText(`${miles<1?miles.toFixed(1):miles.toFixed(1)} MI`,450,145);

    ctx.font='bold 34px Arial';
    ctx.fillText(`VIA ${String(roadName).toUpperCase().slice(0,30)}`,450,207);

    // Straight-ahead arrow because the board is placed only on the outgoing
    // approach that actually leads toward the destination.
    ctx.lineWidth=18;
    ctx.beginPath();
    ctx.moveTo(450,274);ctx.lineTo(450,235);ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(450,229);
    ctx.lineTo(425,252);ctx.lineTo(475,252);
    ctx.closePath();ctx.fill();

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(5.1,1.72,1);
    return spr;
  }

  function addRegionalDestinationGuides(group,node) {
    // Disabled in-world in v0.6.2. Re-enable only after corridor-level
    // destination ownership/deduplication exists.
    return;
    if(node.dirt) return;

    // Destination boards are intentionally selective. Cross-street signs and
    // stop controls already make busy junctions visually dense.
    const tileX=worldTileIndexForCoord(node.x);
    const tileZ=worldTileIndexForCoord(node.z);
    if(hash2D(tileX,tileZ,945)>.16) return;

    const approaches=uniqueJunctionApproaches(node)
      .filter(a=>roadDisplayName(a.road)&&!a.road.dirt)
      .sort((a,b)=>roadJunctionPriority(b.road)-roadJunctionPriority(a.road));

    const usedDestinations=new Set();
    let placed=0;

    for(const approach of approaches){
      if(placed>=1) break;
      const found=nearestHamletAlongApproach(node,approach,3200);
      if(!found) continue;

      const key=`${found.hamlet.tx},${found.hamlet.tz}`;
      if(usedDestinations.has(key)) continue;
      usedDestinations.add(key);

      const v=approach.v;
      const nx=-v.z,nz=v.x;
      const side=placed%2===0?1:-1;
      const distFromNode=node.radius+12+placed*4;
      const x=node.x+v.x*distFromNode+nx*side*(approach.road.width/2+2.0);
      const z=node.z+v.z*distFromNode+nz*side*(approach.road.width/2+2.0);

      const sign=makeRegionalDestinationSprite(
        found.hamlet.name,
        found.distance,
        found.roadName
      );
      sign.position.set(x,WORLD_FLAT_GROUND_Y+3.05,z);
      group.add(sign);

      const post=box(.08,2.45,.08,0x777a72);
      post.position.set(x,WORLD_FLAT_GROUND_Y+1.25,z);
      group.add(post);

      placed++;
    }
  }

  function makeHamletDirectionSprite(name,arrow='RIGHT') {
    const c=document.createElement('canvas');
    c.width=768;c.height=250;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1a6138';
    ctx.fillRect(8,8,752,234);
    ctx.strokeStyle='#fff';
    ctx.lineWidth=8;
    ctx.strokeRect(8,8,752,234);
    ctx.fillStyle='#fffdf0';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font='bold 52px Arial';
    ctx.fillText(String(name).toUpperCase().slice(0,25),384,82);
    ctx.font='bold 40px Arial';
    ctx.fillText('HAMLET',384,145);

    ctx.strokeStyle='#fff';
    ctx.fillStyle='#fff';
    ctx.lineWidth=16;
    const right=arrow!=='LEFT';
    const y=202;
    if(right){
      ctx.beginPath();ctx.moveTo(285,y);ctx.lineTo(455,y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(455,y);ctx.lineTo(420,y-28);ctx.lineTo(420,y+28);ctx.closePath();ctx.fill();
    }else{
      ctx.beginPath();ctx.moveTo(483,y);ctx.lineTo(313,y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(313,y);ctx.lineTo(348,y-28);ctx.lineTo(348,y+28);ctx.closePath();ctx.fill();
    }

    const tex=new THREE.CanvasTexture(c);
    tex.minFilter=THREE.LinearFilter;
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex,depthWrite:false,transparent:true
    }));
    spr.scale.set(4.4,1.45,1);
    return spr;
  }

  function addHamletApproachSigns(group,hamlet) {
    const approaches=uniqueJunctionApproaches(hamlet.node)
      .filter(a=>roadDisplayName(a.road) && !a.road.dirt)
      .slice(0,1);

    for(let i=0;i<approaches.length;i++){
      const a=approaches[i];
      const v=a.v;
      const nx=-v.z,nz=v.x;
      const dist=33+i*4;
      const side=(i%2===0)?1:-1;
      const x=hamlet.x+v.x*dist+nx*side*(a.road.width/2+1.9);
      const z=hamlet.z+v.z*dist+nz*side*(a.road.width/2+1.9);

      const sign=makeHamletDirectionSprite(
        hamlet.name,
        side>0?'RIGHT':'LEFT'
      );
      sign.position.set(x,WORLD_FLAT_GROUND_Y+2.75,z);
      group.add(sign);

      const post=box(.075,2.15,.075,0x777a72);
      post.position.set(x,WORLD_FLAT_GROUND_Y+1.10,z);
      group.add(post);
    }
  }

  function addHamletBuilding(group,x,z,rot,seed,commercial=false) {
    const y=WORLD_FLAT_GROUND_Y;
    const w=commercial?10.5:6.5+seed*2.8;
    const d=commercial?8.5:7.0+seed*3.5;
    const h=commercial?3.4:2.7+seed*.9;

    addCountrysideDevelopmentBox(
      group,x,y+h/2,z,w,h,d,
      commercial?0x8b745d:(seed>.5?0x7b6754:0x86725c),
      rot
    );
    addCountrysideDevelopmentBox(
      group,x,y+h+.20,z,w+1.0,.38,d+1.0,0x50483f,rot
    );
  }

  function addHamletGeometry(group,tx,tz) {
    if(!sceneryEnabled || settings.sceneryDensity<=0) return;
    const h=hamletForTile(tx,tz);
    if(!h) return;

    const approaches=uniqueJunctionApproaches(h.node)
      .filter(a=>!a.road.dirt && a.road.type!=='driveway');
    if(approaches.length<2) return;

    const primary=approaches[0];
    const ux=primary.v.x,uz=primary.v.z;
    const nx=-uz,nz=ux;
    const rot=Math.atan2(ux,uz);

    // A hamlet is deliberately tiny: 4-7 low buildings around the crossroads,
    // with open countryside immediately outside it.
    const count=4+Math.floor(hash2D(tx,tz,820)*4);
    for(let i=0;i<count;i++){
      const along=((i%4)-1.5)*(14+hash2D(tx,tz,821+i)*5);
      const side=(i%2===0)?1:-1;
      const setback=17+hash2D(tx,tz,841+i)*10;
      const x=h.x+ux*along+nx*side*setback;
      const z=h.z+uz*along+nz*side*setback;

      if(Math.abs(localRoadX(x,z))<115) continue;

      const roadHit=nearbyProceduralRoadDistance(x,z,tx,tz,null);
      if(roadHit && roadHit.edgeDistance<9.0) continue;

      addHamletBuilding(
        group,x,z,rot,
        hash2D(tx,tz,860+i),
        i===0||i===3
      );

      // Short property access toward the primary named road.
      const rx=h.x+ux*along;
      const rz=h.z+uz*along;
      addWorldPavedRoadSegment(
        group,rx,rz,
        x-nx*side*4.5,z-nz*side*4.5,
        roadWidthForType('driveway'),
        'driveway','driveway'
      );
    }

    // Settlement identity sign at the crossroads itself.
    const label=makeTextSprite([h.name,'UNINCORPORATED'],4.3,1.45,false);
    const lx=h.x+nx*(h.node.radius+5.5);
    const lz=h.z+nz*(h.node.radius+5.5);
    label.position.set(lx,WORLD_FLAT_GROUND_Y+2.85,lz);
    group.add(label);

    const post=box(.08,2.25,.08,0x777a72);
    post.position.set(lx,WORLD_FLAT_GROUND_Y+1.15,lz);
    group.add(post);

    addHamletApproachSigns(group,h);
  }

  function roadsideSiteDisplayName(site) {
    if(!site) return null;
    const base=site.roadName || 'County Road';
    if(site.type==='gas') return `${base} Service`;
    if(site.type==='store') return `${base} Market`;
    if(site.type==='farm') return `${base} Farm`;
    return `${base} Shops`;
  }

  function sameLogicalRoadSegment(a,b) {
    if(!a||!b) return false;
    if(a===b) return true;
    const sameForward=
      Math.hypot(a.ax-b.ax,a.az-b.az)<.05 &&
      Math.hypot(a.bx-b.bx,a.bz-b.bz)<.05;
    const sameReverse=
      Math.hypot(a.ax-b.bx,a.az-b.bz)<.05 &&
      Math.hypot(a.bx-b.ax,a.bz-b.az)<.05;
    return (sameForward||sameReverse) &&
      roadDisplayName(a)===roadDisplayName(b);
  }

  function nearbyProceduralRoadDistance(x,z,tx=null,tz=null,ignoreSegment=null) {
    const baseTx=tx??worldTileIndexForCoord(x);
    const baseTz=tz??worldTileIndexForCoord(z);
    let best=null;

    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        for(const s of proceduralRoadSegmentsForTile(baseTx+ox,baseTz+oz)){
          if(ignoreSegment && sameLogicalRoadSegment(s,ignoreSegment)) continue;
          const hit=pointSegmentDistance2D(x,z,s.ax,s.az,s.bx,s.bz);
          const edgeDistance=hit.distance-(s.width||6)/2;
          if(!best||edgeDistance<best.edgeDistance){
            best={edgeDistance,centerDistance:hit.distance,segment:s,hit};
          }
        }
      }
    }
    return best;
  }

  function parcelClearOfOtherRoads(x,z,halfExtent,tx,tz,hostRoad=null,extra=3.0) {
    const hit=nearbyProceduralRoadDistance(x,z,tx,tz,hostRoad);
    return !hit || hit.edgeDistance>halfExtent+extra;
  }

  function _uncachedRoadsideSiteForTile(tx,tz) {
    // Development remains sparse, but major named routes are somewhat more
    // likely to attract services/farms than minor county roads.
    const roads=proceduralRoadSegmentsForTile(tx,tz).filter(s=>{
      const cls=roadClassForType(s.type,s.routeTier);
      return !s.dirt &&
        (cls==='major-county'||cls==='county'||cls==='feeder') &&
        roadDisplayName(s) &&
        Math.abs(localRoadX((s.ax+s.bx)/2,(s.az+s.bz)/2))>150;
    });
    if(!roads.length) return null;

    const majorHere=roads.some(s=>{
      const cls=roadClassForType(s.type,s.routeTier);
      return cls==='major-county'||cls==='feeder';
    });
    const chanceLimit=majorHere ? .34 : .22;
    if(hash2D(tx,tz,300)>chanceLimit) return null;

    // If a tile contains a major route, actually prefer it rather than merely
    // using it to raise the development probability.
    const preferred=majorHere
      ? roads.filter(s=>{
          const cls=roadClassForType(s.type,s.routeTier);
          return cls==='major-county'||cls==='feeder';
        })
      : roads;
    const roadPool=preferred.length?preferred:roads;
    const road=roadPool[Math.floor(hash2D(tx,tz,301)*roadPool.length)];

    const t=.30+hash2D(tx,tz,302)*.40;
    const rx=THREE.MathUtils.lerp(road.ax,road.bx,t);
    const rz=THREE.MathUtils.lerp(road.az,road.bz,t);
    const dx=road.bx-road.ax,dz=road.bz-road.az;
    const len=Math.hypot(dx,dz)||1;
    const ux=dx/len,uz=dz/len;
    const side=hash2D(tx,tz,303)<.5?-1:1;
    const nx=(-uz)*side,nz=ux*side;
    const setback=18+hash2D(tx,tz,304)*16;
    const sx=rx+nx*setback;
    const sz=rz+nz*setback;

    // A developed parcel must not be sitting on some OTHER road. The host road
    // is intentionally ignored because the driveway connects back to it.
    const parcelHalf=16;
    if(!parcelClearOfOtherRoads(sx,sz,parcelHalf,tx,tz,road,4.0)) return null;

    const typeRoll=hash2D(tx,tz,305);
    const roadCls=roadClassForType(road.type,road.routeTier);
    const developed=roadCls==='major-county'||roadCls==='feeder';
    const type=developed
      ? (typeRoll<.30?'farm':typeRoll<.58?'store':typeRoll<.82?'gas':'cluster')
      : (typeRoll<.58?'farm':typeRoll<.77?'store':typeRoll<.90?'gas':'cluster');

    return {
      tx,tz,type,road,rx,rz,sx,sz,ux,uz,nx,nz,setback,side,
      roadName:roadDisplayName(road),
      name:null
    };
  }

  function roadsideSiteForTile(tx,tz) {
    const key=tileCacheKey(tx,tz);
    if(roadsideSiteCache.has(key)) return roadsideSiteCache.get(key);

    const plan=tilePlanCache.get(key);
    if(plan){
      tilePlanCacheHits++;
      return boundedTileCacheSet(roadsideSiteCache,key,plan.site||null);
    }

    tilePlanFallbacks++;
    return boundedTileCacheSet(roadsideSiteCache,key,_uncachedRoadsideSiteForTile(tx,tz));
  }

  function roadsideDrivewaySegmentsForTile(tx,tz) {
    const site=roadsideSiteForTile(tx,tz);
    if(!site) return [];
    // Start on the host road CENTERLINE. The visual junction pad below widens
    // the mouth, avoiding a driveway strip that merely butts into the road edge.
    const ax=site.rx;
    const az=site.rz;
    const bx=site.sx-site.nx*5.0;
    const bz=site.sz-site.nz*5.0;
    return [segmentRecord(
      ax,az,bx,bz,
      roadWidthForType('driveway'),
      'driveway',
      {roadName:site.roadName?`${site.roadName} Access`:null,routeTier:'driveway'}
    )];
  }

  function addRoadsideDriveway(group,site) {
    const d=roadsideDrivewaySegmentsForTile(site.tx,site.tz)[0];
    if(!d) return;
    addWorldPavedRoadSegment(group,d.ax,d.az,d.bx,d.bz,d.width,d.type,d.routeTier);

    // The tile-level junction system owns the driveway mouth when the driveway
    // meets another generated road. Avoid stacking a second coplanar disk here.
    // Small apron/parking pad at the property end.
    const y=SURFACE_ROAD_Y+.005;
    const pad=box(
      site.type==='farm'?12:site.type==='cluster'?22:18,
      .08,
      site.type==='farm'?10:14,
      COLORS.asphalt2
    );
    pad.position.set(site.sx,y,site.sz);
    pad.rotation.y=Math.atan2(site.ux,site.uz);
    group.add(pad);
  }

  function addRoadsideStore(group,site) {
    const y=terrainYAt(site.sx,site.sz);
    const rot=Math.atan2(site.ux,site.uz);
    addCountrysideDevelopmentBox(
      group,site.sx,y+1.7,site.sz,10.5,3.4,8.0,0x8d785c,rot
    );
    addCountrysideDevelopmentBox(
      group,site.sx,y+3.58,site.sz,11.4,.45,8.9,0x50483e,rot
    );

    const sign=makeTextSprite(['COUNTRY STORE'],3.0,1.05,false);
    sign.position.set(
      site.sx-site.nx*5.8,
      y+3.25,
      site.sz-site.nz*5.8
    );
    group.add(sign);
  }

  function addRoadsideGasStation(group,site) {
    const y=terrainYAt(site.sx,site.sz);
    const rot=Math.atan2(site.ux,site.uz);

    addCountrysideDevelopmentBox(
      group,
      site.sx+site.nx*5.5,y+1.6,site.sz+site.nz*5.5,
      9.5,3.2,7.0,0x85745f,rot
    );
    addCountrysideDevelopmentBox(
      group,
      site.sx-site.nx*3.8,y+3.4,site.sz-site.nz*3.8,
      13.5,.45,8.5,0xe0ddd0,rot
    );

    for(const off of [-3.1,3.1]){
      const px=site.sx-site.nx*3.8+site.ux*off;
      const pz=site.sz-site.nz*3.8+site.uz*off;
      addCountrysideDevelopmentBox(
        group,px,y+.70,pz,.75,1.35,.65,0xb9b4a5,rot
      );
    }

    const px=site.rx+site.nx*6.6;
    const pz=site.rz+site.nz*6.6;
    addCountrysideDevelopmentBox(
      group,px,y+2.25,pz,.12,4.5,.12,0x777a72,0
    );
    const price=makeTextSprite(['GAS'],1.6,.9,false);
    price.position.set(px,y+4.45,pz);
    group.add(price);
  }

  function addRoadsideFarm(group,site) {
    const y=terrainYAt(site.sx,site.sz);
    const rot=Math.atan2(site.ux,site.uz);

    addCountrysideDevelopmentBox(
      group,site.sx,y+2.1,site.sz,10.5,4.2,13.0,0x774332,rot
    );

    const roof=new THREE.Mesh(
      proceduralPyramidRoofGeo,
      mat(0x4e4037)
    );
    roof.rotation.y=rot+Math.PI/4;
    roof.scale.set(9.1,3.0,9.1*1.28);
    roof.position.set(site.sx,y+5.0,site.sz);
    roof.userData.sharedGeometry=true;
    group.add(roof);

    const siloX=site.sx+site.ux*11+site.nx*5;
    const siloZ=site.sz+site.uz*11+site.nz*5;
    const silo=new THREE.Mesh(
      roadsideSiloGeo,
      mat(0x9b978a)
    );
    silo.scale.set(2.6,8.5,2.6);
    silo.position.set(siloX,terrainYAt(siloX,siloZ)+4.25,siloZ);
    silo.userData.sharedGeometry=true;
    group.add(silo);

    // Short fence line around the property: one instanced draw instead of five.
    const fencePosts=new THREE.InstancedMesh(
      instancedUnitBoxGeo,
      mat(0x5c4933),
      5
    );
    fencePosts.userData.sharedGeometry=true;
    const fenceDummy=new THREE.Object3D();
    for(let i=-2;i<=2;i++){
      const fx=site.sx+site.ux*i*6+site.nx*9;
      const fz=site.sz+site.uz*i*6+site.nz*9;
      fenceDummy.position.set(fx,terrainYAt(fx,fz)+.52,fz);
      fenceDummy.rotation.set(0,0,0);
      fenceDummy.scale.set(.12,1.05,.12);
      fenceDummy.updateMatrix();
      fencePosts.setMatrixAt(i+2,fenceDummy.matrix);
    }
    fencePosts.instanceMatrix.needsUpdate=true;
    group.add(fencePosts);
  }

  function addRoadsideCluster(group,site) {
    const y=terrainYAt(site.sx,site.sz);
    for(let i=-1;i<=1;i++){
      const bx=site.sx+site.ux*i*10;
      const bz=site.sz+site.uz*i*10;
      addCountrysideDevelopmentBox(
        group,bx,terrainYAt(bx,bz)+1.5,bz,
        7.0+Math.abs(i)*1.5,3.0,7.5,
        i===0?0x806b55:0x75614d,
        Math.atan2(site.ux,site.uz)
      );
    }
  }

  function addRoadsideDestinationDevelopment(group,tx,tz) {
    if(!sceneryEnabled || settings.sceneryDensity<=0) return;
    const site=roadsideSiteForTile(tx,tz);
    if(!site) return;

    addRoadsideDriveway(group,site);

    if(site.type==='farm') addRoadsideFarm(group,site);
    else if(site.type==='store') addRoadsideStore(group,site);
    else if(site.type==='gas') addRoadsideGasStation(group,site);
    else addRoadsideCluster(group,site);

    addRouteCorridorCompanions(group,site);
  }

  function addRoadsideDestinationVegetation(group,tx,tz) {
    if(!sceneryEnabled || settings.sceneryDensity<=0) return;
    const site=roadsideSiteForTile(tx,tz);
    if(!site) return;

    const plan=tilePlanCache.get(tileCacheKey(tx,tz));
    const plannedTrees=plan?.manifest?.siteTrees;
    if(plannedTrees){
      for(const p of plannedTrees){
        addProceduralTileTree(group,p.x,p.z,p.seed);
      }
      return;
    }

    // Synchronous fallback preserves the exact legacy deterministic placement.
    const count=2+Math.floor(hash2D(tx,tz,320)*4);
    for(let i=0;i<count;i++){
      const along=(hash2D(tx,tz,321+i*2)-.5)*28;
      const lateral=10+hash2D(tx,tz,322+i*2)*15;
      const x=site.sx+site.ux*along+site.nx*lateral;
      const z=site.sz+site.uz*along+site.nz*lateral;
      addProceduralTileTree(group,x,z,hash2D(tx,tz,340+i));
    }
  }

  function makeWorldTileGeometry(tx,tz) {
    const half = WORLD_TILE_SIZE/2;
    const cx = tx*WORLD_TILE_SIZE;
    const cz = tz*WORLD_TILE_SIZE;
    const z0=cz-half,z1=cz+half;
    const y=WORLD_FLAT_GROUND_Y;

    // Entire procedural countryside uses one flat world datum.
    const verts=new Float32Array([
      cx-half,y,z0, cx+half,y,z0,
      cx-half,y,z1, cx+half,y,z1
    ]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.BufferAttribute(verts,3));
    geom.setIndex([0,2,1,1,2,3]);
    geom.computeVertexNormals();
    return geom;
  }

  function worldTileColor(tx,tz) {
    const r = hash2D(tx,tz,7);
    if(r < .18) return COLORS.dirt;
    if(r < .52) return COLORS.dryGrass;
    if(r < .80) return COLORS.olive;
    return COLORS.field;
  }

  function farEnoughFromInterstate(x,z,margin=48) {
    return Math.abs(localRoadX(x,z)) > margin;
  }

  function addProceduralTileTree(group,x,z,seed) {
    if(group.userData.treeBatch){
      group.userData.treeBatch.push({x,z,seed,y:terrainYAt(x,z)});
      return;
    }

    const y=terrainYAt(x,z);
    const trunk=box(.20,1.25,.20,0x5b4630);
    trunk.position.set(x,y+.62,z);
    group.add(trunk);

    const radius=.75+seed*.45;
    const crown=new THREE.Mesh(
      proceduralTreeCrownGeo,
      mat(seed>.55 ? 0x596d40 : 0x617247)
    );
    crown.position.set(x,y+1.65,z);
    crown.scale.set(radius,radius*(.78+seed*.38),radius);
    crown.userData.sharedGeometry=true;
    group.add(crown);
  }

  function flushProceduralTreeBatch(group,maxParts=Infinity) {
    const batch=group.userData.treeBatch||[];
    if(!batch.length){
      delete group.userData.treeBatch;
      delete group.userData.treeBatchFinalizeState;
      return {done:true,processed:0};
    }

    let state=group.userData.treeBatchFinalizeState;
    if(!state){
      state={
        stage:0,
        dark:batch.filter(p=>p.seed<=.55),
        bright:batch.filter(p=>p.seed>.55)
      };
      group.userData.treeBatchFinalizeState=state;
    }

    const dummy=new THREE.Object3D();
    let processed=0;

    while(state.stage<3 && processed<maxParts){
      if(state.stage===0){
        const trunkKey='.20|1.25|.20';
        if(!boxGeoCache.has(trunkKey)){
          boxGeoCache.set(trunkKey,new THREE.BoxGeometry(.20,1.25,.20));
        }
        const trunkMesh=new THREE.InstancedMesh(
          boxGeoCache.get(trunkKey),
          mat(0x5b4630),
          batch.length
        );
        for(let i=0;i<batch.length;i++){
          const p=batch[i];
          dummy.position.set(p.x,p.y+.62,p.z);
          dummy.rotation.set(0,0,0);
          dummy.scale.set(1,1,1);
          dummy.updateMatrix();
          trunkMesh.setMatrixAt(i,dummy.matrix);
        }
        trunkMesh.instanceMatrix.needsUpdate=true;
        group.add(trunkMesh);
        state.stage=1;
        processed++;
        continue;
      }

      const members=state.stage===1 ? state.dark : state.bright;
      const color=state.stage===1 ? 0x617247 : 0x596d40;
      if(members.length){
        const crowns=new THREE.InstancedMesh(
          proceduralTreeCrownGeo,
          mat(color),
          members.length
        );
        crowns.userData.sharedGeometry=true;
        members.forEach((p,i)=>{
          const r=.75+p.seed*.45;
          dummy.position.set(p.x,p.y+1.65,p.z);
          dummy.rotation.set(0,0,0);
          dummy.scale.set(r,r*(.78+p.seed*.38),r);
          dummy.updateMatrix();
          crowns.setMatrixAt(i,dummy.matrix);
        });
        crowns.instanceMatrix.needsUpdate=true;
        group.add(crowns);
      }
      state.stage++;
      processed++;
    }

    const done=state.stage>=3;
    if(done){
      delete group.userData.treeBatch;
      delete group.userData.treeBatchFinalizeState;
    }
    return {done,processed};
  }

  function addProceduralTileBuilding(group,x,z,seed) {
    const y=terrainYAt(x,z);
    const w=5.5+seed*4.5;
    const d=7.5+hash2D(Math.floor(x),Math.floor(z),19)*6;
    const h=3.0+hash2D(Math.floor(x),Math.floor(z),23)*2.2;
    addCountrysideDevelopmentBox(
      group,x,y+h/2,z,w,h,d,seed>.5 ? 0x72523a : 0x806148,0
    );

    // Cheap low-poly roof.
    const roofScale=Math.max(w,d)*.70;
    const roof=new THREE.Mesh(
      proceduralPyramidRoofGeo,
      mat(0x4e433a)
    );
    roof.rotation.y=Math.PI/4;
    roof.scale.set(roofScale,1.8,roofScale*(d/w));
    roof.position.set(x,y+h+.75,z);
    roof.userData.sharedGeometry=true;
    group.add(roof);
  }

  function pointClearOfRoadsAndSite(x,z,tx,tz,clearance=8) {
    if(insideTruckStopDevelopmentZone(x,z,6)) return false;
    const nearRoad=nearbyProceduralRoadDistance(x,z,tx,tz,null);
    if(nearRoad && nearRoad.edgeDistance<clearance) return false;

    const site=roadsideSiteForTile(tx,tz);
    if(site && Math.hypot(x-site.sx,z-site.sz)<clearance+22) return false;
    return true;
  }

  function truckStopObjectOwnedByTile(x,z,tx,tz) {
    return worldTileIndexForCoord(x)===tx &&
           worldTileIndexForCoord(z)===tz;
  }

  function makeTruckStopFixedSign(text,w=3.2,h=1.25,bg='#f2eee0',fg='#242424') {
    const display=String(text).toUpperCase().slice(0,24);
    const key=`${display}|${w}|${h}|${bg}|${fg}`;
    let asset=truckStopSignCache.get(key);

    if(!asset){
      const c=document.createElement('canvas');
      c.width=640;c.height=250;
      const ctx=c.getContext('2d');
      ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle='#242424';ctx.lineWidth=8;ctx.strokeRect(5,5,c.width-10,c.height-10);
      ctx.fillStyle=fg;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold 52px Arial';
      ctx.fillText(display,320,125);
      const tex=new THREE.CanvasTexture(c);
      tex.minFilter=THREE.LinearFilter;
      asset={
        geometry:new THREE.PlaneGeometry(w,h),
        material:new THREE.MeshBasicMaterial({map:tex,side:THREE.FrontSide,transparent:false})
      };
      truckStopSignCache.set(key,asset);
    }

    const mesh=new THREE.Mesh(asset.geometry,asset.material);
    mesh.userData.sharedSignAsset=true;
    return mesh;
  }

  function addTruckStopFixedSign(group,lx,lz,text,tx,tz,rotOffset=0,w=3.2,h=1.25) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    const post=box(.08,1.9,.08,0x777a72);
    post.position.set(p.x,SURFACE_ROAD_Y+.95,p.z);
    group.add(post);

    const sign=makeTruckStopFixedSign(text,w,h);
    sign.position.set(p.x,SURFACE_ROAD_Y+2.15,p.z);
    sign.rotation.y=roadHeadingAtZ(p.z)+rotOffset;
    group.add(sign);
  }

  const truckStopStaticBatchMaterials=new Map();

  function queueTruckStopStaticBox(group,x,y,z,w,h,d,color,rotationY=0) {
    const batches=group.userData?.truckStopStaticBoxBatches;
    if(!batches) return false;
    const key=String(color);
    if(!batches.has(key)) batches.set(key,{color,items:[]});
    batches.get(key).items.push({x,y,z,w,h,d,rotationY});
    return true;
  }

  function addTruckStopStaticBox(group,x,y,z,w,h,d,color,rotationY=0) {
    if(queueTruckStopStaticBox(group,x,y,z,w,h,d,color,rotationY)) return null;
    const mesh=box(w,h,d,color);
    mesh.position.set(x,y,z);
    mesh.rotation.y=rotationY;
    group.add(mesh);
    return mesh;
  }

  function flushTruckStopStaticBoxBatches(group) {
    const batches=group.userData?.truckStopStaticBoxBatches;
    if(!batches) return;

    const dummy=new THREE.Object3D();
    for(const {color,items} of batches.values()){
      if(!items.length) continue;

      let material=truckStopStaticBatchMaterials.get(color);
      if(!material){
        material=mat(color);
        truckStopStaticBatchMaterials.set(color,material);
      }

      const mesh=new THREE.InstancedMesh(
        instancedUnitBoxGeo,
        material,
        items.length
      );
      mesh.userData.sharedGeometry=true;

      items.forEach((p,i)=>{
        dummy.position.set(p.x,p.y,p.z);
        dummy.rotation.set(0,p.rotationY,0);
        dummy.scale.set(p.w,p.h,p.d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      group.add(mesh);
    }

    delete group.userData.truckStopStaticBoxBatches;
  }

  const parkedVehicleBatchMaterial=new THREE.MeshLambertMaterial({color:0xffffff});
  const parkedVehicleWheelMaterial=mat(0x1b1b1b);

  function addTruckStopMarkingSegment(group,ax,az,bx,bz,width,color,height=.014) {
    const batch=group.userData?.truckStopMarkingBatch;
    if(batch){
      const key=color===COLORS.yellow?'yellow':'white';
      batch[key].push({ax,az,bx,bz,width,height});
      return;
    }
    addFlatSurfaceStripBetween(
      group,ax,az,bx,bz,width,color,ROAD_MARKING_Y,.018,height
    );
  }

  function flushTruckStopMarkingBatch(group) {
    const batch=group.userData?.truckStopMarkingBatch;
    if(!batch) return;

    const dummy=new THREE.Object3D();
    for(const [key,color] of [['white',COLORS.line],['yellow',COLORS.yellow]]){
      const items=batch[key];
      if(!items.length) continue;

      const mesh=new THREE.InstancedMesh(
        instancedUnitBoxGeo,
        mat(color),
        items.length
      );
      mesh.userData.sharedGeometry=true;

      items.forEach((s,i)=>{
        const dx=s.bx-s.ax,dz=s.bz-s.az;
        const len=Math.hypot(dx,dz);
        dummy.position.set((s.ax+s.bx)/2,ROAD_MARKING_Y,(s.az+s.bz)/2);
        dummy.rotation.set(0,Math.atan2(dx,dz),0);
        dummy.scale.set(s.width,s.height,len+.018);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      group.add(mesh);
    }

    delete group.userData.truckStopMarkingBatch;
  }

  function flushTruckStopCurbBatch(group) {
    const items=group.userData?.truckStopCurbBatch||[];
    if(!items.length){
      delete group.userData.truckStopCurbBatch;
      return;
    }

    const mesh=new THREE.InstancedMesh(
      instancedUnitBoxGeo,
      mat(0x99978d),
      items.length
    );
    mesh.userData.sharedGeometry=true;
    const dummy=new THREE.Object3D();

    items.forEach((s,i)=>{
      const dx=s.bx-s.ax,dz=s.bz-s.az;
      const len=Math.hypot(dx,dz);
      dummy.position.set(
        (s.ax+s.bx)/2,
        SURFACE_ROAD_Y+s.height/2+.055,
        (s.az+s.bz)/2
      );
      dummy.rotation.set(0,Math.atan2(dx,dz),0);
      dummy.scale.set(s.width,s.height,len);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    group.add(mesh);

    delete group.userData.truckStopCurbBatch;
  }

  function parkedVehicleDimensions(type='sedan') {
    let w=1.72,h=.62,d=3.7,cabH=.63,cabD=1.8;
    if(type==='pickup'){d=4.2;cabD=1.65;}
    if(type==='van'){w=1.9;h=.9;d=4.2;cabH=.8;cabD=2.3;}
    if(type==='box'){w=2.15;h=.85;d=5.3;cabH=.85;cabD=1.6;}
    if(type==='semi'){w=2.35;h=.95;d=8.8;cabH=1.15;cabD=1.8;}
    return {w,h,d,cabH,cabD};
  }

  function queueParkedVehiclePart(list,x,y,z,heading,sx,sy,sz,color) {
    list.push({x,y,z,heading,sx,sy,sz,color});
  }

  function queueParkedVehicle(group,p,type,heading,scale,lx,lz) {
    const batch=group.userData?.parkedVehicleBatch;
    if(!batch) return false;

    const {w,h,d,cabH,cabD}=parkedVehicleDimensions(type);
    const colorIndex=Math.floor(hash2D(Math.round(lx),Math.round(lz),971)*vehicleBodyColors.length);
    const c=vehicleBodyColors[colorIndex%vehicleBodyColors.length];
    const cos=Math.cos(heading),sin=Math.sin(heading);

    function offset(localX,localY,localZ){
      return {
        x:p.x+(localX*cos+localZ*sin)*scale,
        y:SURFACE_ROAD_Y+.05+localY*scale,
        z:p.z+(-localX*sin+localZ*cos)*scale
      };
    }

    let q=offset(0,.5,0);
    queueParkedVehiclePart(batch.body,q.x,q.y,q.z,heading,w*scale,h*scale,d*scale,shade(c,.88));

    q=offset(0,.92,type==='pickup'?-d*.19:-.15);
    queueParkedVehiclePart(batch.upper,q.x,q.y,q.z,heading,w*.87*scale,cabH*scale,cabD*scale,shade(c,1.08));

    if(type==='pickup'){
      q=offset(0,.68,d*.22);
      queueParkedVehiclePart(batch.accessory,q.x,q.y,q.z,heading,w*.9*scale,.35*scale,d*.42*scale,shade(c,.74));
    }
    if(type==='box'||type==='semi'){
      const cargoH=type==='semi'?1.6:1.8;
      const cargoD=type==='semi'?5.5:3.3;
      q=offset(0,1.35,type==='semi'?1.45:.9);
      queueParkedVehiclePart(batch.accessory,q.x,q.y,q.z,heading,w*.98*scale,cargoH*scale,cargoD*scale,shade(c,1.02));
    }

    for(const sx of [-1,1]){
      for(const sz of [-1,1]){
        q=offset(sx*w*.48,.32,sz*d*.31);
        batch.wheels.push({x:q.x,y:q.y,z:q.z,heading,scale});
      }
    }
    return true;
  }

  function flushParkedVehiclePartBatch(group,items) {
    if(!items.length) return;

    const mesh=new THREE.InstancedMesh(
      instancedUnitBoxGeo,
      parkedVehicleBatchMaterial,
      items.length
    );
    mesh.userData.sharedGeometry=true;
    const dummy=new THREE.Object3D();

    items.forEach((p,i)=>{
      dummy.position.set(p.x,p.y,p.z);
      dummy.rotation.set(0,p.heading,0);
      dummy.scale.set(p.sx,p.sy,p.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      mesh.setColorAt(i,new THREE.Color(p.color));
    });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    group.add(mesh);
  }

  function flushParkedVehicleBatch(group) {
    const batch=group.userData?.parkedVehicleBatch;
    if(!batch) return;

    flushParkedVehiclePartBatch(group,batch.body);
    flushParkedVehiclePartBatch(group,batch.upper);
    flushParkedVehiclePartBatch(group,batch.accessory);

    if(batch.wheels.length){
      const wheels=new THREE.InstancedMesh(
        wheelGeo,
        parkedVehicleWheelMaterial,
        batch.wheels.length
      );
      wheels.userData.sharedGeometry=true;
      const dummy=new THREE.Object3D();
      batch.wheels.forEach((p,i)=>{
        dummy.position.set(p.x,p.y,p.z);
        dummy.rotation.set(0,p.heading,0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        wheels.setMatrixAt(i,dummy.matrix);
      });
      wheels.instanceMatrix.needsUpdate=true;
      group.add(wheels);
    }

    delete group.userData.parkedVehicleBatch;
  }

  function addTruckStopCurbSegment(group,lx0,lz0,lx1,lz1,tx,tz,width=.32,height=.18) {
    const a=truckStopWorldPoint(lx0,lz0);
    const b=truckStopWorldPoint(lx1,lz1);
    const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
    if(!truckStopObjectOwnedByTile(mx,mz,tx,tz)) return;

    const dx=b.x-a.x,dz=b.z-a.z;
    const len=Math.hypot(dx,dz);
    if(len<.25) return;

    if(group.userData?.truckStopCurbBatch){
      group.userData.truckStopCurbBatch.push({
        ax:a.x,az:a.z,bx:b.x,bz:b.z,width,height
      });
      return;
    }

    const curb=box(width,height,len,0x99978d);
    curb.position.set(mx,SURFACE_ROAD_Y+height/2+.055,mz);
    curb.rotation.y=Math.atan2(dx,dz);
    group.add(curb);
  }

  function addTruckStopLotEdgeCurbs(group,lx,lz,w,d,tx,tz,openSide='south') {
    const x0=lx-w/2,x1=lx+w/2,z0=lz-d/2,z1=lz+d/2;
    if(openSide!=='north') addTruckStopCurbSegment(group,x0,z0,x1,z0,tx,tz);
    if(openSide!=='south') addTruckStopCurbSegment(group,x0,z1,x1,z1,tx,tz);
    if(openSide!=='west') addTruckStopCurbSegment(group,x0,z0,x0,z1,tx,tz);
    if(openSide!=='east') addTruckStopCurbSegment(group,x1,z0,x1,z1,tx,tz);
  }

  function addTruckStopLandscapeIsland(group,lx,lz,w,d,tx,tz) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    const rot=roadHeadingAtZ(p.z);
    addTruckStopStaticBox(
      group,p.x,SURFACE_ROAD_Y+.10,p.z,
      w,.12,d,0x8f8d82,rot
    );
    addTruckStopStaticBox(
      group,p.x,SURFACE_ROAD_Y+.20,p.z,
      Math.max(.4,w-.55),.08,Math.max(.4,d-.55),COLORS.dryGrass,rot
    );
  }

  function addTruckStopThresholdBars(group,lx,lz,tx,tz,halfWidth=2.4) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    for(const zOff of [-.42,.42]){
      const a=truckStopWorldPoint(lx-halfWidth,lz+zOff);
      const b=truckStopWorldPoint(lx+halfWidth,lz+zOff);
      addTruckStopMarkingSegment(
        group,a.x,a.z,b.x,b.z,.16,COLORS.line,.012
      );
    }
  }

  function addTruckStopPad(group,lx,lz,w,d,tx,tz,color=COLORS.asphalt2) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;
    addTruckStopStaticBox(
      group,p.x,SURFACE_ROAD_Y+.015,p.z,
      w,.07,d,color,roadHeadingAtZ(p.z)
    );
  }

  function addTruckStopBuilding(group,lx,lz,w,d,h,color,label,tx,tz) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    const rot=roadHeadingAtZ(p.z);
    addTruckStopStaticBox(
      group,p.x,SURFACE_ROAD_Y+h/2,p.z,
      w,h,d,color,rot
    );
    addTruckStopStaticBox(
      group,p.x,SURFACE_ROAD_Y+h+.21,p.z,
      w+1,.42,d+1,0x4f4a43,rot
    );

    const sign=makeTextSprite([label],Math.max(2.7,Math.min(5.0,w*.30)),1.05,false);
    sign.position.set(p.x,SURFACE_ROAD_Y+h+1.0,p.z-d*.56);
    group.add(sign);
  }

  function addTruckStopFuel(group,tx,tz) {
    addTruckStopPad(group,220,92,24,27,tx,tz);
    addTruckStopLotEdgeCurbs(group,220,92,24,27,tx,tz,'west');
    addTruckStopLandscapeIsland(group,232,106,4.5,2.0,tx,tz);
    const p=truckStopWorldPoint(220,92);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    addTruckStopStaticBox(
      group,p.x,SURFACE_ROAD_Y+4.15,p.z,
      22,.55,12,0xe1ded0,roadHeadingAtZ(p.z)
    );

    for(const lx of [214,220,226]){
      const q=truckStopWorldPoint(lx,92);
      addTruckStopStaticBox(
        group,q.x,SURFACE_ROAD_Y+.73,q.z,
        .85,1.45,.72,0xb8b3a6,roadHeadingAtZ(q.z)
      );
    }

    // Fuel-lane guides.
    for(const lx of [211,217,223,229]){
      const a=truckStopWorldPoint(lx,80);
      const b=truckStopWorldPoint(lx,104);
      addTruckStopMarkingSegment(
        group,a.x,a.z,b.x,b.z,.08,COLORS.line,.014
      );
    }

    addTruckStopFixedSign(group,205,70,'FUEL →',tx,tz,0,3.0,1.05);
  }

  function addTruckStopServiceBays(group,tx,tz) {
    // Concrete/asphalt apron stays clear of Truck Court; building sits behind it.
    addTruckStopPad(group,286,145,22,18,tx,tz,0x3a3b38);
    addTruckStopLotEdgeCurbs(group,286,145,22,18,tx,tz,'west');

    const base=truckStopWorldPoint(294,145);
    if(!truckStopObjectOwnedByTile(base.x,base.z,tx,tz)) return;

    // Three dark bay doors on the side facing the apron.
    for(const zOff of [-4.1,0,4.1]){
      const p=truckStopWorldPoint(285.6,145+zOff);
      addTruckStopStaticBox(
        group,p.x,SURFACE_ROAD_Y+1.45,p.z,
        .30,2.65,3.2,0x272a29,roadHeadingAtZ(p.z)
      );
    }

    addTruckStopFixedSign(group,279,134,'SERVICE BAYS →',tx,tz,0,3.5,1.0);
  }

  function addTruckStopTruckParking(group,tx,tz) {
    addTruckStopPad(group,255,151,92,42,tx,tz);

    // Two rows of long truck spaces, split by a broad circulation aisle.
    for(const zBand of [140,162]){
      for(let i=0;i<8;i++){
        const lx=216+i*11;
        const m=truckStopWorldPoint(lx,zBand);
        if(!truckStopObjectOwnedByTile(m.x,m.z,tx,tz)) continue;
        const a=truckStopWorldPoint(lx,zBand-8);
        const b=truckStopWorldPoint(lx,zBand+8);
        addTruckStopMarkingSegment(
          group,a.x,a.z,b.x,b.z,.10,COLORS.line,.016
        );
      }
    }

    // Center guide through the truck court.
    const c0=truckStopWorldPoint(214,151);
    const c1=truckStopWorldPoint(296,151);
    for(let i=0;i<8;i++){
      const t0=i/8;
      const t1=Math.min(1,t0+.055);
      const a={
        x:THREE.MathUtils.lerp(c0.x,c1.x,t0),
        z:THREE.MathUtils.lerp(c0.z,c1.z,t0)
      };
      const b={
        x:THREE.MathUtils.lerp(c0.x,c1.x,t1),
        z:THREE.MathUtils.lerp(c0.z,c1.z,t1)
      };
      addTruckStopMarkingSegment(
        group,a.x,a.z,b.x,b.z,.09,COLORS.yellow,.014
      );
    }

    // Curbs only on the outer parking edges; circulation-road connections stay open.
    addTruckStopCurbSegment(group,211,130,299,130,tx,tz,.34,.16);
    addTruckStopCurbSegment(group,211,172,299,172,tx,tz,.34,.16);
    addTruckStopFixedSign(group,211,132,'TRUCK PARKING',tx,tz,0,3.8,1.05);
  }

  function addTruckStopDirectionalArrow(group,lx,lz,localHeading,tx,tz) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    const angle=roadHeadingAtZ(p.z)+localHeading;
    const ux=Math.sin(angle),uz=Math.cos(angle);
    const nx=Math.cos(angle),nz=-Math.sin(angle);

    const tailA={x:p.x-ux*1.35,z:p.z-uz*1.35};
    const tailB={x:p.x+ux*.75,z:p.z+uz*.75};
    addTruckStopMarkingSegment(
      group,tailA.x,tailA.z,tailB.x,tailB.z,
      .16,COLORS.line,.012
    );

    const tip={x:p.x+ux*1.65,z:p.z+uz*1.65};
    const wingL={x:p.x+ux*.55+nx*.72,z:p.z+uz*.55+nz*.72};
    const wingR={x:p.x+ux*.55-nx*.72,z:p.z+uz*.55-nz*.72};
    addTruckStopMarkingSegment(
      group,wingL.x,wingL.z,tip.x,tip.z,
      .15,COLORS.line,.012
    );
    addTruckStopMarkingSegment(
      group,wingR.x,wingR.z,tip.x,tip.z,
      .15,COLORS.line,.012
    );
  }

  function addTruckStopDriveThruMarkings(group,tx,tz) {
    // Roadhouse: east, then north, then west.
    addTruckStopDirectionalArrow(group,280,78,Math.PI/2,tx,tz);
    addTruckStopDirectionalArrow(group,292,89,0,tx,tz);
    addTruckStopDirectionalArrow(group,281,100,-Math.PI/2,tx,tz);

    // Chicken & Biscuits: west, then north, then east back to Restaurant Row.
    addTruckStopDirectionalArrow(group,258,108,-Math.PI/2,tx,tz);
    addTruckStopDirectionalArrow(group,246,118,0,tx,tz);
    addTruckStopDirectionalArrow(group,258,126,Math.PI/2,tx,tz);
  }

  function addTruckStopCarParkingLines(group,lx0,lz0,count,spacing,depth,tx,tz) {
    for(let i=0;i<count;i++){
      const lx=lx0+i*spacing;
      const m=truckStopWorldPoint(lx,lz0);
      if(!truckStopObjectOwnedByTile(m.x,m.z,tx,tz)) continue;
      const a=truckStopWorldPoint(lx,lz0-depth/2);
      const b=truckStopWorldPoint(lx,lz0+depth/2);
      addTruckStopMarkingSegment(
        group,a.x,a.z,b.x,b.z,.07,COLORS.line,.012
      );
    }
  }

  function addTruckStopParkedVehicle(group,lx,lz,type,localHeading,tx,tz,scale=1) {
    const p=truckStopWorldPoint(lx,lz);
    if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) return;

    const heading=roadHeadingAtZ(p.z)+localHeading;
    if(queueParkedVehicle(group,p,type,heading,scale,lx,lz)) return;

    const v=makeVehicle(type);
    v.position.set(p.x,SURFACE_ROAD_Y+.05,p.z);
    v.rotation.y=heading;
    v.scale.setScalar(scale);
    group.add(v);
  }

  function addTruckStopStorefrontDetails(group,tx,tz) {
    // Travel mart front windows / doors.
    for(const lx of [228,233,238,243]){
      const p=truckStopWorldPoint(lx,74.7);
      if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) continue;
      addTruckStopStaticBox(
        group,p.x,SURFACE_ROAD_Y+1.45,p.z,
        3.3,1.55,.18,0x45616b,roadHeadingAtZ(p.z)
      );
    }

    const doorP=truckStopWorldPoint(235.5,74.55);
    if(truckStopObjectOwnedByTile(doorP.x,doorP.z,tx,tz)){
      addTruckStopStaticBox(
        group,doorP.x,SURFACE_ROAD_Y+1.12,doorP.z,
        1.6,2.15,.20,0x303c40,roadHeadingAtZ(doorP.z)
      );
    }

    // Restaurant order boards / menu boxes, fixed in world space.
    addTruckStopFixedSign(group,291,84,'ORDER HERE',tx,tz,Math.PI/2,2.4,.95);
    addTruckStopFixedSign(group,249,115,'ORDER HERE',tx,tz,-Math.PI/2,2.4,.95);

    // Fuel canopy supports and small price-board blocks.
    for(const lx of [210,230]){
      for(const lz of [87,97]){
        const p=truckStopWorldPoint(lx,lz);
        if(!truckStopObjectOwnedByTile(p.x,p.z,tx,tz)) continue;
        addTruckStopStaticBox(
          group,p.x,SURFACE_ROAD_Y+1.83,p.z,
          .24,3.65,.24,0xd1cec1,0
        );
      }
    }

    const diesel=truckStopWorldPoint(207,108);
    if(truckStopObjectOwnedByTile(diesel.x,diesel.z,tx,tz)){
      addTruckStopStaticBox(
        group,diesel.x,SURFACE_ROAD_Y+.38,diesel.z,
        2.5,.70,.70,0xc8a63f,roadHeadingAtZ(diesel.z)
      );
    }
  }

  function addTruckStopParkedVehicles(group,tx,tz) {
    // Cars / pickups near the mart, restaurants, and motel.
    const cars=[
      [226,77,'sedan',0],
      [236,77,'pickup',0],
      [242,77,'compact',0],
      [278,84,'sedan',0],
      [286,84,'compact',0],
      [252,112,'pickup',Math.PI],
      [260,112,'sedan',Math.PI],
      [329,84,'wagon',0],
      [339,84,'sedan',0],
      [344,103,'van',Math.PI]
    ];
    for(const [lx,lz,type,h] of cars){
      addTruckStopParkedVehicle(group,lx,lz,type,h,tx,tz,.93);
    }

    // Long-haul rigs in the truck court.
    const trucks=[
      [220,140,'semi',0],
      [242,140,'semi',0],
      [275,140,'semi',0],
      [231,162,'semi',Math.PI],
      [264,162,'semi',Math.PI],
      [286,162,'box',Math.PI]
    ];
    for(const [lx,lz,type,h] of trucks){
      addTruckStopParkedVehicle(group,lx,lz,type,h,tx,tz,1.0);
    }

    // A service pickup waiting outside the repair bays.
    addTruckStopParkedVehicle(group,282,146,'pickup',Math.PI/2,tx,tz,.96);
  }

  function addTruckStopScenery(group,tx,tz) {
    group.userData.truckStopCurbBatch=[];
    group.userData.truckStopMarkingBatch={white:[],yellow:[]};
    group.userData.truckStopStaticBoxBatches=new Map();
    group.userData.parkedVehicleBatch={
      body:[],upper:[],accessory:[],wheels:[]
    };

    // Travel-mart lot is deliberately separated from Fuel Lane.
    addTruckStopPad(group,235,82,32,22,tx,tz);
    addTruckStopLotEdgeCurbs(group,235,82,32,22,tx,tz,'south');
    addTruckStopBuilding(group,235,82,23,14,4.1,0x806f58,'TRAVEL MART',tx,tz);

    addTruckStopFuel(group,tx,tz);

    // Restaurant lots stop at the edge of Restaurant Row instead of overlaying it.
    addTruckStopPad(group,282,89,20,21,tx,tz);
    addTruckStopLotEdgeCurbs(group,282,89,20,21,tx,tz,'west');
    addTruckStopBuilding(group,282,89,13,10,3.8,0x8a624e,'ROADHOUSE GRILL',tx,tz);
    addTruckStopFixedSign(group,289,74,'DRIVE THRU →',tx,tz,0,3.2,1.05);

    addTruckStopPad(group,256,116,20,18,tx,tz);
    addTruckStopLotEdgeCurbs(group,256,116,20,18,tx,tz,'east');
    addTruckStopBuilding(group,256,116,12,9,3.6,0x796b52,'CHICKEN & BISCUITS',tx,tz);
    addTruckStopFixedSign(group,246,104,'← DRIVE THRU',tx,tz,0,3.2,1.05);

    addTruckStopTruckParking(group,tx,tz);
    addTruckStopBuilding(group,295,145,16,11,4.0,0x6d6b62,'TRUCK SERVICE',tx,tz);
    addTruckStopServiceBays(group,tx,tz);

    // Motel lot lies to the west of Motel Access, rather than underneath it.
    addTruckStopPad(group,336,94,30,34,tx,tz);
    addTruckStopLotEdgeCurbs(group,336,94,30,34,tx,tz,'east');
    addTruckStopBuilding(group,336,94,25,13,4.2,0x766a5c,'COYOTE MOTOR LODGE',tx,tz);
    addTruckStopFixedSign(group,352,66,'MOTEL →',tx,tz,0,2.7,1.0);

    addTruckStopCarParkingLines(group,224,75,5,5.0,8,tx,tz);
    addTruckStopCarParkingLines(group,276,84,4,4.2,7,tx,tz);
    addTruckStopCarParkingLines(group,250,112,4,4.2,7,tx,tz);
    addTruckStopCarParkingLines(group,326,84,5,5.0,10,tx,tz);

    addTruckStopDriveThruMarkings(group,tx,tz);

    // Small curb islands make the lots read as intentional developed parcels.
    addTruckStopLandscapeIsland(group,247,70,7.0,2.4,tx,tz);
    addTruckStopLandscapeIsland(group,274,72,5.5,2.2,tx,tz);
    addTruckStopLandscapeIsland(group,327,72,7.0,2.4,tx,tz);

    addTruckStopStorefrontDetails(group,tx,tz);
    addTruckStopParkedVehicles(group,tx,tz);

    // Entrance thresholds and clear vehicle-flow wayfinding.
    addTruckStopThresholdBars(group,180,8,tx,tz,2.7);
    addTruckStopThresholdBars(group,306,8,tx,tz,2.7);
    addTruckStopFixedSign(group,170,17,'CARS · FUEL →',tx,tz,0,3.5,1.0);
    addTruckStopFixedSign(group,316,18,'TRUCKS →',tx,tz,0,3.0,1.0);
    addTruckStopFixedSign(group,178,47,'WEST ENTRANCE',tx,tz,Math.PI/2,3.2,1.0);
    addTruckStopFixedSign(group,307,47,'EAST ENTRANCE',tx,tz,Math.PI/2,3.2,1.0);
    addTruckStopFixedSign(group,298,166,'EXIT →',tx,tz,0,2.6,1.0);

    // Large roadside monument sign near the west entrance.
    const p=truckStopWorldPoint(186,17);
    if(truckStopObjectOwnedByTile(p.x,p.z,tx,tz)){
      addTruckStopStaticBox(
        group,p.x,SURFACE_ROAD_Y+3.1,p.z,
        .18,6.2,.18,0x777a72,0
      );
      const sign=makeTextSprite(['COYOTE JUNCTION','TRUCK PLAZA','FUEL · FOOD'],4.9,2.25,true);
      sign.position.set(p.x,SURFACE_ROAD_Y+6.05,p.z);
      group.add(sign);
    }

    flushTruckStopCurbBatch(group);
    flushTruckStopMarkingBatch(group);
    flushTruckStopStaticBoxBatches(group);
    flushParkedVehicleBatch(group);
  }

  function auditTruckStopApproachSigning() {
    const info=crossingInfo(TRUCK_STOP_CROSSING_INDEX);
    const issues=[];
    if(!info?.accessible) issues.push('truck-stop crossing is not accessible');
    if(TRUCK_STOP_CROSSING_INDEX-3===TRUCK_STOP_CROSSING_INDEX-2){
      issues.push('service and EXIT AHEAD sign bands collide');
    }
    return issues;
  }

  function auditTruckStopDriveThruLoops() {
    const roads=allTruckStopRoadSegments();
    const names=['Roadhouse Drive Thru','Chicken Drive Thru'];
    const result=[];

    for(const name of names){
      const segs=roads.filter(s=>roadDisplayName(s)===name);
      const endpointCounts=new Map();

      for(const s of segs){
        for(const [x,z] of [[s.ax,s.az],[s.bx,s.bz]]){
          const k=`${x.toFixed(2)},${z.toFixed(2)}`;
          endpointCounts.set(k,(endpointCounts.get(k)||0)+1);
        }
      }

      const loose=[...endpointCounts.values()].filter(n=>n===1).length;
      if(loose>2){
        result.push({name,segments:segs.length,looseEndpoints:loose});
      }
    }
    return result;
  }

  function auditTruckStopGeometry() {
    // Intended lot extents after v0.7.3 cleanup. Roads may touch an open edge,
    // but no broad parking rectangle should straddle a circulation-road centerline.
    const lots=[
      {name:'Travel Mart',lx:235,lz:82,w:32,d:22},
      {name:'Fuel',lx:220,lz:92,w:24,d:27},
      {name:'Roadhouse',lx:282,lz:89,w:20,d:21},
      {name:'Chicken',lx:256,lz:116,w:20,d:18},
      {name:'Motel',lx:336,lz:94,w:30,d:34},
      {name:'Truck Parking',lx:255,lz:151,w:92,d:42},
      {name:'Service Apron',lx:286,lz:145,w:22,d:18}
    ];
    const roads=allTruckStopRoadSegments();
    const issues=[];

    for(const lot of lots){
      const c=truckStopWorldPoint(lot.lx,lot.lz);
      for(const s of roads){
        const hit=pointSegmentDistance2D(c.x,c.z,s.ax,s.az,s.bx,s.bz);
        const halfExtent=Math.max(lot.w,lot.d)/2;
        // Only flag roads passing materially through the middle half of a lot.
        if(hit.distance<halfExtent*.36){
          const name=roadDisplayName(s)||s.type;
          // Truck Parking intentionally contains Truck Court circulation.
          if(lot.name==='Truck Parking' && name==='Truck Court') continue;
          // Service apron intentionally meets Truck Court at its west edge.
          if(lot.name==='Service Apron' && name==='Truck Court') continue;
          issues.push({lot:lot.name,road:name,distance:+hit.distance.toFixed(2)});
        }
      }
    }
    return issues;
  }

  function insideTruckStopDevelopmentZone(x,z,margin=18) {
    const p=worldToCrossingLocal(TRUCK_STOP_CROSSING_INDEX,x,z);
    return p.x>=155-margin && p.x<=380+margin &&
           p.z>=-10-margin && p.z<=190+margin;
  }

  function addProceduralTileDevelopment(group,tx,tz) {
    if(!sceneryEnabled || settings.sceneryDensity<=0) return;

    group.userData.developmentBoxBatches=new Map();
    addTruckStopScenery(group,tx,tz);

    const density=settings.sceneryDensity;
    const plan=tilePlanCache.get(tileCacheKey(tx,tz));
    const manifest=plan?.manifest;

    // The worker decides deterministic placement and road/site clearance.
    // The main thread still applies live density and special local exclusions.
    if(manifest?.building){
      const b=manifest.building;
      if(b.roll < .045*density &&
         b.interstateClear &&
         b.roadClear &&
         !insideTruckStopDevelopmentZone(b.x,b.z,6) &&
         Math.hypot(b.x-48,b.z)>125){
        addProceduralTileBuilding(group,b.x,b.z,b.seed);
      }
    }else{
      // Exact legacy fallback when workers are unavailable or late.
      const cx=tx*WORLD_TILE_SIZE;
      const cz=tz*WORLD_TILE_SIZE;
      if(hash2D(tx,tz,60) < .045*density){
        const x=cx+(hash2D(tx,tz,61)-.5)*WORLD_TILE_SIZE*.55;
        const z=cz+(hash2D(tx,tz,62)-.5)*WORLD_TILE_SIZE*.55;
        if(farEnoughFromInterstate(x,z,65) &&
           Math.hypot(x-48,z)>125 &&
           pointClearOfRoadsAndSite(x,z,tx,tz,14)){
          addProceduralTileBuilding(group,x,z,hash2D(tx,tz,63));
        }
      }
    }

    addRoadsideDestinationDevelopment(group,tx,tz);
    addHamletGeometry(group,tx,tz);
    if(!group.userData.deferSceneryBatchFlush) flushCountrysideDevelopmentBatches(group);
  }

  function addProceduralTileVegetation(group,tx,tz) {
    if(!sceneryEnabled || settings.sceneryDensity<=0) return;

    group.userData.treeBatch=[];
    const density=settings.sceneryDensity;
    const plan=tilePlanCache.get(tileCacheKey(tx,tz));
    const manifest=plan?.manifest;

    if(manifest?.field){
      const f=manifest.field;
      if(f.roll < .36*density &&
         f.interstateClear &&
         f.roadClear &&
         !insideTruckStopDevelopmentZone(f.x,f.z,6) &&
         Math.hypot(f.x-48,f.z)>105){
        const patch=box(
          f.w,.022,f.d,
          f.dark ? COLORS.darkField : COLORS.field
        );
        patch.position.set(f.x,terrainYAt(f.x,f.z)+.016,f.z);
        group.add(patch);
      }
    }else{
      const cx=tx*WORLD_TILE_SIZE;
      const cz=tz*WORLD_TILE_SIZE;
      if(hash2D(tx,tz,31) < .36*density){
        const px=cx+(hash2D(tx,tz,32)-.5)*WORLD_TILE_SIZE*.55;
        const pz=cz+(hash2D(tx,tz,33)-.5)*WORLD_TILE_SIZE*.55;
        if(farEnoughFromInterstate(px,pz,34) &&
           Math.hypot(px-48,pz)>105 &&
           pointClearOfRoadsAndSite(px,pz,tx,tz,18)){
          const patch=box(
            28+hash2D(tx,tz,34)*34,
            .022,
            34+hash2D(tx,tz,35)*48,
            hash2D(tx,tz,36)>.5 ? COLORS.field : COLORS.darkField
          );
          patch.position.set(px,terrainYAt(px,pz)+.016,pz);
          group.add(patch);
        }
      }
    }

    if(manifest?.trees){
      const treeCount=Math.floor(manifest.treeBase*density);
      for(let i=0;i<Math.min(treeCount,manifest.trees.length);i++){
        const p=manifest.trees[i];
        if(!p.interstateClear || !p.roadClear) continue;
        if(insideTruckStopDevelopmentZone(p.x,p.z,6)) continue;
        if(Math.hypot(p.x-48,p.z)<=92) continue;
        addProceduralTileTree(group,p.x,p.z,p.seed);
      }
    }else{
      // Exact legacy fallback.
      const cx=tx*WORLD_TILE_SIZE;
      const cz=tz*WORLD_TILE_SIZE;
      const treeCount=Math.floor((1+hash2D(tx,tz,40)*5)*density);
      for(let i=0;i<treeCount;i++){
        const x=cx+(hash2D(tx,tz,41+i*3)-.5)*(WORLD_TILE_SIZE-18);
        const z=cz+(hash2D(tx,tz,42+i*3)-.5)*(WORLD_TILE_SIZE-18);
        if(!farEnoughFromInterstate(x,z,26)) continue;
        if(Math.hypot(x-48,z)<=92) continue;
        if(!pointClearOfRoadsAndSite(x,z,tx,tz,5.5)) continue;
        addProceduralTileTree(group,x,z,hash2D(tx,tz,43+i*3));
      }
    }

    addRoadsideDestinationVegetation(group,tx,tz);
    if(!group.userData.deferSceneryBatchFlush) flushProceduralTreeBatch(group);
  }

  function addProceduralTileScenery(group,tx,tz) {
    addProceduralTileDevelopment(group,tx,tz);
    addProceduralTileVegetation(group,tx,tz);
  }

  const tileBuildProfile={
    count:0,
    lastMs:0,
    maxMs:0,
    totalMs:0,
    lastTile:'',
    recent:[],
    recentAvgMs:0,
    heavyCount:0,
    lastHeavyTile:'',
    lastHeavyMs:0
  };
  const heavyTileBuildCache=new Map();
  const HEAVY_TILE_BUILD_MS=7.5;
  const HEAVY_TILE_CACHE_LIMIT=512;
  const tileDevelopmentBuildProfile={
    count:0,lastMs:0,maxMs:0,recent:[],recentAvgMs:0,
    heavyCount:0,lastHeavyTile:'',lastHeavyMs:0
  };
  const tileVegetationBuildProfile={
    count:0,lastMs:0,maxMs:0,recent:[],recentAvgMs:0,
    heavyCount:0,lastHeavyTile:'',lastHeavyMs:0
  };

  function rememberHeavyTileBuild(key,ms) {
    if(heavyTileBuildCache.has(key)) heavyTileBuildCache.delete(key);
    heavyTileBuildCache.set(key,ms);
    while(heavyTileBuildCache.size>HEAVY_TILE_CACHE_LIMIT){
      heavyTileBuildCache.delete(heavyTileBuildCache.keys().next().value);
    }
  }

  function recordBaseTileBuild(tileKey,buildMs) {
    tileBuildProfile.count++;
    tileBuildProfile.lastMs=buildMs;
    tileBuildProfile.maxMs=Math.max(tileBuildProfile.maxMs,buildMs);
    tileBuildProfile.totalMs+=buildMs;
    tileBuildProfile.lastTile=tileKey;
    tileBuildProfile.recent.push(buildMs);
    if(tileBuildProfile.recent.length>24) tileBuildProfile.recent.shift();
    tileBuildProfile.recentAvgMs=tileBuildProfile.recent.reduce((a,b)=>a+b,0)/Math.max(1,tileBuildProfile.recent.length);
    if(buildMs>=HEAVY_TILE_BUILD_MS){
      tileBuildProfile.heavyCount++;
      tileBuildProfile.lastHeavyTile=tileKey;
      tileBuildProfile.lastHeavyMs=buildMs;
      rememberHeavyTileBuild(tileKey,buildMs);
    }
  }

  function recordSceneryStageBuild(profile,tileKey,buildMs) {
    profile.count++;
    profile.lastMs=buildMs;
    profile.maxMs=Math.max(profile.maxMs,buildMs);
    profile.recent.push(buildMs);
    if(profile.recent.length>24) profile.recent.shift();
    profile.recentAvgMs=profile.recent.reduce((a,b)=>a+b,0)/Math.max(1,profile.recent.length);
    if(buildMs>=HEAVY_TILE_BUILD_MS){
      profile.heavyCount++;
      profile.lastHeavyTile=tileKey;
      profile.lastHeavyMs=buildMs;
      rememberHeavyTileBuild(tileKey,Math.max(buildMs,heavyTileBuildCache.get(tileKey)||0));
    }
  }

  function populateWorldTileDevelopmentLayout(tile,tx,tz) {
    if(!tile || tile.userData.developmentLayoutBuilt) return 0;
    const sceneryGroup=tile.userData.sceneryGroup;
    if(!sceneryGroup) return 0;
    const started=performance.now();

    if(tilePlanCache.get(tileCacheKey(tx,tz))?.manifest) tileManifestUses++;
    else tileManifestFallbacks++;

    sceneryGroup.userData.deferSceneryBatchFlush=true;
    addProceduralTileDevelopment(sceneryGroup,tx,tz);
    delete sceneryGroup.userData.deferSceneryBatchFlush;

    tile.userData.developmentLayoutBuilt=true;
    return performance.now()-started;
  }

  function finalizeWorldTileDevelopment(tile,tx,tz,maxBatches=1) {
    if(!tile || tile.userData.developmentBuilt) return 0;
    const sceneryGroup=tile.userData.sceneryGroup;
    if(!sceneryGroup) return 0;
    const started=performance.now();

    const result=flushCountrysideDevelopmentBatches(sceneryGroup,maxBatches);
    const elapsed=performance.now()-started;

    if(result.done){
      tile.userData.developmentBuilt=true;
      const total=(tile.userData.developmentLayoutMs||0)+
                  (tile.userData.developmentFinalizeMs||0)+elapsed;
      recordSceneryStageBuild(
        tileDevelopmentBuildProfile,tileCacheKey(tx,tz),total
      );
      delete tile.userData.developmentLayoutMs;
      delete tile.userData.developmentFinalizeMs;
    }else{
      tile.userData.developmentFinalizeMs=
        (tile.userData.developmentFinalizeMs||0)+elapsed;
    }
    return elapsed;
  }

  function populateWorldTileVegetationLayout(tile,tx,tz) {
    if(!tile || tile.userData.vegetationLayoutBuilt) return 0;
    const sceneryGroup=tile.userData.sceneryGroup;
    if(!sceneryGroup) return 0;
    const started=performance.now();

    sceneryGroup.userData.deferSceneryBatchFlush=true;
    addProceduralTileVegetation(sceneryGroup,tx,tz);
    delete sceneryGroup.userData.deferSceneryBatchFlush;

    tile.userData.vegetationLayoutBuilt=true;
    return performance.now()-started;
  }

  function finalizeWorldTileVegetation(tile,tx,tz,maxParts=1) {
    if(!tile || tile.userData.vegetationBuilt) return 0;
    const sceneryGroup=tile.userData.sceneryGroup;
    if(!sceneryGroup) return 0;
    const started=performance.now();

    const result=flushProceduralTreeBatch(sceneryGroup,maxParts);
    const elapsed=performance.now()-started;

    if(result.done){
      tile.userData.vegetationBuilt=true;
      tile.userData.sceneryBuilt=true;
      const total=(tile.userData.vegetationLayoutMs||0)+
                  (tile.userData.vegetationFinalizeMs||0)+elapsed;
      recordSceneryStageBuild(
        tileVegetationBuildProfile,tileCacheKey(tx,tz),total
      );
      delete tile.userData.vegetationLayoutMs;
      delete tile.userData.vegetationFinalizeMs;
    }else{
      tile.userData.vegetationFinalizeMs=
        (tile.userData.vegetationFinalizeMs||0)+elapsed;
    }
    return elapsed;
  }

  function populateWorldTileDevelopment(tile,tx,tz) {
    if(!tile || tile.userData.developmentBuilt) return 0;
    let elapsed=0;
    if(!tile.userData.developmentLayoutBuilt){
      const ms=populateWorldTileDevelopmentLayout(tile,tx,tz);
      tile.userData.developmentLayoutMs=(tile.userData.developmentLayoutMs||0)+ms;
      elapsed+=ms;
    }
    while(!tile.userData.developmentBuilt){
      elapsed+=finalizeWorldTileDevelopment(tile,tx,tz,Infinity);
    }
    return elapsed;
  }

  function populateWorldTileVegetation(tile,tx,tz) {
    if(!tile || tile.userData.vegetationBuilt) return 0;
    let elapsed=0;
    if(!tile.userData.vegetationLayoutBuilt){
      const ms=populateWorldTileVegetationLayout(tile,tx,tz);
      tile.userData.vegetationLayoutMs=(tile.userData.vegetationLayoutMs||0)+ms;
      elapsed+=ms;
    }
    while(!tile.userData.vegetationBuilt){
      elapsed+=finalizeWorldTileVegetation(tile,tx,tz,Infinity);
    }
    return elapsed;
  }

  function populateWorldTileScenery(tile,tx,tz) {
    return populateWorldTileDevelopment(tile,tx,tz)+
           populateWorldTileVegetation(tile,tx,tz);
  }

  function createWorldTile(tx,tz,includeScenery=true,deferRoads=false) {
    const buildStart=performance.now();
    const g=new THREE.Group();
    g.userData.tileX=tx;
    g.userData.tileZ=tz;
    g.userData.roadBuilt=false;
    g.userData.roadShellMs=0;
    g.userData.sceneryBuilt=false;
    g.userData.developmentLayoutBuilt=false;
    g.userData.developmentBuilt=false;
    g.userData.vegetationLayoutBuilt=false;
    g.userData.vegetationBuilt=false;

    const terrain=new THREE.Mesh(
      makeWorldTileGeometry(tx,tz),
      mat(worldTileColor(tx,tz))
    );
    terrain.receiveShadow=false;
    g.add(terrain);

    const roadGroup=new THREE.Group();
    roadGroup.userData.tileLayer='roads';
    g.userData.roadGroup=roadGroup;
    g.add(roadGroup);

    const sceneryGroup=new THREE.Group();
    sceneryGroup.userData.tileLayer='scenery';
    g.userData.sceneryGroup=sceneryGroup;
    g.add(sceneryGroup);

    world.add(g);
    worldTiles.set(tileCacheKey(tx,tz),g);
    g.userData.roadShellMs=performance.now()-buildStart;

    if(deferRoads){
      beginProceduralTileRoadBuild(roadGroup,tx,tz);
      return g;
    }

    const roadMs=addProceduralTileRoads(roadGroup,tx,tz);
    g.userData.roadBuilt=true;
    recordBaseTileBuild(
      tileCacheKey(tx,tz),
      g.userData.roadShellMs+roadMs
    );

    if(includeScenery) populateWorldTileScenery(g,tx,tz);
    return g;
  }


  function disposeWorldTile(group) {
    unregisterOneSidedSignsIn(group);
    world.remove(group);
    group.traverse(o=>{
      // Cached box/material resources are intentionally shared and retained.
      // Only unique tile plane geometry is disposed here.
      if(o.isMesh && o.geometry && o.geometry.isBufferGeometry &&
         !o.userData?.sharedGeometry &&
         !o.userData?.sharedSignAsset &&
         !sharedGeometrySet.has(o.geometry)){
        o.geometry.dispose();
      }
    });
  }

  const tileStreamQueue=[];
  const tileStreamQueuedKeys=new Set();
  const tileRoadBuildQueue=[];
  const tileRoadBuildQueuedKeys=new Set();
  const tileSceneryQueue=[];
  const tileSceneryQueuedKeys=new Set();
  const tileUnloadQueue=[];
  const tileUnloadQueuedKeys=new Set();
  let tileStreamGeneration=0;
  let tileStreamCenterX=null;
  let tileStreamCenterZ=null;
  let tileStreamRadius=0;
  let tileStreamSceneryRadius=0;
  let tileStreamLastFrameMs=0;
  let tileStreamMaxFrameMs=0;
  let tileStreamLastBuilt=0;
  let tileStreamTotalBuilt=0;
  let tileRoadBuildLastMs=0;
  let tileRoadBuildMaxMs=0;
  let tileRoadBuildLastStages=0;
  let tileRoadBuildCompleted=0;
  let tileStreamAdaptiveBudgetMs=2.5;
  let tileStreamAdaptiveMaxTiles=2;
  let tileStreamPredictedCenterX=null;
  let tileStreamPredictedCenterZ=null;
  let tileUnloadLastFrameMs=0;
  let tileUnloadMaxFrameMs=0;
  let tileUnloadLastCount=0;
  let tileSceneryLastFrameMs=0;
  let tileSceneryMaxFrameMs=0;
  let tileSceneryLastBuilt=0;
  let tileSceneryCooldownFrames=0;
  let tileSceneryHeavyStops=0;
  let tileStreamCooldownFrames=0;
  let tileStreamHeavyStops=0;
  let tileStreamOldestWaitMs=0;
  let tileStreamMaxWaitMs=0;
  let tileStreamStarvationEvents=0;
  let tileStreamLastQueueProgressTime=performance.now();
  let maxObservedWorldTiles=0;
  let maxObservedCacheEntries=0;

  function worldStreamingRadius() {
    return settings.drawDistance===8 ? 4 : settings.drawDistance===12 ? 5 : 6;
  }

  function tileChebyshevDistance(tx,tz,cx,cz) {
    return Math.max(Math.abs(tx-cx),Math.abs(tz-cz));
  }

  function predictedStreamingCenter(cx,cz) {
    // Look about 3.5 seconds ahead, capped to two tiles. This gives the queue
    // time to prepare the likely route before the player reaches the next row.
    const lookaheadMeters=Math.min(
      WORLD_TILE_SIZE*2,
      Math.max(0,player.speed)*3.5
    );
    const fx=-Math.sin(player.heading);
    const fz=-Math.cos(player.heading);
    return {
      x:worldTileIndexForCoord(player.x+fx*lookaheadMeters),
      z:worldTileIndexForCoord(player.z+fz*lookaheadMeters)
    };
  }

  function tileStreamingPriority(tx,tz,cx,cz,predictX=cx,predictZ=cz) {
    const dx=tx-cx,dz=tz-cz;
    const dist=Math.max(Math.abs(dx),Math.abs(dz));
    const predictedDist=Math.max(
      Math.abs(tx-predictX),
      Math.abs(tz-predictZ)
    );

    const fx=-Math.sin(player.heading);
    const fz=-Math.cos(player.heading);
    const len=Math.hypot(dx,dz)||1;
    const ahead=(dx*fx+dz*fz)/len;

    // Nearby tiles still dominate. Among tiles at comparable distance, favor
    // the predicted future center and the direction the vehicle is traveling.
    // A tile that was previously expensive gets a small penalty only when it
    // is outside the immediate neighborhood, preventing clusters of known
    // heavy tiles from being built back-to-back.
    const knownHeavy=heavyTileBuildCache.get(tileCacheKey(tx,tz))||0;
    const heavyPenalty=dist>1 && knownHeavy>=HEAVY_TILE_BUILD_MS ? 5 : 0;
    return dist*12 + predictedDist*3 - ahead*2.75 + heavyPenalty;
  }


  function updateWorldTileVisibility(tile,tx,tz,cx,tzCenter,sceneryRadius) {
    if(tile.userData.sceneryGroup){
      tile.userData.sceneryGroup.visible=
        tileChebyshevDistance(tx,tz,cx,tzCenter)<=sceneryRadius;
    }
  }

  function queueTileForUnload(key,g) {
    if(tileUnloadQueuedKeys.has(key)) return;
    tileUnloadQueuedKeys.add(key);
    tileUnloadQueue.push({key,g});
  }


  function queueTileRoadBuild(tile,tx,tz,priority=0,generation=tileStreamGeneration) {
    if(!tile || tile.userData.roadBuilt) return;
    const key=tileCacheKey(tx,tz);
    if(tileRoadBuildQueuedKeys.has(key)) return;
    tileRoadBuildQueuedKeys.add(key);
    tileRoadBuildQueue.push({
      tile,tx,tz,key,priority,generation,
      enqueuedAt:performance.now()
    });
  }

  function completeWorldTileRoadsSync(tile,tx,tz) {
    if(!tile || tile.userData.roadBuilt) return 0;
    const roadGroup=tile.userData.roadGroup;
    if(!roadGroup) return 0;

    let elapsed=0;
    let result={done:false,elapsed:0};
    while(!result.done){
      result=processProceduralTileRoadBuildStage(
        roadGroup,tx,tz,Infinity,Infinity
      );
      elapsed+=result.elapsed;
    }

    tile.userData.roadBuilt=true;
    recordBaseTileBuild(
      tileCacheKey(tx,tz),
      (tile.userData.roadShellMs||0)+(roadGroup.userData.roadBuildMs||elapsed)
    );
    tileRoadBuildQueuedKeys.delete(tileCacheKey(tx,tz));
    return elapsed;
  }

  function queueTileScenery(tile,tx,tz,priority=0,generation=tileStreamGeneration,stage=null) {
    if(!tile || tile.userData.sceneryBuilt) return;
    const key=tileCacheKey(tx,tz);

    let nextStage=stage;
    if(!nextStage){
      if(!tile.userData.developmentLayoutBuilt) nextStage='development-layout';
      else if(!tile.userData.developmentBuilt) nextStage='development-finalize';
      else if(!tile.userData.vegetationLayoutBuilt) nextStage='vegetation-layout';
      else nextStage='vegetation-finalize';
    }

    if(nextStage==='development-layout' && tile.userData.developmentLayoutBuilt)
      return queueTileScenery(tile,tx,tz,priority,generation,'development-finalize');
    if(nextStage==='development-finalize' && tile.userData.developmentBuilt)
      return queueTileScenery(tile,tx,tz,priority,generation,'vegetation-layout');
    if(nextStage==='vegetation-layout' && tile.userData.vegetationLayoutBuilt)
      return queueTileScenery(tile,tx,tz,priority,generation,'vegetation-finalize');
    if(nextStage==='vegetation-finalize' && tile.userData.vegetationBuilt) return;

    const stageKey=`${key}|${nextStage}`;
    if(tileSceneryQueuedKeys.has(stageKey)) return;
    tileSceneryQueuedKeys.add(stageKey);
    tileSceneryQueue.push({
      tile,tx,tz,key,stageKey,stage:nextStage,
      priority,generation,enqueuedAt:performance.now()
    });
  }


  function rebuildTileStreamQueue(cx,cz,radius,sceneryRadius) {
    tileStreamGeneration++;
    tileStreamQueue.length=0;
    tileStreamQueuedKeys.clear();
    tileRoadBuildQueue.length=0;
    tileRoadBuildQueuedKeys.clear();
    tileSceneryQueue.length=0;
    tileSceneryQueuedKeys.clear();

    tileStreamCenterX=cx;
    tileStreamCenterZ=cz;
    tileStreamRadius=radius;
    tileStreamSceneryRadius=sceneryRadius;

    const predicted=predictedStreamingCenter(cx,cz);
    tileStreamPredictedCenterX=predicted.x;
    tileStreamPredictedCenterZ=predicted.z;

    const candidates=[];
    for(let dz=-radius;dz<=radius;dz++){
      for(let dx=-radius;dx<=radius;dx++){
        const tx=cx+dx,tz=cz+dz;
        const key=tileCacheKey(tx,tz);
        const existing=worldTiles.get(key);
        if(existing){
          const priority=tileStreamingPriority(
            tx,tz,cx,cz,predicted.x,predicted.z
          );
          updateWorldTileVisibility(existing,tx,tz,cx,cz,sceneryRadius);

          if(!existing.userData.roadBuilt){
            queueTileRoadBuild(existing,tx,tz,priority,tileStreamGeneration);
          }else if(tileChebyshevDistance(tx,tz,cx,cz)<=sceneryRadius &&
                   !existing.userData.sceneryBuilt){
            queueTileScenery(
              existing,tx,tz,priority,tileStreamGeneration
            );
          }
          continue;
        }
        candidates.push({
          tx,tz,key,
          priority:tileStreamingPriority(
            tx,tz,cx,cz,predicted.x,predicted.z
          ),
          generation:tileStreamGeneration,
          enqueuedAt:performance.now()
        });
      }
    }

    candidates.sort((a,b)=>a.priority-b.priority);
    for(const item of candidates){
      tileStreamQueue.push(item);
      tileStreamQueuedKeys.add(item.key);
    }
    tileRoadBuildQueue.sort((a,b)=>a.priority-b.priority);
    tileSceneryQueue.sort((a,b)=>a.priority-b.priority);
    scheduleWorkerPrefetchFromTileQueue();

    // Queue stale tiles for gradual disposal. Keep one extra tile ring until
    // disposal catches up so there is never a visible hole behind the player.
    for(const [key,g] of worldTiles){
      const tx=g.userData.tileX,tz=g.userData.tileZ;
      if(tileChebyshevDistance(tx,tz,cx,cz)>radius){
        queueTileForUnload(key,g);
      }
    }
  }


  function createImmediateSafetyTiles(cx,cz,radius,sceneryRadius) {
    // The player's own tile plus its eight neighbors are never deferred.
    // At 42 m/s this is comfortably larger than the distance the vehicle can
    // cross during a normal frame and keeps local road collision/geometry safe.
    for(let dz=-1;dz<=1;dz++){
      for(let dx=-1;dx<=1;dx++){
        const tx=cx+dx,tz=cz+dz;
        if(tileChebyshevDistance(tx,tz,cx,cz)>radius) continue;
        const key=tileCacheKey(tx,tz);
        let tile=worldTiles.get(key);
        if(!tile) tile=createWorldTile(tx,tz,true,false);
        else{
          if(!tile.userData.roadBuilt) completeWorldTileRoadsSync(tile,tx,tz);
          if(!tile.userData.sceneryBuilt) populateWorldTileScenery(tile,tx,tz);
        }
        updateWorldTileVisibility(tile,tx,tz,cx,cz,sceneryRadius);
        tileStreamQueuedKeys.delete(key);
        tileSceneryQueuedKeys.delete(`${key}|development-layout`);
        tileSceneryQueuedKeys.delete(`${key}|development-finalize`);
        tileSceneryQueuedKeys.delete(`${key}|vegetation-layout`);
        tileSceneryQueuedKeys.delete(`${key}|vegetation-finalize`);
      }
    }
  }

  function updateAdaptiveStreamingBudget(dt) {
    const frameMs=Math.max(.1,dt*1000);

    // Protect slow frames aggressively; use idle headroom on fast frames.
    if(frameMs>24){
      tileStreamAdaptiveBudgetMs=1.0;
      tileStreamAdaptiveMaxTiles=1;
    }else if(frameMs>18){
      tileStreamAdaptiveBudgetMs=1.6;
      tileStreamAdaptiveMaxTiles=1;
    }else if(frameMs<12.5){
      tileStreamAdaptiveBudgetMs=4.0;
      tileStreamAdaptiveMaxTiles=3;
    }else if(frameMs<15.5){
      tileStreamAdaptiveBudgetMs=3.0;
      tileStreamAdaptiveMaxTiles=2;
    }else{
      tileStreamAdaptiveBudgetMs=2.2;
      tileStreamAdaptiveMaxTiles=2;
    }

    // If recent tile construction itself is expensive, never schedule a batch
    // of several tiles merely because the previous rendered frame was fast.
    const recentStageCost=Math.max(tileBuildProfile.recentAvgMs,tileDevelopmentBuildProfile.recentAvgMs,tileVegetationBuildProfile.recentAvgMs);
    if(recentStageCost>6){
      tileStreamAdaptiveBudgetMs=Math.min(tileStreamAdaptiveBudgetMs,1.4);
      tileStreamAdaptiveMaxTiles=1;
    }else if(recentStageCost>4){
      tileStreamAdaptiveBudgetMs=Math.min(tileStreamAdaptiveBudgetMs,2.0);
      tileStreamAdaptiveMaxTiles=Math.min(tileStreamAdaptiveMaxTiles,2);
    }

    // If the queue is becoming large, allow a little more catch-up work only
    // when the current frame still has headroom and recent tiles are cheap.
    if(tileStreamQueue.length>24 && frameMs<16 && recentStageCost<4){
      tileStreamAdaptiveBudgetMs=Math.min(4.8,tileStreamAdaptiveBudgetMs+.8);
      tileStreamAdaptiveMaxTiles=Math.min(4,tileStreamAdaptiveMaxTiles+1);
    }
  }

  function processTileUnloadQueue(frameBudgetMs=.8,maxTiles=2) {
    if(!tileUnloadQueue.length){
      tileUnloadLastFrameMs=0;
      tileUnloadLastCount=0;
      return;
    }

    const started=performance.now();
    let removed=0;

    while(tileUnloadQueue.length && removed<maxTiles){
      if(removed>0 && performance.now()-started>=frameBudgetMs) break;

      const item=tileUnloadQueue.shift();
      tileUnloadQueuedKeys.delete(item.key);

      // A tile may have become relevant again before its deferred disposal.
      if(worldTiles.get(item.key)!==item.g) continue;
      if(tileChebyshevDistance(
        item.g.userData.tileX,
        item.g.userData.tileZ,
        tileStreamCenterX,
        tileStreamCenterZ
      )<=tileStreamRadius) continue;

      disposeWorldTile(item.g);
      worldTiles.delete(item.key);
      removed++;
    }

    tileUnloadLastFrameMs=performance.now()-started;
    tileUnloadMaxFrameMs=Math.max(tileUnloadMaxFrameMs,tileUnloadLastFrameMs);
    tileUnloadLastCount=removed;
  }

  function processTileStreamQueue(frameBudgetMs=tileStreamAdaptiveBudgetMs,maxTiles=tileStreamAdaptiveMaxTiles) {
    if(tileStreamCooldownFrames>0){
      tileStreamCooldownFrames--;
      tileStreamLastFrameMs=0;
      tileStreamLastBuilt=0;
      return;
    }

    if(!tileStreamQueue.length){
      tileStreamLastFrameMs=0;
      tileStreamLastBuilt=0;
      tileStreamOldestWaitMs=0;
      return;
    }

    const now=performance.now();
    // Queue entries are rebuilt together, so a tiny linear oldest-time scan
    // avoids allocating a temporary array/spread every streaming frame.
    let oldestEnqueue=now;
    for(const item of tileStreamQueue){
      if(item.enqueuedAt && item.enqueuedAt<oldestEnqueue) oldestEnqueue=item.enqueuedAt;
    }
    tileStreamOldestWaitMs=Math.max(0,now-oldestEnqueue);
    tileStreamMaxWaitMs=Math.max(tileStreamMaxWaitMs,tileStreamOldestWaitMs);
    if(tileStreamOldestWaitMs>2200 && now-tileStreamLastQueueProgressTime>1000){
      tileStreamStarvationEvents++;
      tileStreamLastQueueProgressTime=now;
    }

    const started=performance.now();
    let built=0;

    while(tileStreamQueue.length && built<maxTiles){
      if(built>0 && performance.now()-started>=frameBudgetMs) break;

      const item=tileStreamQueue.shift();
      tileStreamQueuedKeys.delete(item.key);
      if(item.generation!==tileStreamGeneration) continue;
      if(worldTiles.has(item.key)) continue;
      if(tileChebyshevDistance(
        item.tx,item.tz,tileStreamCenterX,tileStreamCenterZ
      )>tileStreamRadius) continue;

      const tile=createWorldTile(item.tx,item.tz,false,true);
      updateWorldTileVisibility(
        tile,item.tx,item.tz,
        tileStreamCenterX,tileStreamCenterZ,
        tileStreamSceneryRadius
      );
      queueTileRoadBuild(
        tile,item.tx,item.tz,item.priority,item.generation
      );

      built++;
      tileStreamTotalBuilt++;
      tileStreamLastQueueProgressTime=performance.now();
    }

    tileStreamLastFrameMs=performance.now()-started;
    tileStreamMaxFrameMs=Math.max(tileStreamMaxFrameMs,tileStreamLastFrameMs);
    tileStreamLastBuilt=built;
  }



  function processTileRoadBuildQueue(frameBudgetMs=1.4,maxStages=1) {
    if(!tileRoadBuildQueue.length){
      tileRoadBuildLastMs=0;
      tileRoadBuildLastStages=0;
      return;
    }

    const started=performance.now();
    let stages=0;

    while(tileRoadBuildQueue.length && stages<maxStages){
      if(stages>0 && performance.now()-started>=frameBudgetMs) break;

      const item=tileRoadBuildQueue.shift();
      tileRoadBuildQueuedKeys.delete(item.key);

      if(item.generation!==tileStreamGeneration) continue;
      if(worldTiles.get(item.key)!==item.tile) continue;
      if(item.tile.userData.roadBuilt) continue;
      if(tileChebyshevDistance(
        item.tx,item.tz,tileStreamCenterX,tileStreamCenterZ
      )>tileStreamRadius) continue;

      const roadGroup=item.tile.userData.roadGroup;
      if(!roadGroup) continue;

      const result=processProceduralTileRoadBuildStage(
        roadGroup,item.tx,item.tz,5,1
      );
      stages++;

      if(result.done){
        item.tile.userData.roadBuilt=true;
        tileRoadBuildCompleted++;
        recordBaseTileBuild(
          item.key,
          (item.tile.userData.roadShellMs||0)+
          (roadGroup.userData.roadBuildMs||0)
        );

        if(tileChebyshevDistance(
          item.tx,item.tz,tileStreamCenterX,tileStreamCenterZ
        )<=tileStreamSceneryRadius){
          queueTileScenery(
            item.tile,item.tx,item.tz,
            item.priority+.15,item.generation
          );
        }
      }else{
        queueTileRoadBuild(
          item.tile,item.tx,item.tz,
          item.priority+.02,item.generation
        );
      }

      if(result.elapsed>=HEAVY_TILE_BUILD_MS){
        tileStreamHeavyStops++;
        tileStreamCooldownFrames=1;
        break;
      }
    }

    tileRoadBuildLastMs=performance.now()-started;
    tileRoadBuildMaxMs=Math.max(tileRoadBuildMaxMs,tileRoadBuildLastMs);
    tileRoadBuildLastStages=stages;
  }

  function processTileSceneryQueue(frameBudgetMs=Math.min(1.8,tileStreamAdaptiveBudgetMs),maxStages=1) {
    if(tileSceneryCooldownFrames>0){
      tileSceneryCooldownFrames--;
      tileSceneryLastFrameMs=0;
      tileSceneryLastBuilt=0;
      return;
    }
    if(tileStreamCooldownFrames>0 || !tileSceneryQueue.length){
      tileSceneryLastFrameMs=0;
      tileSceneryLastBuilt=0;
      return;
    }

    const started=performance.now();
    let built=0;

    while(tileSceneryQueue.length && built<maxStages){
      if(built>0 && performance.now()-started>=frameBudgetMs) break;

      const item=tileSceneryQueue.shift();
      tileSceneryQueuedKeys.delete(item.stageKey||item.key);
      if(item.generation!==tileStreamGeneration) continue;
      if(worldTiles.get(item.key)!==item.tile) continue;
      if(tileChebyshevDistance(
        item.tx,item.tz,tileStreamCenterX,tileStreamCenterZ
      )>tileStreamSceneryRadius) continue;

      let elapsed=0;
      let nextStage=null;

      if(item.stage==='development-layout'){
        if(item.tile.userData.developmentLayoutBuilt) continue;
        elapsed=populateWorldTileDevelopmentLayout(item.tile,item.tx,item.tz);
        item.tile.userData.developmentLayoutMs=
          (item.tile.userData.developmentLayoutMs||0)+elapsed;
        nextStage='development-finalize';

      }else if(item.stage==='development-finalize'){
        if(item.tile.userData.developmentBuilt) continue;
        elapsed=finalizeWorldTileDevelopment(item.tile,item.tx,item.tz,1);
        nextStage=item.tile.userData.developmentBuilt
          ? 'vegetation-layout'
          : 'development-finalize';

      }else if(item.stage==='vegetation-layout'){
        if(item.tile.userData.vegetationLayoutBuilt) continue;
        elapsed=populateWorldTileVegetationLayout(item.tile,item.tx,item.tz);
        item.tile.userData.vegetationLayoutMs=
          (item.tile.userData.vegetationLayoutMs||0)+elapsed;
        nextStage='vegetation-finalize';

      }else{
        if(item.tile.userData.vegetationBuilt) continue;
        elapsed=finalizeWorldTileVegetation(item.tile,item.tx,item.tz,1);
        if(!item.tile.userData.vegetationBuilt) nextStage='vegetation-finalize';
      }

      if(nextStage){
        queueTileScenery(
          item.tile,item.tx,item.tz,
          item.priority+.08,item.generation,nextStage
        );
      }

      built++;
      if(elapsed>=HEAVY_TILE_BUILD_MS){
        tileSceneryHeavyStops++;
        tileSceneryCooldownFrames=1;
        break;
      }
    }

    tileSceneryLastFrameMs=performance.now()-started;
    tileSceneryMaxFrameMs=Math.max(tileSceneryMaxFrameMs,tileSceneryLastFrameMs);
    tileSceneryLastBuilt=built;
  }


  function _ensureWorldTilesNow(forceSynchronous=false) {
    const cx=worldTileIndexForCoord(player.x);
    const cz=worldTileIndexForCoord(player.z);
    const radius=worldStreamingRadius();
    const sceneryRadius=Math.max(2,radius-1);

    rebuildTileStreamQueue(cx,cz,radius,sceneryRadius);

    if(forceSynchronous){
      tileUnloadQueue.length=0;
      tileUnloadQueuedKeys.clear();
      // Startup, explicit rebuilds, and teleports need a complete world
      // immediately because there is no useful rendered frame to protect.
      while(tileStreamQueue.length){ processTileStreamQueue(Infinity,64); }
      while(tileRoadBuildQueue.length){ processTileRoadBuildQueue(Infinity,256); }

      // A final heavy base tile may leave a one-frame runtime cooldown armed.
      // Synchronous startup/teleport drains must not let that block scenery.
      tileStreamCooldownFrames=0;
      tileSceneryCooldownFrames=0;
      while(tileSceneryQueue.length){ processTileSceneryQueue(Infinity,64); }
      return;
    }

    createImmediateSafetyTiles(cx,cz,radius,sceneryRadius);
  }

  let lastWorldTileCX=null;
  let lastWorldTileCZ=null;
  let lastWorldDrawDistance=null;

  function ensureWorldTiles(force=false) {
    const cx=worldTileIndexForCoord(player.x);
    const cz=worldTileIndexForCoord(player.z);
    if(!force &&
       cx===lastWorldTileCX &&
       cz===lastWorldTileCZ &&
       settings.drawDistance===lastWorldDrawDistance){
      return;
    }

    lastWorldTileCX=cx;
    lastWorldTileCZ=cz;
    lastWorldDrawDistance=settings.drawDistance;
    _ensureWorldTilesNow(force);
  }

  let nextSegmentIndex = -2;
  let sceneryEnabled = true;
  let trafficEnabled = true;
  let fogEnabled = true;
  let debugVisible = false;

  const nameBlacklist = new Set(('los angeles san francisco san diego fresno sacramento bakersfield oakland stockton modesto riverside anaheim pasadena santa barbara monterey santa cruz palm springs barstow needles san jose berkeley ventura salinas merced madera visalia tulare hanford chico redding').split(' '));
  const syllA = ['al','ar','bel','ced','cor','del','el','far','gal','mar','mon','nor','pal','ran','red','sol','tal','vel','ver','zan'];
  const syllB = ['a','ado','al','aro','eda','eno','era','ero','ia','ina','ino','ora','osa','ula','ero','ez','on'];
  const angloA = ['Coyote','Dry','Marble','Pine','Red','Silver','Willow','Dusty','Copper','Lone','Sage','Golden','Cedar','Orchard','Cotton','Tule'];
  const angloB = ['Wells','Flats','Crossing','Junction','Springs','Valley','Creek','Ridge','Grove','Fields','Hollow','Ranch','Canal'];
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function generatedWord() { return cap(syllA[(Math.random()*syllA.length)|0] + syllB[(Math.random()*syllB.length)|0]); }
  function placeName() {
    for (let tries=0; tries<20; tries++) {
      const r = Math.random(); let n;
      if (r < .22) n = `San ${generatedWord()}`;
      else if (r < .37) n = `Santa ${generatedWord()}`;
      else if (r < .50) n = `Rancho ${generatedWord()}`;
      else if (r < .58) n = `Las ${generatedWord()}s`;
      else if (r < .66) n = `Los ${generatedWord()}s`;
      else n = `${angloA[(Math.random()*angloA.length)|0]} ${angloB[(Math.random()*angloB.length)|0]}`;
      const low = n.toLowerCase();
      if (![...nameBlacklist].some(x => low === x)) return n;
    }
    return `Rancho ${generatedWord()}`;
  }

  const destinations = [placeName(), placeName(), placeName()];

  function makeTextSprite(lines, scaleX=7, scaleY=3.2, green=true) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = green ? '#1a6138' : '#f5f0d8'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = green ? '#fffdf0' : '#202020';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='bold 42px Arial';
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.forEach((t,i)=>ctx.fillText(String(t).toUpperCase(), 256, 80 + i*62));
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthWrite:false}));
    spr.scale.set(scaleX, scaleY, 1); return spr;
  }

  const freewayBuildProfile={
    count:0,lastMs:0,maxMs:0,totalMs:0,lastIndex:null,
    baseLastMs:0,baseMaxMs:0,sceneryLastMs:0,sceneryMaxMs:0,
    heavyCount:0
  };
  const FREEWAY_HEAVY_BUILD_MS=6.0;
  const freewaySegmentQueue=[];
  const freewaySegmentQueued=new Set();
  const freewaySegmentByIndex=new Map();
  const freewaySceneryQueue=[];
  const freewaySceneryQueued=new Set();
  let freewayLastPlayerIndex=null;
  let freewayLastDrawDistance=null;
  let freewayStreamLastMs=0;
  let freewayStreamMaxMs=0;
  let freewayStreamBuilt=0;
  let freewaySceneryLastFrameMs=0;
  let freewaySceneryMaxFrameMs=0;
  let freewaySceneryBuilt=0;

  const unifiedStreamingProfile={
    lastMs:0,
    maxMs:0,
    lastJobs:0,
    skippedJobs:0,
    frameBudgetMs:3.6,
    roundRobin:0
  };

  const FRAME_PROFILE_WINDOW=240;
  const FRAME_SPIKE_MS=25;
  const frameProfileSamples=[];
  const frameProfileTotals=new Map();
  const frameProfileMaxima=new Map();
  const frameSpikeHistory=[];
  let frameProfileLastTotalMs=0;
  let frameProfileAvgMs=0;
  let frameProfileP95Ms=0;
  let frameProfileMaxMs=0;
  let frameProfileLastHotspot='none';
  let frameProfileSpikeCount=0;

  function profileFramePart(parts,name,fn){
    const started=performance.now();
    const value=fn();
    const elapsed=performance.now()-started;
    parts[name]=(parts[name]||0)+elapsed;
    return value;
  }

  function frameProfilePercentile(values,p){
    if(!values.length) return 0;
    const sorted=[...values].sort((a,b)=>a-b);
    const index=Math.min(
      sorted.length-1,
      Math.max(0,Math.ceil(sorted.length*p)-1)
    );
    return sorted[index];
  }

  function recordFrameProfile(parts,totalMs){
    frameProfileLastTotalMs=totalMs;
    frameProfileMaxMs=Math.max(frameProfileMaxMs,totalMs);

    let hotspot='other';
    let hotspotMs=0;
    for(const [name,ms] of Object.entries(parts)){
      frameProfileTotals.set(
        name,
        (frameProfileTotals.get(name)||0)+ms
      );
      frameProfileMaxima.set(
        name,
        Math.max(frameProfileMaxima.get(name)||0,ms)
      );
      if(ms>hotspotMs){
        hotspot=name;
        hotspotMs=ms;
      }
    }
    frameProfileLastHotspot=`${hotspot} ${hotspotMs.toFixed(1)}ms`;

    frameProfileSamples.push({totalMs,parts:{...parts}});
    if(frameProfileSamples.length>FRAME_PROFILE_WINDOW){
      const removed=frameProfileSamples.shift();
      for(const [name,ms] of Object.entries(removed.parts)){
        frameProfileTotals.set(
          name,
          Math.max(0,(frameProfileTotals.get(name)||0)-ms)
        );
      }
    }

    const totals=frameProfileSamples.map(s=>s.totalMs);
    frameProfileAvgMs=totals.length
      ? totals.reduce((a,b)=>a+b,0)/totals.length
      : 0;
    frameProfileP95Ms=frameProfilePercentile(totals,.95);

    if(totalMs>=FRAME_SPIKE_MS){
      frameProfileSpikeCount++;
      const ranked=Object.entries(parts)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,3);
      frameSpikeHistory.push({
        at:performance.now(),
        totalMs,
        ranked
      });
      if(frameSpikeHistory.length>12) frameSpikeHistory.shift();
    }
  }

  function frameProfileTopAverageParts(limit=4){
    const count=Math.max(1,frameProfileSamples.length);
    return [...frameProfileTotals.entries()]
      .map(([name,total])=>[name,total/count])
      .sort((a,b)=>b[1]-a[1])
      .slice(0,limit)
      .map(([name,ms])=>`${name} ${ms.toFixed(2)}`)
      .join(' · ') || 'none';
  }

  function frameProfileTopMaxParts(limit=4){
    return [...frameProfileMaxima.entries()]
      .sort((a,b)=>b[1]-a[1])
      .slice(0,limit)
      .map(([name,ms])=>`${name} ${ms.toFixed(1)}`)
      .join(' · ') || 'none';
  }

  function latestFrameSpikeSummary(){
    const spike=frameSpikeHistory[frameSpikeHistory.length-1];
    if(!spike) return 'none';
    return `${spike.totalMs.toFixed(1)}ms: `+
      spike.ranked.map(([name,ms])=>`${name} ${ms.toFixed(1)}`).join(' · ');
  }

  const roadBuildPhaseProfile={
    segments:{count:0,total:0,max:0},
    markings:{count:0,total:0,max:0},
    junctions:{count:0,total:0,max:0},
    signs:{count:0,total:0,max:0}
  };

  function recordRoadBuildPhase(name,ms){
    const p=roadBuildPhaseProfile[name];
    if(!p) return;
    p.count++;
    p.total+=ms;
    p.max=Math.max(p.max,ms);
  }

  const junctionPhaseProfile={
    disk:{count:0,total:0,max:0},
    flare:{count:0,total:0,max:0},
    apron:{count:0,total:0,max:0},
    stop:{count:0,total:0,max:0},
    'cross-sign':{count:0,total:0,max:0},
    regional:{count:0,total:0,max:0}
  };

  function recordJunctionPhase(name,ms){
    const p=junctionPhaseProfile[name];
    if(!p) return;
    p.count++;
    p.total+=ms;
    p.max=Math.max(p.max,ms);
  }

  function compactPhaseProfile(profile){
    return Object.entries(profile)
      .map(([name,p])=>[
        name,
        p.count?p.total/p.count:0,
        p.max
      ])
      .sort((a,b)=>b[2]-a[2])
      .map(([name,avg,max])=>`${name} ${avg.toFixed(2)}/${max.toFixed(1)}`)
      .join(' · ');
  }

  function recordFreewayBuild(index,totalMs,baseMs,sceneryMs){
    freewayBuildProfile.count++;
    freewayBuildProfile.lastMs=totalMs;
    freewayBuildProfile.maxMs=Math.max(freewayBuildProfile.maxMs,totalMs);
    freewayBuildProfile.totalMs+=totalMs;
    freewayBuildProfile.lastIndex=index;
    freewayBuildProfile.baseLastMs=baseMs;
    freewayBuildProfile.baseMaxMs=Math.max(freewayBuildProfile.baseMaxMs,baseMs);
    freewayBuildProfile.sceneryLastMs=sceneryMs;
    freewayBuildProfile.sceneryMaxMs=Math.max(freewayBuildProfile.sceneryMaxMs,sceneryMs);
    if(totalMs>=FREEWAY_HEAVY_BUILD_MS) freewayBuildProfile.heavyCount++;
  }

  function addRoadChunk(index, includeScenery=true) {
    const chunkBuildStart=performance.now();
    let chunkSceneryMs=0;
    const g = new THREE.Group();
    const z = -index * SEG_LEN;

    const centerX = roadCenterXAtZ(z);
    const centerY = roadCenterYAtZ(z);
    const heading = roadHeadingAtZ(z);
    const pitch = roadPitchAtZ(z);

    g.position.set(centerX, centerY, z);
    g.rotation.set(pitch, heading, 0);
    g.userData.index = index;
    g.userData.curvature = roadCurvatureAtZ(z);
    g.userData.elevation = centerY;
    g.userData.heading = heading;
    g.userData.pitch = pitch;
    g.userData.centerX = centerX;
    g.userData.medianType = medianTypeForIndex(index);

    const pavementVariant = ((index % 11) + 11) % 11;
    const roadColor = pavementVariant === 0 || pavementVariant === 1
      ? COLORS.asphalt2
      : COLORS.asphalt;

    // Slight longitudinal overlap prevents hairline gaps where horizontally curved chunks meet.
    const road = box(ROAD_HALF*2, .05, SEG_LEN + 2.2, roadColor);
    road.position.y = -0.06;
    g.add(road);

    // Freeway chunks only own the immediate roadside verge now.
    // The broader countryside is generated independently around the player.
    const vergeWidth = 72;
    const vergeCenter = ROAD_HALF + vergeWidth/2 - .5;

    const leftGround = box(vergeWidth, .03, SEG_LEN + 6, Math.random()>.3 ? COLORS.dryGrass : COLORS.dirt);
    leftGround.position.set(-vergeCenter,-.09,0);
    g.add(leftGround);

    const rightGround = box(vergeWidth, .03, SEG_LEN + 6, Math.random()>.3 ? COLORS.dryGrass : COLORS.olive);
    rightGround.position.set(vergeCenter,-.09,0);
    g.add(rightGround);

    // Broad farm/soil patches.
    if (Math.random() < .5) {
      const patch = box(
        28,
        .025,
        45 + Math.random()*55,
        Math.random()>.45 ? COLORS.field : COLORS.darkField
      );
      patch.position.set(
        (Math.random()<.5?-1:1)*(25+Math.random()*34),
        -.065,
        (Math.random()-.5)*30
      );
      g.add(patch);
    }

    // Shoulder is part of the main freeway pavement. The outside white
    // edge line at +/-11.8 marks the travel-lane boundary, leaving the
    // remaining asphalt out to ROAD_HALF as the shoulder. No separate gray
    // shoulder slab is overlaid on top of the road.
    // Median type changes only after long stretches.
    const medianType = g.userData.medianType;
    if (medianType === 'dirt' || medianType === 'grass') {
      const medianColor = medianType === 'grass' ? COLORS.olive : COLORS.dirt;
      const median = box(1.9,.08,SEG_LEN + 2,medianColor);
      median.position.set(0,0,0);
      g.add(median);
    } else if (medianType === 'concrete') {
      const median = box(1.35,.52,SEG_LEN + 2,COLORS.concrete);
      median.position.set(0,.22,0);
      g.add(median);
    } else {
      // Simple central guardrail median: two low rails plus occasional posts.
      const railL = box(.12,.18,SEG_LEN + 2,COLORS.guard);
      railL.position.set(-.46,.22,0);
      g.add(railL);
      const railR = railL.clone();
      railR.position.x = .46;
      g.add(railR);
      const postPositions=[];
      for (let dz=-SEG_LEN/2+4; dz<SEG_LEN/2; dz+=8) {
        postPositions.push([-.46,.08,dz],[.46,.08,dz]);
      }
      if(postPositions.length){
        const postGeoKey='.09|.52|.09';
        if(!boxGeoCache.has(postGeoKey)){
          boxGeoCache.set(postGeoKey,new THREE.BoxGeometry(.09,.52,.09));
        }
        const posts=new THREE.InstancedMesh(
          boxGeoCache.get(postGeoKey),
          mat(COLORS.guard),
          postPositions.length
        );
        const pm=new THREE.Matrix4();
        postPositions.forEach((p,i)=>{
          pm.makeTranslation(p[0],p[1],p[2]);
          posts.setMatrixAt(i,pm);
        });
        posts.instanceMatrix.needsUpdate=true;
        g.add(posts);
      }
    }

    const markings = [-8.22,-4.67,4.67,8.22];
    const dashPositions=[];
    for (const x of markings) {
      for (let dz=-SEG_LEN/2+8; dz<SEG_LEN/2; dz+=12) {
        dashPositions.push([x,.04,dz]);
      }
    }
    if(dashPositions.length){
      const dashGeoKey='.13|.02|5.5';
      if(!boxGeoCache.has(dashGeoKey)){
        boxGeoCache.set(dashGeoKey,new THREE.BoxGeometry(.13,.02,5.5));
      }
      const dashes=new THREE.InstancedMesh(
        boxGeoCache.get(dashGeoKey),
        mat(COLORS.line),
        dashPositions.length
      );
      const matrix=new THREE.Matrix4();
      dashPositions.forEach((p,i)=>{
        matrix.makeTranslation(p[0],p[1],p[2]);
        dashes.setMatrixAt(i,matrix);
      });
      dashes.instanceMatrix.needsUpdate=true;
      g.add(dashes);
    }

    // Median edge yellow lines + outside white.
    for (const x of [-1.1,1.1]) {
      const l=box(.12,.02,SEG_LEN + 2,COLORS.yellow);
      l.position.set(x,.04,0);
      g.add(l);
    }
    for (const x of [-11.8,11.8]) {
      const l=box(.12,.02,SEG_LEN + 2,COLORS.line);
      l.position.set(x,.04,0);
      g.add(l);
    }

    // No random pavement-repair overlays. Large rectangular patches read
    // as accidental geometry seams in first-person view.
    if (sceneryEnabled && Math.abs(index) > 1) {
      const sceneryGroup=new THREE.Group();
      sceneryGroup.userData.freewayScenery=true;
      sceneryGroup.userData.sceneryBuilt=false;
      g.userData.sceneryGroup=sceneryGroup;
      g.add(sceneryGroup);
      if(includeScenery){
        const sceneryStart=performance.now();
        addScenery(sceneryGroup,index);
        chunkSceneryMs=performance.now()-sceneryStart;
        sceneryGroup.userData.sceneryBuilt=true;
      }
    }

    // Crossroads / overpasses and real interchange signage are generated as
    // linked structures. No standalone random exit signs.
    addCrossingGeometry(g, index);
    addAdvanceExitSignIfNeeded(g, index);
    addTruckStopFreewayServiceAdvance(g,index);

    world.add(g);
    segments.push(g);
    freewaySegmentByIndex.set(index,g);
    const chunkTotalMs=performance.now()-chunkBuildStart;
    recordFreewayBuild(index,chunkTotalMs,Math.max(0,chunkTotalMs-chunkSceneryMs),chunkSceneryMs);
    return g;
  }
  function addScenery(g, index) {
    const density = settings.sceneryDensity;
    g.userData.utilityPoleBatch=[];
    const r0 = seededNoise1D(index*7+1);
    const r1 = seededNoise1D(index*7+2);
    const r2 = seededNoise1D(index*7+3);
    const r3 = seededNoise1D(index*7+4);
    const r4 = seededNoise1D(index*7+5);

    const treeCount = Math.floor((1 + r0*4) * density);
    for(let i=0;i<treeCount;i++){
      const side = i%2===0 ? -1 : 1;
      const x = side*(21 + seededNoise1D(index*31+i)*45);
      const z = (seededNoise1D(index*47+i)-.5)*SEG_LEN;
      const trunk = box(.20,1.3,.20,0x5b4630);
      trunk.position.set(x,.65,z);
      g.add(trunk);
      const crownRadius=.8+seededNoise1D(index*67+i)*.65;
      const crown = new THREE.Mesh(
        proceduralTreeCrownGeo,
        mat(0x596d40)
      );
      crown.position.set(x,1.75,z);
      crown.scale.set(
        crownRadius,
        crownRadius*(.75 + seededNoise1D(index*71+i)*.5),
        crownRadius
      );
      crown.userData.sharedGeometry=true;
      g.add(crown);
    }

    if (r1 < .44*density) {
      addFenceLine(g,-18.8,-SEG_LEN/2,SEG_LEN/2);
      addFenceLine(g,18.8,-SEG_LEN/2,SEG_LEN/2);
    }

    if (r2 < .54*density) {
      const px = r2 < .27 ? -24.5 : 24.5;
      for (let z=-SEG_LEN/2+9; z<SEG_LEN/2; z+=24) addUtilityPole(g,px,z);
    }

    if (r3 < .16*density) {
      const side = r3 < .08 ? -1 : 1;
      addCanal(g,side*(29+r4*8),0,SEG_LEN-8);
    }

    if (r4 < .12*density) {
      const side = r0 < .5 ? -1 : 1;
      const bx = side*(36+r1*14);
      const bz = (r2-.5)*54;
      addSimpleBarn(g,bx,bz,.78+r3*.30);
      if (r3 < .62) addSilo(g,bx+side*6.5,bz+5,.72);
    }

    if (r0 > .76 && density > .4) {
      for (const side of [-1,1]) {
        const hill = new THREE.Mesh(
          new THREE.ConeGeometry(18+r1*14,5+r2*4,7),
          mat(side<0 ? 0x8b7b62 : 0x81745e)
        );
        hill.position.set(side*(74+r3*20),2.1,(r4-.5)*80);
        hill.scale.z = 1.8;
        g.add(hill);
      }
    }

    if (positiveMod(index,14) === 6) addRouteMarker(g,15.35,-12);
    flushUtilityPoleBatch(g);
  }

  function queueFreewaySceneryForSegment(segment,playerIndex,sceneryChunkRadius){
    const index=segment.userData.index;
    const sg=segment.userData.sceneryGroup;
    if(!sg || sg.userData.sceneryBuilt) return;
    if(Math.abs(index-playerIndex)>sceneryChunkRadius) return;
    if(freewaySceneryQueued.has(index)) return;
    freewaySceneryQueued.add(index);
    freewaySceneryQueue.push({index,segment,priority:Math.abs(index-playerIndex)});
    freewaySceneryQueue.sort((a,b)=>a.priority-b.priority);
  }

  function processFreewaySegmentQueue(frameBudgetMs=2.2,maxChunks=1){
    if(!freewaySegmentQueue.length){
      freewayStreamLastMs=0; freewayStreamBuilt=0; return;
    }
    const started=performance.now();
    let built=0;
    while(freewaySegmentQueue.length && built<maxChunks){
      if(built>0 && performance.now()-started>=frameBudgetMs) break;
      const item=freewaySegmentQueue.shift();
      freewaySegmentQueued.delete(item.index);
      if(freewaySegmentByIndex.has(item.index)) continue;
      addRoadChunk(item.index,false);
      built++;
      if(freewayBuildProfile.lastMs>=FREEWAY_HEAVY_BUILD_MS) break;
    }
    freewayStreamLastMs=performance.now()-started;
    freewayStreamMaxMs=Math.max(freewayStreamMaxMs,freewayStreamLastMs);
    freewayStreamBuilt=built;
  }

  function processFreewaySceneryQueue(frameBudgetMs=1.4,maxChunks=1){
    if(!freewaySceneryQueue.length){
      freewaySceneryLastFrameMs=0; freewaySceneryBuilt=0; return;
    }
    const started=performance.now();
    let built=0;
    while(freewaySceneryQueue.length && built<maxChunks){
      if(built>0 && performance.now()-started>=frameBudgetMs) break;
      const item=freewaySceneryQueue.shift();
      freewaySceneryQueued.delete(item.index);
      if(!segments.includes(item.segment)) continue;
      const sg=item.segment.userData.sceneryGroup;
      if(!sg || sg.userData.sceneryBuilt) continue;
      const sceneryStart=performance.now();
      addScenery(sg,item.index);
      const ms=performance.now()-sceneryStart;
      sg.userData.sceneryBuilt=true;
      freewayBuildProfile.sceneryLastMs=ms;
      freewayBuildProfile.sceneryMaxMs=Math.max(freewayBuildProfile.sceneryMaxMs,ms);
      built++;
      if(ms>=FREEWAY_HEAVY_BUILD_MS) break;
    }
    freewaySceneryLastFrameMs=performance.now()-started;
    freewaySceneryMaxFrameMs=Math.max(freewaySceneryMaxFrameMs,freewaySceneryLastFrameMs);
    freewaySceneryBuilt=built;
  }

  function rebuildFreewaySegmentQueues(playerIndex,min,max,sceneryChunkRadius){
    freewaySegmentQueue.length=0;
    freewaySegmentQueued.clear();
    freewaySceneryQueue.length=0;
    freewaySceneryQueued.clear();

    const existing=freewaySegmentByIndex;
    const fx=-Math.cos(player.heading); // north/south bias in chunk-index space
    const candidates=[];
    for(let index=min;index<=max;index++){
      if(existing.has(index)) continue;
      const delta=index-playerIndex;
      const forwardBias=player.speed>2 ? (delta*Math.sign(fx||1)) : 0;
      candidates.push({index,priority:Math.abs(delta)*10-forwardBias*1.25});
    }
    candidates.sort((a,b)=>a.priority-b.priority);
    for(const item of candidates){
      freewaySegmentQueue.push(item);
      freewaySegmentQueued.add(item.index);
    }

    for(const segment of segments){
      queueFreewaySceneryForSegment(segment,playerIndex,sceneryChunkRadius);
    }
  }

  function ensureSegments(force=false) {
    const playerIndex=Math.floor((-player.z)/SEG_LEN);
    const behind=Math.max(4,Math.floor(settings.drawDistance*.42));
    const ahead=settings.drawDistance;
    const min=playerIndex-behind;
    const max=playerIndex+ahead;
    const sceneryChunkRadius=Math.max(5,Math.floor(settings.drawDistance*.58));

    const changed=force || playerIndex!==freewayLastPlayerIndex ||
      settings.drawDistance!==freewayLastDrawDistance;

    // Nothing about freeway visibility, retention, or queue membership changes
    // until the player crosses a 120 m chunk boundary or draw distance changes.
    // v0.8.9 still rescanned the entire segment list every frame.
    if(!changed) return;

    freewayLastPlayerIndex=playerIndex;
    freewayLastDrawDistance=settings.drawDistance;

    // Immediate freeway safety window is synchronous; outer chunks are staged.
    const immediateMin=Math.max(min,playerIndex-2);
    const immediateMax=Math.min(max,playerIndex+3);
    for(let index=immediateMin;index<=immediateMax;index++){
      if(!freewaySegmentByIndex.has(index)) addRoadChunk(index,true);
    }

    rebuildFreewaySegmentQueues(playerIndex,min,max,sceneryChunkRadius);

    if(force){
      while(freewaySegmentQueue.length) processFreewaySegmentQueue(Infinity,64);
      for(const segment of segments){
        queueFreewaySceneryForSegment(segment,playerIndex,sceneryChunkRadius);
      }
      while(freewaySceneryQueue.length) processFreewaySceneryQueue(Infinity,64);
    }

    for(let i=segments.length-1;i>=0;i--){
      const segment=segments[i];
      const index=segment.userData.index;
      if(index<min || index>max){
        freewaySegmentQueued.delete(index);
        freewaySceneryQueued.delete(index);
        freewaySegmentByIndex.delete(index);
        world.remove(segment);
        disposeSignTextures(segment);
        segments.splice(i,1);
      }else if(segment.userData.sceneryGroup){
        segment.userData.sceneryGroup.visible=
          Math.abs(index-playerIndex)<=sceneryChunkRadius;
        queueFreewaySceneryForSegment(segment,playerIndex,sceneryChunkRadius);
      }
    }

    nextSegmentIndex=max+1;
  }

  function disposeSignTextures(group) {
    unregisterOneSidedSignsIn(group);
    group.traverse(o => {
      if(o.isSprite && o.material?.map && !o.userData?.sharedSignAsset){
        o.material.map.dispose();
        o.material.dispose();
      }
    });
  }

  const vehicleBodyColors = [0xe6e2d7,0xb6b8b4,0x777b7c,0x282a29,0x8b3f36,0x496276,0x536349,0x755d45,0xb39d79];
  function shade(hex, factor) { const c=new THREE.Color(hex); c.multiplyScalar(factor); return c.getHex(); }
  function makeVehicle(type='sedan') {
    const g = new THREE.Group(); const c=vehicleBodyColors[(Math.random()*vehicleBodyColors.length)|0];
    let w=1.72,h=.62,d=3.7,cabH=.63,cabD=1.8;
    if(type==='pickup'){d=4.2; cabD=1.65;}
    if(type==='van'){w=1.9;h=.9;d=4.2;cabH=.8;cabD=2.3;}
    if(type==='box'){w=2.15;h=.85;d=5.3;cabH=.85;cabD=1.6;}
    if(type==='semi'){w=2.35;h=.95;d=8.8;cabH=1.15;cabD=1.8;}
    const body=box(w,h,d,shade(c,.88)); body.position.y=.5; g.add(body);
    const upper=box(w*.87,cabH,cabD,shade(c,1.08)); upper.position.set(0,.92,type==='pickup'?-d*.19:-.15); g.add(upper);
    if(type==='pickup'){ const bed=box(w*.9,.35,d*.42,shade(c,.74)); bed.position.set(0,.68,d*.22); g.add(bed); }
    if(type==='box'||type==='semi'){ const cargo=box(w*.98,type==='semi'?1.6:1.8,type==='semi'?5.5:3.3,shade(c,1.02)); cargo.position.set(0,1.35,type==='semi'?1.45:.9); g.add(cargo); }
    for(const sx of [-1,1]) for(const sz of [-1,1]) { const wh=new THREE.Mesh(wheelGeo,mat(0x1b1b1b)); wh.position.set(sx*w*.48,.32,sz*d*.31); g.add(wh); }
    g.userData.halfW=w*.55; g.userData.halfD=d*.52; return g;
  }

  function truckStopPathWorld(points) {
    return points.map(([lx,lz])=>truckStopWorldPoint(lx,lz));
  }

  const truckStopTrafficRoutes=[
    {
      type:'sedan',
      speed:5.3,
      points:[[182,12],[182,58],[230,58],[270,58],[306,58],[306,20],[306,7],[250,7],[190,7]]
    },
    {
      type:'pickup',
      speed:4.8,
      points:[[205,66],[205,126],[205,178],[306,178],[306,126],[270,126],[270,66]]
    },
    {
      type:'compact',
      speed:3.4,
      points:[[270,78],[292,78],[292,100],[270,100],[270,78]]
    }
  ];

  function ensureTruckStopTraffic() {
    if(truckStopTraffic.length) return;

    for(let i=0;i<truckStopTrafficRoutes.length;i++){
      const route=truckStopTrafficRoutes[i];
      const mesh=makeVehicle(route.type);
      mesh.scale.setScalar(.93);
      world.add(mesh);

      const points=truckStopPathWorld(route.points);
      const startIndex=(i*2)%Math.max(1,points.length-1);
      truckStopTraffic.push({
        mesh,
        points,
        segment:startIndex,
        t:.15+i*.18,
        speed:route.speed,
        hitCooldown:0
      });
    }
  }

  function updateTruckStopTraffic(dt) {
    ensureTruckStopTraffic();

    const plazaCenter=truckStopWorldPoint(255,108);
    const playerDistance=Math.hypot(player.x-plazaCenter.x,player.z-plazaCenter.z);
    const active=playerDistance<1100 && trafficEnabled && settings.trafficDensity>0;

    for(const v of truckStopTraffic){
      v.mesh.visible=active;
      if(!active) continue;

      v.hitCooldown=Math.max(0,v.hitCooldown-dt);

      let remaining=v.speed*dt;
      while(remaining>0){
        const a=v.points[v.segment];
        const b=v.points[(v.segment+1)%v.points.length];
        const len=Math.hypot(b.x-a.x,b.z-a.z)||.001;
        const left=(1-v.t)*len;

        if(remaining<left){
          v.t+=remaining/len;
          remaining=0;
        }else{
          remaining-=left;
          v.segment=(v.segment+1)%v.points.length;
          v.t=0;
        }
      }

      const a=v.points[v.segment];
      const b=v.points[(v.segment+1)%v.points.length];
      v.mesh.position.set(
        THREE.MathUtils.lerp(a.x,b.x,v.t),
        SURFACE_ROAD_Y+.05,
        THREE.MathUtils.lerp(a.z,b.z,v.t)
      );

      const dx=b.x-a.x,dz=b.z-a.z;
      v.mesh.rotation.y=Math.atan2(dx,dz);

      // Lightweight player collision for local plaza traffic.
      const dxp=v.mesh.position.x-player.x;
      const dzp=v.mesh.position.z-player.z;
      if(Math.abs(dxp)<1.55 && Math.abs(dzp)<3.2 && v.hitCooldown<=0){
        const side=Math.sign(dxp||1);
        player.speed*=.45;
        player.heading+=side*.045;
        player.x-=side*.35;
        player.collisionShake=Math.max(player.collisionShake,.25);
        player.controlPenalty=Math.max(player.controlPenalty,.45);
        v.hitCooldown=.8;
      }
    }
  }


  // -------------------------------------------------------------------
  // SPARSE RURAL / LOCAL-ROAD TRAFFIC
  //
  // This is intentionally conservative. Vehicles spawn only on ordinary
  // paved countryside roads well away from I-9, then follow connected
  // centerline pieces with a right-hand lane offset. They do not use ramps,
  // driveways, dirt roads, or the dedicated truck-plaza road system.
  // -------------------------------------------------------------------
  let localRoadTrafficSpawnTimer=.8;

  function localTrafficEligibleRoad(s) {
    if(!s || s.dirt || s.type==='driveway' || roadIsTruckStopLocal(s)) return false;
    const cls=roadClassForType(s.type,s.routeTier);
    return cls==='major-county' ||
           cls==='county' ||
           cls==='major-connector' ||
           cls==='connector' ||
           cls==='settlement-local' ||
           cls==='local';
  }

  function localTrafficRoadKey(s) {
    if(!s) return '';
    const a=`${s.ax.toFixed(2)},${s.az.toFixed(2)}`;
    const b=`${s.bx.toFixed(2)},${s.bz.toFixed(2)}`;
    return a<b?`${a}|${b}|${roadDisplayName(s)||s.type}`:`${b}|${a}|${roadDisplayName(s)||s.type}`;
  }

  function nearbyLocalTrafficRoads(x,z,tileRadius=3) {
    const tx=worldTileIndexForCoord(x);
    const tz=worldTileIndexForCoord(z);
    const out=[];
    const seen=new Set();

    for(let oz=-tileRadius;oz<=tileRadius;oz++){
      for(let ox=-tileRadius;ox<=tileRadius;ox++){
        for(const s of neighborAwareRenderableSegments(tx+ox,tz+oz)){
          if(!localTrafficEligibleRoad(s)) continue;
          const key=localTrafficRoadKey(s);
          if(seen.has(key)) continue;
          seen.add(key);
          out.push(s);
        }
      }
    }
    return out;
  }

  function localTrafficLaneOffset(s,dir) {
    // Keep a believable two-way lane position without putting wheels on the
    // shoulder of narrower local streets.
    const half=Math.max(2.45,(s.width||5.8)/2);
    return Math.min(1.55,Math.max(1.05,half-1.35)) * dir;
  }

  function placeLocalTrafficVehicle(v) {
    const s=v.segment;
    const dx=s.bx-s.ax,dz=s.bz-s.az;
    const len=Math.hypot(dx,dz)||1;
    const ux=dx/len,uz=dz/len;

    const x=THREE.MathUtils.lerp(s.ax,s.bx,v.t);
    const z=THREE.MathUtils.lerp(s.az,s.bz,v.t);

    // Right-hand lane offset relative to direction of travel.
    const travelX=ux*v.dir;
    const travelZ=uz*v.dir;
    const rightX=travelZ;
    const rightZ=-travelX;
    const laneOffset=Math.abs(localTrafficLaneOffset(s,v.dir));

    v.mesh.position.set(
      x+rightX*laneOffset,
      SURFACE_ROAD_Y+.05,
      z+rightZ*laneOffset
    );
    v.mesh.rotation.y=Math.atan2(travelX,travelZ);
  }

  function localTrafficJunctionNear(x,z) {
    const tx=worldTileIndexForCoord(x);
    const tz=worldTileIndexForCoord(z);
    let best=null;

    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        for(const node of consolidatedSurfaceJunctionsForTile(tx+ox,tz+oz)){
          if(node.dirt || node.kind==='endpoint') continue;
          const d=Math.hypot(node.x-x,node.z-z);
          if(d>7.0) continue;
          if(!best || d<best.distance) best={node,distance:d};
        }
      }
    }
    return best;
  }

  function localTrafficRoadDirectionFromPoint(s,x,z) {
    const da=Math.hypot(s.ax-x,s.az-z);
    const db=Math.hypot(s.bx-x,s.bz-z);
    return da<=db ? 1 : -1;
  }

  function localTrafficCandidateScore(v,n,nextDir,node=null) {
    const s=v.segment;
    const ndx=(n.bx-n.ax)*nextDir;
    const ndz=(n.bz-n.az)*nextDir;
    const nlen=Math.hypot(ndx,ndz)||1;

    const cdx=(s.bx-s.ax)*v.dir;
    const cdz=(s.bz-s.az)*v.dir;
    const clen=Math.hypot(cdx,cdz)||1;
    const dot=(cdx/clen)*(ndx/nlen)+(cdz/clen)*(ndz/nlen);

    const sameName=roadDisplayName(n) &&
      roadDisplayName(n)===roadDisplayName(s);

    // Strongly prefer staying on the same named route, then straight travel.
    // At a deliberate junction, a modest random term allows occasional turns
    // without making vehicles zig-zag through every cross street.
    let score=dot+(sameName?2.6:0);
    if(node && node.kind!=='crossing') score+=Math.random()*.18;
    return score;
  }

  function localTrafficContinuation(v,atB) {
    const s=v.segment;
    const ex=atB?s.bx:s.ax;
    const ez=atB?s.bz:s.az;
    const tx=worldTileIndexForCoord(ex);
    const tz=worldTileIndexForCoord(ez);
    const currentKey=localTrafficRoadKey(s);
    const candidates=[];
    const seen=new Set();

    // First collect ordinary endpoint-to-endpoint continuations. These are
    // still the ideal path through sampled pieces of one curved county road.
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        for(const n of neighborAwareRenderableSegments(tx+ox,tz+oz)){
          if(!localTrafficEligibleRoad(n)) continue;
          const key=localTrafficRoadKey(n);
          if(key===currentKey || seen.has(key)) continue;

          const da=Math.hypot(n.ax-ex,n.az-ez);
          const db=Math.hypot(n.bx-ex,n.bz-ez);
          if(Math.min(da,db)>.8) continue;
          seen.add(key);

          const nextDir=da<=db ? 1 : -1;
          candidates.push({
            segment:n,
            dir:nextDir,
            score:localTrafficCandidateScore(v,n,nextDir,null),
            viaJunction:false
          });
        }
      }
    }

    // If a real consolidated junction is near this endpoint, use its complete
    // road membership too. This is what lets a T-road terminate into the
    // MIDDLE of another segment and still become a legal traffic movement.
    const junctionHit=localTrafficJunctionNear(ex,ez);
    if(junctionHit){
      const node=junctionHit.node;
      for(const n of node.roads||[]){
        if(!localTrafficEligibleRoad(n)) continue;
        const key=localTrafficRoadKey(n);
        if(key===currentKey || seen.has(key)) continue;

        const hit=pointSegmentDistance2D(node.x,node.z,n.ax,n.az,n.bx,n.bz);
        if(hit.distance>.9) continue;

        // If the junction lies in the middle of a through road, choose one of
        // its two legal travel directions. Add both so traffic may turn either
        // left or right at a T.
        const interior=hit.t>.04 && hit.t<.96;
        if(interior){
          for(const nextDir of [-1,1]){
            candidates.push({
              segment:n,
              dir:nextDir,
              startT:hit.t,
              score:localTrafficCandidateScore(v,n,nextDir,node),
              viaJunction:true,
              junction:node
            });
          }
          seen.add(key);
        }else{
          const nextDir=localTrafficRoadDirectionFromPoint(n,node.x,node.z);
          candidates.push({
            segment:n,
            dir:nextDir,
            startT:nextDir>0?0:1,
            score:localTrafficCandidateScore(v,n,nextDir,node),
            viaJunction:true,
            junction:node
          });
          seen.add(key);
        }
      }
    }

    if(!candidates.length) return null;
    candidates.sort((a,b)=>b.score-a.score);

    // Same-route/straight movement normally wins. At a genuine T or multi-way
    // node, occasionally take another high-quality route so intersections are
    // visibly used rather than merely crossed.
    if(junctionHit && candidates.length>1){
      const node=junctionHit.node;
      const turnChance=node.kind==='tee' ? .34 : node.kind==='multi' ? .26 : .12;
      const alternatives=candidates.filter(c=>c.score>candidates[0].score-1.15);
      if(alternatives.length>1 && Math.random()<turnChance){
        return alternatives[1+((Math.random()*(alternatives.length-1))|0)];
      }
    }

    return candidates[0];
  }

  function localTrafficApproachingJunction(v) {
    const s=v.segment;
    const len=Math.hypot(s.bx-s.ax,s.bz-s.az)||1;
    const distToEnd=(v.dir>0 ? 1-v.t : v.t)*len;
    if(distToEnd>14) return null;

    const ex=v.dir>0?s.bx:s.ax;
    const ez=v.dir>0?s.bz:s.az;
    const hit=localTrafficJunctionNear(ex,ez);
    if(!hit) return null;

    const node=hit.node;
    if(node.kind!=='tee' && node.kind!=='multi' && node.kind!=='crossing') return null;
    return {node,distToEnd,key:`${node.x.toFixed(1)},${node.z.toFixed(1)}`};
  }


  function spawnLocalRoadTraffic() {
    if(!trafficEnabled || settings.trafficDensity<=0) return false;

    const roads=nearbyLocalTrafficRoads(player.x,player.z,3).filter(s=>{
      const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2;
      const d=Math.hypot(mx-player.x,mz-player.z);
      if(d<150 || d>620) return false;

      // Keep this first pass away from freeway/interchange vertical geometry.
      if(Math.abs(mx-roadCenterXAtZ(mz))<95) return false;
      return Math.hypot(s.bx-s.ax,s.bz-s.az)>18;
    });
    if(!roads.length) return false;

    const s=roads[(Math.random()*roads.length)|0];
    const types=['compact','sedan','sedan','wagon','pickup','pickup','van'];
    const mesh=makeVehicle(types[(Math.random()*types.length)|0]);
    mesh.scale.setScalar(.94);

    const cls=roadClassForType(s.type,s.routeTier);
    const baseSpeed=
      cls==='major-county' ? 19 :
      cls==='county' ? 17 :
      cls==='major-connector' ? 16 :
      cls==='connector' ? 14 :
      cls==='settlement-local' ? 10 : 12;

    const v={
      mesh,
      segment:s,
      dir:Math.random()<.5?-1:1,
      t:.16+Math.random()*.68,
      speed:baseSpeed*(.86+Math.random()*.22),
      targetSpeed:baseSpeed*(.90+Math.random()*.18),
      hitCooldown:0,
      decisionTimer:1.5+Math.random()*3,
      junctionWait:0,
      junctionKey:null,
      junctionServedKey:null,
      roadName:roadDisplayName(s)||s.type
    };

    placeLocalTrafficVehicle(v);
    world.add(mesh);
    localRoadTraffic.push(v);
    return true;
  }

  function updateLocalRoadTraffic(dt) {
    if(!trafficEnabled || settings.trafficDensity<=0){
      for(const v of localRoadTraffic) world.remove(v.mesh);
      localRoadTraffic.length=0;
      return;
    }

    const maxLocal=Math.min(10,Math.max(2,Math.round(3+5*settings.trafficDensity)));
    localRoadTrafficSpawnTimer-=dt;
    if(localRoadTraffic.length<maxLocal && localRoadTrafficSpawnTimer<=0){
      spawnLocalRoadTraffic();
      localRoadTrafficSpawnTimer=1.2+Math.random()*1.8;
    }

    const playerOnLocalRoad=proceduralRoadInfoAt(player.x,player.z);
    const remove=[];

    for(const v of localRoadTraffic){
      v.hitCooldown=Math.max(0,v.hitCooldown-dt);
      v.decisionTimer-=dt;
      v.junctionWait=Math.max(0,(v.junctionWait||0)-dt);

      if(v.decisionTimer<=0){
        v.decisionTimer=2+Math.random()*3.5;
        v.targetSpeed*=.94+Math.random()*.12;
      }

      const approach=localTrafficApproachingJunction(v);
      let commandedSpeed=v.targetSpeed;

      if(approach){
        v.junctionKey=approach.key;

        // Major-road through traffic only needs to slow. Vehicles approaching
        // a T from a minor/local leg make a short stop before entering.
        const cls=roadClassForType(v.segment.type,v.segment.routeTier);
        const minorApproach=
          cls==='local' || cls==='settlement-local' || cls==='connector';

        if(approach.distToEnd<11){
          commandedSpeed=Math.min(commandedSpeed,minorApproach?4.2:7.5);
        }
        if(approach.distToEnd<2.2 &&
           minorApproach &&
           v.junctionServedKey!==approach.key &&
           v.junctionWait<=0){
          v.junctionWait=.38+Math.random()*.42;
          v.junctionServedKey=approach.key;
        }
      }else{
        v.junctionKey=null;
      }

      if(v.junctionWait>0){
        commandedSpeed=0;
      }

      v.speed+=(commandedSpeed-v.speed)*Math.min(1,dt*(commandedSpeed===0?3.8:.85));
      if(commandedSpeed===0 && v.speed<.25) v.speed=0;

      let remaining=v.speed*dt;
      let guard=0;
      while(remaining>0 && guard++<4){
        const s=v.segment;
        const len=Math.hypot(s.bx-s.ax,s.bz-s.az)||.001;
        const distToEnd=(v.dir>0 ? 1-v.t : v.t)*len;

        if(remaining<distToEnd){
          v.t+=v.dir*(remaining/len);
          remaining=0;
          break;
        }

        // Do not cross the node during the short stop interval.
        if(v.junctionWait>0){
          v.t=v.dir>0 ? .998 : .002;
          remaining=0;
          break;
        }

        remaining-=distToEnd;
        const atB=v.dir>0;
        const next=localTrafficContinuation(v,atB);
        if(next){
          v.segment=next.segment;
          v.dir=next.dir;
          v.t=next.startT!==undefined ? next.startT : (v.dir>0 ? 0 : 1);
          v.roadName=roadDisplayName(v.segment)||v.segment.type;

          // Once the vehicle has entered the new segment, do not immediately
          // stop again at the same consolidated node from the opposite side.
          if(next.junction){
            v.junctionServedKey=`${next.junction.x.toFixed(1)},${next.junction.z.toFixed(1)}`;
          }
        }else{
          // A genuine dead-end or branch with no legal junction continuation:
          // turn around rather than driving off into terrain.
          v.dir*=-1;
          v.t=v.dir>0 ? .002 : .998;
        }
      }

      placeLocalTrafficVehicle(v);

      const dx=v.mesh.position.x-player.x;
      const dz=v.mesh.position.z-player.z;
      const distance=Math.hypot(dx,dz);

      // Only collide when the player is also on a procedural surface road.
      // This prevents an over/under-crossing vehicle from striking the player
      // merely because their X/Z projections overlap.
      if(playerOnLocalRoad && distance<3.2 && v.hitCooldown<=0){
        const side=Math.sign(dx||1);
        player.speed*=.46;
        player.heading+=side*.045;
        player.x-=side*.32;
        player.collisionShake=Math.max(player.collisionShake,.24);
        player.controlPenalty=Math.max(player.controlPenalty,.42);
        v.speed*=.68;
        v.hitCooldown=.85;
      }

      if(distance>760) remove.push(v);
    }

    for(const v of remove){
      world.remove(v.mesh);
      const idx=localRoadTraffic.indexOf(v);
      if(idx>=0) localRoadTraffic.splice(idx,1);
    }
  }

  function spawnTraffic(force=false) {
    if ((!trafficEnabled || settings.trafficDensity <= 0) && !force) return;
    const desired = Math.round(settings.trafficDensity * 12);
    if (!force && traffic.length >= desired) return;
    if (!force && Math.random() > .035 * settings.trafficDensity) return;
    const opposing = Math.random() < .34;
    const lanes = opposing ? opposingCenters : laneCenters;
    const lane = lanes[(Math.random()*lanes.length)|0];
    let z = player.z - (130 + Math.random()*850);
    if (opposing) z = player.z - (250 + Math.random()*750);
    const types=['compact','sedan','sedan','wagon','pickup','van','box','semi'];
    const type=types[(Math.random()*types.length)|0];
    const mesh=makeVehicle(type);
    mesh.position.set(laneWorldX(lane, z), roadCenterYAtZ(z), z);
    mesh.rotation.y = roadHeadingAtZ(z) + (opposing ? Math.PI : 0);
    world.add(mesh);
    traffic.push({
      mesh,
      lane,
      targetLane: lane,
      laneChangeT: 1,
      laneChangeFrom: lane,
      opposing,
      speed: trafficCruiseSpeedForLane(lane, opposing),
      targetSpeed: trafficCruiseSpeedForLane(lane, opposing),
      hitCooldown: 0,
      decisionTimer: 1.5 + Math.random()*4,
      braking: false
    });
  }

  const player = {
    x: REST_START.x,
    y: REST_START.y,
    z: REST_START.z,
    speed: 0,
    heading: REST_START.heading,
    steer: 0,
    distance: 0,
    collisionShake: 0,
    controlPenalty: 0
  };

  // Give the title/menu background the same believable driver-eye viewpoint
  // before the first gameplay update runs.
  const DEG = Math.PI / 180;
  const BASE_EYE_Y = 1.78;
  const BASE_EYE_Z = 0.12;
  const BASE_PITCH = -0.006;

  function applyCameraPose(bob=0, shake=0) {
    const pitch = settings.camPitch * DEG;
    const yaw = settings.camYaw * DEG;
    const roll = settings.camRoll * DEG;

    // Move/aim the actual eye in world space.
    camera.position.set(
      player.x + settings.camX + shake * .55,
      player.y + BASE_EYE_Y + settings.camY + bob + shake,
      player.z + BASE_EYE_Z + settings.camZ
    );
    camera.rotation.set(
      BASE_PITCH + pitch + (settings.cameraBob ? Math.sin(player.distance*.22)*.003 : 0),
      player.heading + yaw,
      roll - player.steer*.018
    );

    // The cab is parented to the camera for cheap first-person rendering. Counter-transform
    // it so camera tuning behaves like moving the driver's head INSIDE the truck rather
    // than dragging the truck along with the camera.
    cab.position.x = CAB_BASE.x - settings.camX;
    cab.position.y = CAB_BASE.y - settings.camY;
    cab.position.z = CAB_BASE.z - settings.camZ;
    cab.rotation.x = -pitch;
    cab.rotation.y = -yaw;
    cab.rotation.z = -roll + player.steer*.012;
  }

  applyCameraPose();
  const keys = Object.create(null);
  let running = false, paused = false, started = false;

  function resetPlayer() {
    player.x = REST_START.x;
    player.y = REST_START.y;
    player.z = REST_START.z;
    player.speed = 0;
    player.heading = REST_START.heading;
    player.steer = 0;
    player.collisionShake = .1;
    player.controlPenalty = 0;
  }


  function collisionSurfaceInfo(x, z, y=player.y) {
    const localX = localRoadX(x, z);
    let sideLimit = 36;
    let onCrossroad = false;
    let onRamp = false;
    let onAuxLane = false;
    let onRestArea = false;
    let crossingIndex = null;

    if (restAreaSurfaceYAt(x,z) !== null) {
      onRestArea = true;
      sideLimit = 90;
    }

    for (const idx of nearbyCrossingIndices(z)) {
      const info = crossingInfo(idx);
      if (!info) continue;

      const p = worldToCrossingLocal(idx, x, z);
      const baseY = roadCenterYAtZ(-idx*SEG_LEN);
      const bridgeHeight = y > baseY + 2.15;

      if (Math.abs(p.z) <= CROSSROAD_HALF_WIDTH + 1.0 &&
          Math.abs(p.x) <= 320 &&
          (Math.abs(p.x) >= 14 || bridgeHeight)) {
        onCrossroad = true;
        sideLimit = 90;
        crossingIndex = idx;
      }

      const ruralY = ruralRoadSurfaceAtCrossing(idx,x,z);
      if (ruralY !== null) {
        onCrossroad = true;
        sideLimit = 380;
        crossingIndex = idx;
      }

      if (info.accessible) {
        const aux=auxiliaryLaneHitAtCrossing(idx,x,z);
        if(aux){
          onAuxLane=true;
          sideLimit=90;
          crossingIndex=idx;
        }

        const off = nearestRampHit(p,'off');
        const on = nearestRampHit(p,'on');
        if (off.distance <= off.halfWidth + .55 || on.distance <= on.halfWidth + .55) {
          onRamp = true;
          sideLimit = 90;
          crossingIndex = idx;
        }
      }
    }

    return { localX, sideLimit, onCrossroad, onRamp, onAuxLane, onRestArea, crossingIndex };
  }

  function applyRoadsideCollision(pushDir, severity=.72) {
    player.speed *= severity;
    player.heading += pushDir * .035;
    player.x += pushDir * .28;
    player.collisionShake = Math.max(player.collisionShake, .22);
    player.controlPenalty = Math.max(player.controlPenalty, .28);
  }

  function updatePlayer(dt) {
    const accel = keys.KeyW || keys.ArrowUp;
    const brake = keys.KeyS || keys.ArrowDown;
    const hardBrake = keys.Space;
    const left = keys.KeyA || keys.ArrowLeft;
    const right = keys.KeyD || keys.ArrowRight;

    if(accel) player.speed += 7.4*dt;
    else player.speed -= (0.9 + player.speed*.012)*dt;
    if(brake) player.speed -= 12.5*dt;
    if(hardBrake) player.speed -= 22*dt;
    const roadLocalX = localRoadX(player.x, player.z);
    const earlySurfaceInfo = collisionSurfaceInfo(player.x, player.z, player.y);
    const surfaceYHere = drivableSurfaceYAt(player.x, player.z, player.y);
    const onElevatedRoad = surfaceYHere > SURFACE_ROAD_Y + .7;
    const proceduralRoadHere=proceduralRoadInfoAt(player.x,player.z);
    const onProceduralRoad=proceduralRoadHere!==null;
    const offroad = Math.abs(roadLocalX) > 12.0 &&
                    !onElevatedRoad &&
                    !onProceduralRoad &&
                    !earlySurfaceInfo.onRamp &&
                    !earlySurfaceInfo.onAuxLane &&
                    !earlySurfaceInfo.onCrossroad &&
                    !earlySurfaceInfo.onRestArea;
    if(offroad) player.speed -= (3.5 + player.speed*.05)*dt;
    else if(proceduralRoadHere?.dirt){
      player.speed -= (1.15 + player.speed*.018)*dt;
    }
    player.speed = THREE.MathUtils.clamp(player.speed,0,42); // ~94 mph

    const targetSteer = ((left?1:0)-(right?1:0));
    const steerResponse = Math.max(.25, 1-player.controlPenalty);
    player.steer += (targetSteer-player.steer)*Math.min(1,dt*8.2*steerResponse);

    // Much tighter at low speed for ramps / crossroads, progressively calmer
    // at freeway speed. Do not forcibly recenter vehicle heading toward world
    // north; the truck now holds the direction the driver actually steers.
    const speedRatio=THREE.MathUtils.clamp(player.speed/42,0,1);
    let steerRate=THREE.MathUtils.lerp(1.35,.30,speedRatio);

    // Ramps are broad, sweeping roads now; reduce twitchiness at speed while
    // preserving low-speed maneuverability for the country-road end.
    if(earlySurfaceInfo.onRamp){
      steerRate*=THREE.MathUtils.lerp(1.02,.78,speedRatio);
    }else if(earlySurfaceInfo.onCrossroad){
      steerRate*=THREE.MathUtils.lerp(1.0,.88,speedRatio);
    }
    if(player.speed>.25) player.heading+=player.steer*steerRate*dt;

    player.x -= Math.sin(player.heading) * player.speed * dt;
    player.z -= Math.cos(player.heading) * player.speed * dt;
    player.distance += player.speed*dt;
    player.controlPenalty = Math.max(0,player.controlPenalty-dt*.8);

    const targetSurfaceY=drivableSurfaceYAt(player.x,player.z,player.y);
    const interchangeSurface=interchangeSurfaceInfoAt(player.x,player.z,player.y);

    // Surface-following is intentionally softer through the engineered
    // interchange chain. The road profile supplies the shape; this filter only
    // removes residual frame-to-frame snapping without flattening the grade.
    const verticalResponse=interchangeSurface
      ? (interchangeSurface.type==='ramp'?5.2:
         interchangeSurface.type==='aux'?6.0:
         interchangeSurface.type==='bridge'?5.6:5.0)
      : 7.0;
    player.y += (targetSurfaceY-player.y)*Math.min(1,dt*verticalResponse);

    const roadCenterNow = roadCenterXAtZ(player.z);
    const cinfo = collisionSurfaceInfo(player.x, player.z);

    // Guardrail/concrete median collision. Dirt/grass medians remain traversable.
    const currentSeg = currentSegment();
    const medianType = currentSeg?.userData?.medianType;
    if ((medianType === 'concrete' || medianType === 'guardrail') &&
        Math.abs(cinfo.localX) < 1.05 &&
        !cinfo.onRamp && !cinfo.onAuxLane && !cinfo.onCrossroad && !cinfo.onRestArea) {
      const side = Math.sign(cinfo.localX || 1);
      player.x = roadCenterNow + side*1.08;
      applyRoadsideCollision(side, .58);
    }

    // No lateral world boundary. Once the player leaves I-9, the 2D terrain
    // generator follows them indefinitely in X and Z. Only actual physical
    // objects/median barriers should redirect the truck.
    // If the player is on an actual rural road, don't apply freeway-oriented
    // shoulder logic simply because they're far from I-9.
    if (cinfo.onCrossroad || cinfo.onRamp || cinfo.onAuxLane || cinfo.onRestArea) {
      player.controlPenalty = Math.max(0, player.controlPenalty - dt*.35);
    }

    const bob = settings.cameraBob ? Math.sin(player.distance*.38)*.012*Math.min(1,player.speed/15) : 0;
    const shake = player.collisionShake>0 ? (Math.random()-.5)*player.collisionShake : 0;
    updateTruckExterior();
    if (exteriorView) applyExteriorCameraPose();
    else applyCameraPose(bob, shake);
    player.collisionShake=Math.max(0,player.collisionShake-dt*.6);
    // Small vehicle-body motion is layered on top of the camera-relative cab pose.
    if (!exteriorView) cab.position.y += -Math.max(0,(accel?0.008:0)) + (brake||hardBrake?.015:0) + bob*.5;
    cab.userData.steeringWheel.rotation.z = player.steer*.72;
    cab.userData.spoke.rotation.z = player.steer*.72;
  }

  function collide(push=0) {
    player.speed *= .47;
    player.x += push;
    player.heading += push*.012;
    player.collisionShake=.16;
    player.controlPenalty=.45;
  }

  function updateTraffic(dt) {
    if (!trafficEnabled) {
      traffic.forEach(t => world.remove(t.mesh));
      traffic.length = 0;
      return;
    }

    const maxTraffic = Math.round(18 * settings.trafficDensity);
    if (traffic.length < maxTraffic && Math.random() < dt * (0.7 + settings.trafficDensity * 1.2)) {
      spawnTraffic();
    }

    // Sort same-direction vehicles by z so simple car-following can estimate gaps.
    const sameDir = traffic.filter(t => !t.opposing).sort((a,b)=>a.mesh.position.z-b.mesh.position.z);
    const oppDir = traffic.filter(t => t.opposing).sort((a,b)=>b.mesh.position.z-a.mesh.position.z);

    function laneGapAhead(t, list) {
      let gap = Infinity;
      for (const o of list) {
        if (o === t) continue;
        if (Math.abs(o.lane - t.lane) > .2) continue;
        const dz = t.opposing
          ? (o.mesh.position.z - t.mesh.position.z)
          : (t.mesh.position.z - o.mesh.position.z);
        if (dz > 0 && dz < gap) gap = dz;
      }
      return gap;
    }

    function laneClear(t, candidateLane, list) {
      for (const o of list) {
        if (o === t) continue;
        if (Math.abs(o.lane - candidateLane) > .3) continue;
        const dz = Math.abs(o.mesh.position.z - t.mesh.position.z);
        if (dz < 24) return false;
      }
      return true;
    }

    const toRemove = [];

    for (const t of traffic) {
      t.hitCooldown = Math.max(0, t.hitCooldown - dt);
      t.decisionTimer -= dt;

      const list = t.opposing ? oppDir : sameDir;
      const gapAhead = laneGapAhead(t, list);

      // Periodically choose behavior.
      if (t.decisionTimer <= 0) {
        t.decisionTimer = 1.8 + Math.random()*3.8;

        // Gradually vary cruise speed rather than abruptly changing it.
        if (Math.random() < .35) {
          t.targetSpeed = trafficCruiseSpeedForLane(t.targetLane, t.opposing);
        }

        // If boxed in behind a slower car, try one adjacent lane.
        if (gapAhead < 34 && t.laneChangeT >= 1) {
          const lanes = t.opposing ? opposingCenters : laneCenters;
          const idx = laneIndexFromLocalX(t.lane, t.opposing);
          const preferred = [];
          if (idx > 0) preferred.push(lanes[idx-1]);
          if (idx < lanes.length-1) preferred.push(lanes[idx+1]);

          for (const cand of preferred) {
            if (laneClear(t, cand, list)) {
              t.laneChangeFrom = t.lane;
              t.targetLane = cand;
              t.laneChangeT = 0;
              break;
            }
          }
        }
      }

      // Car-following: brake progressively as the gap shrinks.
      let desired = t.targetSpeed;
      if (gapAhead < 46) desired = Math.min(desired, 20);
      if (gapAhead < 30) desired = Math.min(desired, 15);
      if (gapAhead < 18) desired = Math.min(desired, 8);
      if (gapAhead < 11) desired = Math.min(desired, 2.5);

      t.braking = desired < t.speed - 1;
      t.speed += (desired - t.speed) * Math.min(1, dt * (t.braking ? 2.7 : .7));

      // Smooth lane change over roughly 1.5 sec.
      if (t.laneChangeT < 1) {
        t.laneChangeT = Math.min(1, t.laneChangeT + dt / 1.5);
        const q = t.laneChangeT * t.laneChangeT * (3 - 2*t.laneChangeT);
        t.lane = THREE.MathUtils.lerp(t.laneChangeFrom, t.targetLane, q);
      } else {
        t.lane = t.targetLane;
      }

      if(t.opposing) t.mesh.position.z += t.speed*dt;
      else t.mesh.position.z -= t.speed*dt;

      t.mesh.position.x = laneWorldX(t.lane, t.mesh.position.z);
      t.mesh.position.y = roadCenterYAtZ(t.mesh.position.z);
      t.mesh.rotation.y = roadHeadingAtZ(t.mesh.position.z) + (t.opposing ? Math.PI : 0);

      // Player/traffic collision uses a slightly wider lateral envelope and
      // front/rear depth approximation. This is still intentionally lightweight.
      const dz = t.mesh.position.z-player.z;
      const dx = t.mesh.position.x-player.x;
      const closeZ = Math.abs(dz) < 3.4;
      const closeX = Math.abs(dx) < 1.45;

      if(closeZ && closeX && t.hitCooldown<=0){
        const side = Math.sign(dx || 1);
        player.speed *= .38;
        player.heading += side * .055;
        player.x -= side * .45;
        player.collisionShake = Math.max(player.collisionShake, .32);
        player.controlPenalty = Math.max(player.controlPenalty, .55);
        t.speed *= .72;
        t.hitCooldown = .9;
      }

      // Cleanly remove distant traffic.
      if(Math.abs(t.mesh.position.z-player.z) > 520){
        toRemove.push(t);
      }
    }

    for (const t of toRemove) {
      world.remove(t.mesh);
      const i = traffic.indexOf(t);
      if (i >= 0) traffic.splice(i,1);
    }
  }

  function currentRoadContext() {
    if (restAreaSurfaceYAt(player.x,player.z) !== null) return 'Interstate 9 Rest Area';

    for (const idx of nearbyCrossingIndices(player.z)) {
      const info = crossingInfo(idx);
      if (!info) continue;
      const p = worldToCrossingLocal(idx,player.x,player.z);
      const rural = ruralRoadSurfaceAtCrossing(idx,player.x,player.z);
      if (rural !== null) return `Rural road — ${info.roadName}`;
      if (info.accessible) {
        const off = nearestRampHit(p,'off');
        const on = nearestRampHit(p,'on');
        if (off.distance <= off.halfWidth+.55) return `Offramp — ${info.roadName}`;
        if (on.distance <= on.halfWidth+.55) return `Onramp — ${info.roadName}`;
      }
    }
    const procRoad=proceduralRoadInfoAt(player.x,player.z);
    if(procRoad){
      if(procRoad.routeTier==='truck-stop') return `Coyote Junction Truck Plaza — ${procRoad.roadName||'internal road'}`;
      if(procRoad.dirt) return 'Dirt road';
      if(procRoad.type==='driveway') return 'Driveway / roadside property';
      if(procRoad.toInterstate && procRoad.crossing){
        return `County road — leads to I-9 Exit ${procRoad.crossing.exitNumber}`;
      }
      if(procRoad.type==='county-t-junction') return 'Rural side road';
      return 'County road';
    }

    const dx=localRoadX(player.x,player.z);
    if(Math.abs(dx) > ROAD_HALF+3){
      const miles=Math.abs(dx)/1609.344;
      // +localX is east/right of the northbound carriageway in this world.
      const toward = dx>0 ? 'west' : 'east';
      return `Open countryside — I-9 ~${miles.toFixed(miles<1?.2:1)} mi ${toward}`;
    }
    return 'Interstate 9';
  }

  function currentLane(){
    const localX = localRoadX(player.x, player.z);
    let best=0,dist=999;
    laneCenters.forEach((x,i)=>{
      const d=Math.abs(localX-x);
      if(d<dist){dist=d;best=i;}
    });
    return dist<LANE_W*.75 ? ['Left','Center','Right'][best] : 'Shoulder/Off-road';
  }
  function currentSegment(){ const idx=Math.floor((-player.z)/SEG_LEN); return segments.find(s=>s.userData.index===idx); }
  let fps = 0;
  let frames = 0;
  let fpsTime = performance.now();

  const performanceSceneStats={
    visibleObjects:0,
    meshes:0,
    instancedMeshes:0,
    sprites:0,
    geometries:0,
    materials:0,
    textures:0
  };
  let performanceSceneStatsTime=0;

  function totalProceduralCacheEntries() {
    return proceduralRoadCache.size+
      renderableRoadCache.size+
      neighborRoadCache.size+
      junctionCache.size+
      consolidatedJunctionCache.size+
      roadsideSiteCache.size+
      tilePlanCache.size+
      serializedRoadTileCache.size+
      hamletTileCache.size;
  }

  function updateLongSessionTelemetry() {
    maxObservedWorldTiles=Math.max(maxObservedWorldTiles,worldTiles.size);
    maxObservedCacheEntries=Math.max(
      maxObservedCacheEntries,
      totalProceduralCacheEntries()
    );
  }

  function updatePerformanceSceneStats(now) {
    if(now-performanceSceneStatsTime<1000) return;
    performanceSceneStatsTime=now;
    updateLongSessionTelemetry();

    let visibleObjects=0,meshes=0,instancedMeshes=0,sprites=0;
    const geoms=new Set(),materials=new Set(),textures=new Set();

    scene.traverseVisible(o=>{
      visibleObjects++;
      if(o.isInstancedMesh) instancedMeshes++;
      if(o.isMesh) meshes++;
      if(o.isSprite) sprites++;

      if(o.geometry) geoms.add(o.geometry);
      const mats=Array.isArray(o.material)?o.material:(o.material?[o.material]:[]);
      for(const m of mats){
        materials.add(m);
        if(m.map) textures.add(m.map);
      }
    });

    Object.assign(performanceSceneStats,{
      visibleObjects,meshes,instancedMeshes,sprites,
      geometries:geoms.size,
      materials:materials.size,
      textures:textures.size
    });
  }

  function updateUI(now, forceDebugReport=false) {
    speedEl.textContent=Math.round(player.speed*2.23694);
    tripEl.textContent=(player.distance/1609.344).toFixed(1);
    frames++; if(now-fpsTime>=500){fps=Math.round(frames*1000/(now-fpsTime));frames=0;fpsTime=now;}
    if(fpsValue) fpsValue.textContent=String(fps);
    if(debugVisible || forceDebugReport){
      updatePerformanceSceneStats(now);
      const s=currentSegment();
      const cidx = nearbyCrossingIndices(player.z).sort((a,b)=>Math.abs(player.z+a*SEG_LEN)-Math.abs(player.z+b*SEG_LEN))[0];
      const ci = crossingInfo(cidx);
      const crossingLabel = ci ? `${ci.accessible?'INTERCHANGE':'OVERPASS'} — ${ci.roadName}${ci.accessible?` / EXIT ${ci.exitNumber}`:''}` : 'none nearby';
      debugText.textContent = `FPS: ${fps}\nSpeed: ${Math.round(player.speed*2.23694)} mph\nFreeway segments: ${segments.length} (queue ${freewaySegmentQueue.length})\nFreeway build ms last/avg/max: ${freewayBuildProfile.lastMs.toFixed(1)} / ${(freewayBuildProfile.count?freewayBuildProfile.totalMs/freewayBuildProfile.count:0).toFixed(1)} / ${freewayBuildProfile.maxMs.toFixed(1)}\nFreeway base/scenery last ms: ${freewayBuildProfile.baseLastMs.toFixed(1)} / ${freewayBuildProfile.sceneryLastMs.toFixed(1)}\nFreeway stream ms last/max: ${freewayStreamLastMs.toFixed(1)} / ${freewayStreamMaxMs.toFixed(1)}\nFreeway scenery queue/work: ${freewaySceneryQueue.length} / ${freewaySceneryLastFrameMs.toFixed(1)} ms\nHeavy freeway chunks: ${freewayBuildProfile.heavyCount}\nUnified stream budget/work: ${unifiedStreamingProfile.frameBudgetMs.toFixed(1)} / ${unifiedStreamingProfile.lastMs.toFixed(1)} ms\nUnified jobs/skipped: ${unifiedStreamingProfile.lastJobs} / ${unifiedStreamingProfile.skippedJobs}\nUnified stream max ms: ${unifiedStreamingProfile.maxMs.toFixed(1)}\nFrame work ms last/avg/p95/max: ${frameProfileLastTotalMs.toFixed(1)} / ${frameProfileAvgMs.toFixed(1)} / ${frameProfileP95Ms.toFixed(1)} / ${frameProfileMaxMs.toFixed(1)}\nFrame spikes ≥${FRAME_SPIKE_MS}ms: ${frameProfileSpikeCount}\nLast frame hotspot: ${frameProfileLastHotspot}\nLatest spike: ${latestFrameSpikeSummary()}\nTop avg frame parts: ${frameProfileTopAverageParts()}\nTop max frame parts: ${frameProfileTopMaxParts()}\nFreeway index registry: ${freewaySegmentByIndex.size}\nWorld tiles: ${worldTiles.size}\nTraffic: ${traffic.length} freeway / ${localRoadTraffic.length} rural (${localRoadTraffic.filter(v=>(v.junctionWait||0)>0).length} stopped) / ${truckStopTraffic.filter(v=>v.mesh.visible).length} plaza\nDraw calls: ${renderer.info.render.calls}\nTriangles: ${renderer.info.render.triangles}\nVisible objects: ${performanceSceneStats.visibleObjects}\nMeshes: ${performanceSceneStats.meshes} (${performanceSceneStats.instancedMeshes} instanced)\nGeometry / Materials / Textures: ${performanceSceneStats.geometries} / ${performanceSceneStats.materials} / ${performanceSceneStats.textures}\nBase tile ms last/recent/max: ${tileBuildProfile.lastMs.toFixed(1)} / ${tileBuildProfile.recentAvgMs.toFixed(1)} / ${tileBuildProfile.maxMs.toFixed(1)}\nScenery tile ms last/recent/max: ${tileSceneryBuildProfile.lastMs.toFixed(1)} / ${tileSceneryBuildProfile.recentAvgMs.toFixed(1)} / ${tileSceneryBuildProfile.maxMs.toFixed(1)}\nHeavy base/scenery tiles: ${tileBuildProfile.heavyCount} / ${tileSceneryBuildProfile.heavyCount}\nStream queue / bases built: ${tileStreamQueue.length} / ${tileStreamLastBuilt}\nScenery queue / built: ${tileSceneryQueue.length} / ${tileSceneryLastBuilt}\nScenery work ms last/max: ${tileSceneryLastFrameMs.toFixed(1)} / ${tileSceneryMaxFrameMs.toFixed(1)}\nHeavy scenery stops: ${tileSceneryHeavyStops}\nQueue wait ms oldest/max: ${tileStreamOldestWaitMs.toFixed(0)} / ${tileStreamMaxWaitMs.toFixed(0)}\nHeavy-stream stops / starvation: ${tileStreamHeavyStops} / ${tileStreamStarvationEvents}\nPredicted stream center: ${tileStreamPredictedCenterX??'-'}, ${tileStreamPredictedCenterZ??'-'}\nAdaptive stream budget: ${tileStreamAdaptiveBudgetMs.toFixed(1)} ms / ${tileStreamAdaptiveMaxTiles} tiles\nStream work ms last/max: ${tileStreamLastFrameMs.toFixed(1)} / ${tileStreamMaxFrameMs.toFixed(1)}\nRoad build queue/stages: ${tileRoadBuildQueue.length}/${tileRoadBuildLastStages}\nRoad build work ms last/max: ${tileRoadBuildLastMs.toFixed(1)} / ${tileRoadBuildMaxMs.toFixed(1)}\nJunction substage ms last/max: ${junctionSubstageLastMs.toFixed(1)} / ${junctionSubstageMaxMs.toFixed(1)}\nJunction substage calls/completed: ${junctionSubstageCalls}/${junctionSubstageCompleted}\nRoad phase avg/max ms: ${compactPhaseProfile(roadBuildPhaseProfile)}\nJunction phase avg/max ms: ${compactPhaseProfile(junctionPhaseProfile)}\nRoad tiles completed: ${tileRoadBuildCompleted}\nUnload queue / removed: ${tileUnloadQueue.length} / ${tileUnloadLastCount}\nUnload work ms last/max: ${tileUnloadLastFrameMs.toFixed(1)} / ${tileUnloadMaxFrameMs.toFixed(1)}\nRoad caches: ${proceduralRoadCache.size}/${renderableRoadCache.size}/${neighborRoadCache.size}\nJunction caches: ${junctionCache.size}/${consolidatedJunctionCache.size}\nTile-plan worker: ${tilePlanWorkerSupported?'ON':'fallback'} q/inflight/done ${tilePlanWorkerQueue.length}/${tilePlanWorkerInFlight.size}/${tilePlanWorkerCompleted}\nTile-plan ms last/max: ${tilePlanWorkerLastMs.toFixed(1)} / ${tilePlanWorkerMaxMs.toFixed(1)}\nTile-plan dispatch/hit/fallback: ${tilePlanWorkerDispatches}/${tilePlanCacheHits}/${tilePlanFallbacks}\nShared road payload cache: ${serializedRoadTileCache.size} tiles · hit/miss ${serializedRoadCacheHits}/${serializedRoadCacheMisses}\nSerialized road records built: ${serializedRoadRecordsBuilt}\nWorker feed dispatch last/max: ${workerPipelineLastDispatches}/${workerPipelineMaxDispatches}\nScenery manifest use/fallback: ${tileManifestUses}/${tileManifestFallbacks}\nJunction worker: ${junctionWorkerSupported?'ON':'fallback'} q/inflight/done ${junctionWorkerPrefetchQueue.length}/${junctionWorkerInFlight.size}/${junctionWorkerCompleted}\nWorker junction ms last/max: ${junctionWorkerLastMs.toFixed(1)} / ${junctionWorkerMaxMs.toFixed(1)}\nWorker dispatch/cache-hit/fallback: ${junctionWorkerDispatches}/${junctionWorkerCacheHits}/${junctionWorkerFallbacks}\nTotal procedural caches: ${totalProceduralCacheEntries()} (max ${maxObservedCacheEntries})\nWorld tiles max observed: ${maxObservedWorldTiles}\nRenderer memory G/T: ${renderer.info.memory.geometries} / ${renderer.info.memory.textures}\nKnown heavy tile cache: ${heavyTileBuildCache.size}\nSign cache: ${crossStreetSignCache.size+truckStopSignCache.size+fixedServiceSignCache.size}\nOne-sided sign sprites: ${oneSidedSignSprites.size}\nStatic plaza batches: curbs + markings + buildings/details + parked vehicles\nLane: ${currentLane()}\nCurvature: ${(s?.userData.curvature||0).toFixed(5)}\nElevation: ${player.y.toFixed(2)}\nDistance: ${(player.distance/1609.344).toFixed(2)} mi\nRoad: ${currentRoadContext()}\nNearest crossing: ${crossingLabel}\nLane changes: ${traffic.filter(t=>t.laneChangeT<1).length}\nBraking traffic: ${traffic.filter(t=>t.braking).length}`;
    }
  }

  const MAP_ZOOM_LEVELS = [420, 560, 750, 1000, 1350, 1800, 2500, 3400, 4600, 6200];
  let mapZoomIndex = 5;
  let mapCenterX = REST_START.x;
  let mapCenterZ = REST_START.z;
  let mapTravelTarget = null;

  function mapWorldToCanvas(x,z,bounds) {
    return {
      x:(x-bounds.minX)/(bounds.maxX-bounds.minX)*worldMapCanvas.width,
      y:(z-bounds.minZ)/(bounds.maxZ-bounds.minZ)*worldMapCanvas.height
    };
  }

  function mapCanvasToWorld(clientX,clientY,bounds) {
    const rect=worldMapCanvas.getBoundingClientRect();
    const px=(clientX-rect.left)/Math.max(1,rect.width)*worldMapCanvas.width;
    const py=(clientY-rect.top)/Math.max(1,rect.height)*worldMapCanvas.height;
    return {
      x:THREE.MathUtils.lerp(bounds.minX,bounds.maxX,THREE.MathUtils.clamp(px/worldMapCanvas.width,0,1)),
      z:THREE.MathUtils.lerp(bounds.minZ,bounds.maxZ,THREE.MathUtils.clamp(py/worldMapCanvas.height,0,1))
    };
  }

  function wrapAngle(a) {
    while(a>Math.PI) a-=Math.PI*2;
    while(a<-Math.PI) a+=Math.PI*2;
    return a;
  }

  function nearestRoadSegmentForTeleport(x,z) {
    const tx=worldTileIndexForCoord(x);
    const tz=worldTileIndexForCoord(z);
    let best=null;
    for(let dz=-1;dz<=1;dz++){
      for(let dx=-1;dx<=1;dx++){
        const all=[
          ...proceduralRoadSegmentsForTile(tx+dx,tz+dz),
          ...roadsideDrivewaySegmentsForTile(tx+dx,tz+dz)
        ];
        for(const s of all){
          const hit=pointSegmentDistance2D(x,z,s.ax,s.az,s.bx,s.bz);
          if(!best || hit.distance<best.distance) best={distance:hit.distance,segment:s,hit};
        }
      }
    }
    return best;
  }

  function headingForTeleport(x,z,currentHeading) {
    const local=Math.abs(localRoadX(x,z));
    if(local<=ROAD_HALF+4){
      const h=roadHeadingAtZ(z);
      const north=h;
      const south=wrapAngle(h+Math.PI);
      return Math.abs(wrapAngle(north-currentHeading))<=Math.abs(wrapAngle(south-currentHeading))
        ? north : south;
    }

    const nearest=nearestRoadSegmentForTeleport(x,z);
    if(nearest && nearest.distance<=8){
      const s=nearest.segment;
      const dx=s.bx-s.ax,dz=s.bz-s.az;
      const h1=Math.atan2(-dx,-dz);
      const h2=wrapAngle(h1+Math.PI);
      return Math.abs(wrapAngle(h1-currentHeading))<=Math.abs(wrapAngle(h2-currentHeading))
        ? h1 : h2;
    }
    return currentHeading;
  }

  function mapTargetDescription(target) {
    const dx=localRoadX(target.x,target.z);
    const miles=Math.abs(dx)/1609.344;
    let where;
    if(Math.abs(dx)<=ROAD_HALF+5) where='Interstate 9';
    else {
      const tx=worldTileIndexForCoord(target.x);
      const tz=worldTileIndexForCoord(target.z);
      let hamletHit=null;
      let siteHit=null;
      for(let oz=-1;oz<=1&&(!hamletHit||!siteHit);oz++){
        for(let ox=-1;ox<=1&&(!hamletHit||!siteHit);ox++){
          if(!hamletHit){
            const h=hamletForTile(tx+ox,tz+oz);
            if(h && Math.hypot(target.x-h.x,target.z-h.z)<70) hamletHit=h;
          }
          if(!siteHit){
            const site=roadsideSiteForTile(tx+ox,tz+oz);
            if(site && Math.hypot(target.x-site.sx,target.z-site.sz)<24) siteHit=site;
          }
        }
      }
      const truckP=truckStopWorldPoint(270,110);
      const truckStopHit=Math.hypot(target.x-truckP.x,target.z-truckP.z)<165;

      if(truckStopHit){
        where=TRUCK_STOP_NAME;
      }else if(hamletHit){
        const roadSummary=(hamletHit.roads||[])
          .slice(0,2)
          .map(r=>r.name)
          .join(' / ');
        where=roadSummary ? `${hamletHit.name} · ${roadSummary}` : hamletHit.name;
      }else if(siteHit){
        where=roadsideSiteDisplayName(siteHit);
      }else{
        const road=proceduralRoadInfoAt(target.x,target.z);
        if(road?.roadName){
          where=road.routeTier==='major' ? `${road.roadName} (major county route)` : road.roadName;
        }
        else if(road?.dirt) where='dirt road';
        else if(road) where='county/local road';
        else where='open countryside';
      }
    }
    const side=dx>=0?'east':'west';
    const fromPlayer=Math.hypot(target.x-player.x,target.z-player.z)/1609.344;
    return `${where} · ${fromPlayer.toFixed(2)} mi from truck · ${miles.toFixed(2)} mi ${side} of I-9 · X ${target.x.toFixed(0)} / Z ${target.z.toFixed(0)}`;
  }

  function setMapTravelTarget(x,z) {
    mapTravelTarget={x,z};
    mapTargetInfo.textContent=mapTargetDescription(mapTravelTarget);
    mapGoHere.disabled=false;
    mapClearTarget.disabled=false;
    drawWorldMap();
  }

  function clearMapTravelTarget() {
    mapTravelTarget=null;
    mapTargetInfo.textContent='No destination selected.';
    mapGoHere.disabled=true;
    mapClearTarget.disabled=true;
    drawWorldMap();
  }

  function fastTravelToTarget() {
    if(!mapTravelTarget) return;

    const tx=mapTravelTarget.x;
    const tz=mapTravelTarget.z;
    const oldHeading=player.heading;

    player.x=tx;
    player.z=tz;
    player.heading=headingForTeleport(tx,tz,oldHeading);
    player.speed=0;
    player.steer=0;
    player.controlPenalty=0;
    player.collisionShake=.08;
    player.y=drivableSurfaceYAt(tx,tz,null)+.02;

    // Retire old traffic so the player cannot materialize inside a vehicle.
    for(const t of traffic) world.remove(t.mesh);
    traffic.length=0;

    // Fast travel is a discontinuous jump, so populate the complete target
    // streaming radius before resuming play rather than exposing empty terrain.
    ensureWorldTiles(true);
    ensureSegments(true);

    mapCenterX=tx;
    mapCenterZ=tz;
    mapTravelTarget=null;
    mapMenu.classList.remove('visible');
    startup.classList.remove('visible');
    pauseMenu.classList.remove('visible');

    running=true;
    started=true;
    paused=false;
    applyCameraPose();
  }

  function mapBoundsForCurrentView() {
    const widthMeters=MAP_ZOOM_LEVELS[mapZoomIndex];
    const aspect=worldMapCanvas.height/worldMapCanvas.width;
    const heightMeters=widthMeters*aspect;
    return {
      minX:mapCenterX-widthMeters/2,
      maxX:mapCenterX+widthMeters/2,
      minZ:mapCenterZ-heightMeters/2,
      maxZ:mapCenterZ+heightMeters/2,
      widthMeters,heightMeters
    };
  }

  function mapStrokeWorldPolyline(points,bounds,color,width,dash=[]) {
    if(points.length<2) return;
    worldMapCtx.save();
    worldMapCtx.strokeStyle=color;
    worldMapCtx.lineWidth=width;
    worldMapCtx.lineCap='round';
    worldMapCtx.lineJoin='round';
    worldMapCtx.setLineDash(dash);
    worldMapCtx.beginPath();
    let started=false;
    for(const p of points){
      const q=mapWorldToCanvas(p.x,p.z,bounds);
      if(!started){worldMapCtx.moveTo(q.x,q.y);started=true;}
      else worldMapCtx.lineTo(q.x,q.y);
    }
    worldMapCtx.stroke();
    worldMapCtx.restore();
  }

  function mapDrawRoadSegment(s,bounds) {
    const a=mapWorldToCanvas(s.ax,s.az,bounds);
    const b=mapWorldToCanvas(s.bx,s.bz,bounds);
    worldMapCtx.save();
    worldMapCtx.lineCap='round';
    const cls=roadClassForType(s.type,s.routeTier);
    worldMapCtx.strokeStyle=s.dirt?'#8a6647':
      cls==='major-county'||cls==='feeder'?'#f7f3e7':'#e8e4d8';
    worldMapCtx.lineWidth=s.dirt?1.4:
      cls==='major-county'||cls==='feeder'?3.0:
      cls==='county'?2.2:
      cls==='truck-stop-local'?1.9:
      cls==='settlement-local'?1.65:
      cls==='connector'||cls==='major-connector'?1.8:1.35;
    if(s.dirt) worldMapCtx.setLineDash([5,4]);
    worldMapCtx.beginPath();
    worldMapCtx.moveTo(a.x,a.y);
    worldMapCtx.lineTo(b.x,b.y);
    worldMapCtx.stroke();
    worldMapCtx.restore();
  }

  function mapDrawInterstate(bounds) {
    const step=Math.max(16,bounds.heightMeters/90);
    const points=[];
    for(let z=bounds.minZ-80;z<=bounds.maxZ+80;z+=step){
      points.push({x:roadCenterXAtZ(z),z});
    }

    // Dark outline + blue route body for readability.
    mapStrokeWorldPolyline(points,bounds,'rgba(27,38,44,.82)',9);
    mapStrokeWorldPolyline(points,bounds,'#315c8b',6);

    // Sparse route shields / labels.
    worldMapCtx.save();
    worldMapCtx.fillStyle='#f7f4e3';
    worldMapCtx.strokeStyle='#244867';
    worldMapCtx.lineWidth=2;
    worldMapCtx.font='bold 13px Arial';
    worldMapCtx.textAlign='center';
    worldMapCtx.textBaseline='middle';
    const labelEvery=Math.max(700,bounds.heightMeters*.48);
    let first=Math.ceil(bounds.minZ/labelEvery)*labelEvery;
    for(let z=first;z<=bounds.maxZ;z+=labelEvery){
      const q=mapWorldToCanvas(roadCenterXAtZ(z),z,bounds);
      worldMapCtx.beginPath();
      worldMapCtx.arc(q.x,q.y,12,0,Math.PI*2);
      worldMapCtx.fill();
      worldMapCtx.stroke();
      worldMapCtx.fillStyle='#244867';
      worldMapCtx.fillText('I-9',q.x,q.y+.5);
      worldMapCtx.fillStyle='#f7f4e3';
    }
    worldMapCtx.restore();
  }

  function mapDrawProceduralRoads(bounds) {
    const tx0=Math.floor(bounds.minX/WORLD_TILE_SIZE)-1;
    const tx1=Math.floor(bounds.maxX/WORLD_TILE_SIZE)+1;
    const tz0=Math.floor(bounds.minZ/WORLD_TILE_SIZE)-1;
    const tz1=Math.floor(bounds.maxZ/WORLD_TILE_SIZE)+1;
    const seen=new Set();
    const labelCandidates=new Map();

    for(let tz=tz0;tz<=tz1;tz++){
      for(let tx=tx0;tx<=tx1;tx++){
        const all=[
          ...proceduralRoadSegmentsForTile(tx,tz),
          ...roadsideDrivewaySegmentsForTile(tx,tz)
        ];
        for(const s of all){
          const key=[
            s.ax.toFixed(1),s.az.toFixed(1),
            s.bx.toFixed(1),s.bz.toFixed(1),
            s.type
          ].join('|');
          if(seen.has(key)) continue;
          seen.add(key);
          mapDrawRoadSegment(s,bounds);

          const name=roadDisplayName(s);
          const cls=roadClassForType(s.type,s.routeTier);
          if(name && (
            cls==='major-county'||cls==='county'||cls==='feeder'||
            cls==='local'||cls==='settlement-local'||cls==='truck-stop-local'
          )){
            const mx=(s.ax+s.bx)/2,mz=(s.az+s.bz)/2;
            if(mx>=bounds.minX&&mx<=bounds.maxX&&mz>=bounds.minZ&&mz<=bounds.maxZ){
              const old=labelCandidates.get(name);
              const tierBonus=(cls==='major-county'||cls==='feeder')?500:cls==='county'?150:0;
              const score=segmentDirectionUnit(s).len+tierBonus;
              if(!old||score>old.score) labelCandidates.set(name,{s,mx,mz,score,cls});
            }
          }
        }
      }
    }

    if(bounds.widthMeters<=2200){
      worldMapCtx.save();
      worldMapCtx.font=bounds.widthMeters<=1000?'bold 10px Arial':'bold 9px Arial';
      worldMapCtx.textAlign='center';
      worldMapCtx.textBaseline='middle';

      let shown=0;
      const maxLabels=bounds.widthMeters<=1000?14:8;
      const orderedLabels=[...labelCandidates.entries()]
        .sort((a,b)=>b[1].score-a[1].score);
      for(const [name,item] of orderedLabels){
        if(shown>=maxLabels) break;
        if(bounds.widthMeters>850 && (item.cls==='local'||item.cls==='settlement-local')) continue;

        const q=mapWorldToCanvas(item.mx,item.mz,bounds);
        const w=Math.min(150,worldMapCtx.measureText(name).width+10);
        worldMapCtx.fillStyle='rgba(246,242,223,.84)';
        worldMapCtx.fillRect(q.x-w/2,q.y-7,w,14);
        worldMapCtx.fillStyle='#384137';
        worldMapCtx.fillText(name,q.x,q.y+.5);
        shown++;
      }
      worldMapCtx.restore();
    }
  }

  function mapHamletHitAtClientPoint(clientX,clientY,bounds) {
    const rect=worldMapCanvas.getBoundingClientRect();
    const px=(clientX-rect.left)/Math.max(1,rect.width)*worldMapCanvas.width;
    const py=(clientY-rect.top)/Math.max(1,rect.height)*worldMapCanvas.height;

    const tx0=Math.floor(bounds.minX/WORLD_TILE_SIZE)-1;
    const tx1=Math.floor(bounds.maxX/WORLD_TILE_SIZE)+1;
    const tz0=Math.floor(bounds.minZ/WORLD_TILE_SIZE)-1;
    const tz1=Math.floor(bounds.maxZ/WORLD_TILE_SIZE)+1;

    let best=null;
    for(let tz=tz0;tz<=tz1;tz++){
      for(let tx=tx0;tx<=tx1;tx++){
        const h=hamletForTile(tx,tz);
        if(!h) continue;
        const q=mapWorldToCanvas(h.x,h.z,bounds);
        const d=Math.hypot(px-q.x,py-q.y);
        if(d<=13 && (!best||d<best.distance)){
          best={hamlet:h,distance:d};
        }
      }
    }
    return best?.hamlet||null;
  }

  function mapDrawTruckStop(bounds) {
    const p=truckStopWorldPoint(270,110);
    if(p.x<bounds.minX||p.x>bounds.maxX||p.z<bounds.minZ||p.z>bounds.maxZ) return;
    const q=mapWorldToCanvas(p.x,p.z,bounds);

    worldMapCtx.save();
    worldMapCtx.fillStyle='#5f4a32';
    worldMapCtx.strokeStyle='#f4ead4';
    worldMapCtx.lineWidth=1.5;
    worldMapCtx.fillRect(q.x-7,q.y-7,14,14);
    worldMapCtx.strokeRect(q.x-7,q.y-7,14,14);

    if(bounds.widthMeters<=3200){
      worldMapCtx.font='bold 10px Arial';
      worldMapCtx.textAlign='left';
      worldMapCtx.textBaseline='middle';
      const w=Math.min(190,worldMapCtx.measureText(TRUCK_STOP_NAME).width+12);
      worldMapCtx.fillStyle='rgba(246,242,223,.94)';
      worldMapCtx.fillRect(q.x+9,q.y-9,w,18);
      worldMapCtx.fillStyle='#3b3129';
      worldMapCtx.fillText(TRUCK_STOP_NAME,q.x+14,q.y);

      if(bounds.widthMeters<=1600){
        worldMapCtx.font='9px Arial';
        worldMapCtx.fillStyle='rgba(246,242,223,.94)';
        const sub='Gas · Food · Lodging · Truck Service';
        const sw=worldMapCtx.measureText(sub).width+12;
        worldMapCtx.fillRect(q.x+9,q.y+10,sw,15);
        worldMapCtx.fillStyle='#3b3129';
        worldMapCtx.fillText(sub,q.x+14,q.y+17);
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawHamlets(bounds) {
    if(bounds.widthMeters>4000) return;
    const tx0=Math.floor(bounds.minX/WORLD_TILE_SIZE)-1;
    const tx1=Math.floor(bounds.maxX/WORLD_TILE_SIZE)+1;
    const tz0=Math.floor(bounds.minZ/WORLD_TILE_SIZE)-1;
    const tz1=Math.floor(bounds.maxZ/WORLD_TILE_SIZE)+1;

    worldMapCtx.save();
    worldMapCtx.textBaseline='middle';
    worldMapCtx.font=bounds.widthMeters<=1800?'bold 11px Arial':'bold 10px Arial';

    for(let tz=tz0;tz<=tz1;tz++){
      for(let tx=tx0;tx<=tx1;tx++){
        const h=hamletForTile(tx,tz);
        if(!h) continue;
        const q=mapWorldToCanvas(h.x,h.z,bounds);
        if(q.x<-20||q.x>worldMapCanvas.width+20||
           q.y<-20||q.y>worldMapCanvas.height+20) continue;

        worldMapCtx.fillStyle='#7b4f38';
        worldMapCtx.strokeStyle='#f2ead8';
        worldMapCtx.lineWidth=1.5;
        worldMapCtx.beginPath();
        worldMapCtx.arc(q.x,q.y,6.2,0,Math.PI*2);
        worldMapCtx.fill();
        worldMapCtx.stroke();

        if(bounds.widthMeters<=2800){
          const w=Math.min(160,worldMapCtx.measureText(h.name).width+10);
          worldMapCtx.fillStyle='rgba(246,242,223,.92)';
          worldMapCtx.fillRect(q.x+8,q.y-9,w,18);
          worldMapCtx.fillStyle='#3b3129';
          worldMapCtx.fillText(h.name,q.x+13,q.y);
        }
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawRoadsideSites(bounds) {
    if(bounds.widthMeters>4000) return;

    const tx0=Math.floor(bounds.minX/WORLD_TILE_SIZE)-1;
    const tx1=Math.floor(bounds.maxX/WORLD_TILE_SIZE)+1;
    const tz0=Math.floor(bounds.minZ/WORLD_TILE_SIZE)-1;
    const tz1=Math.floor(bounds.maxZ/WORLD_TILE_SIZE)+1;

    worldMapCtx.save();
    worldMapCtx.textBaseline='middle';
    worldMapCtx.font='bold 10px Arial';

    for(let tz=tz0;tz<=tz1;tz++){
      for(let tx=tx0;tx<=tx1;tx++){
        const site=roadsideSiteForTile(tx,tz);
        if(!site) continue;
        const q=mapWorldToCanvas(site.sx,site.sz,bounds);
        if(q.x<-10||q.x>worldMapCanvas.width+10||q.y<-10||q.y>worldMapCanvas.height+10) continue;

        if(site.type==='gas'){
          worldMapCtx.fillStyle='#d6a45a';
          worldMapCtx.strokeStyle='#2f352f';
          worldMapCtx.lineWidth=1.5;
          worldMapCtx.beginPath();worldMapCtx.arc(q.x,q.y,5.5,0,Math.PI*2);worldMapCtx.fill();worldMapCtx.stroke();
        }else if(site.type==='farm'){
          worldMapCtx.fillStyle='#78945d';
          worldMapCtx.strokeStyle='#2f352f';
          worldMapCtx.lineWidth=1.5;
          worldMapCtx.save();
          worldMapCtx.translate(q.x,q.y);worldMapCtx.rotate(Math.PI/4);
          worldMapCtx.fillRect(-4.5,-4.5,9,9);worldMapCtx.strokeRect(-4.5,-4.5,9,9);
          worldMapCtx.restore();
        }else{
          worldMapCtx.fillStyle=site.type==='store'?'#c48262':'#9a876f';
          worldMapCtx.strokeStyle='#2f352f';
          worldMapCtx.lineWidth=1.5;
          worldMapCtx.fillRect(q.x-5,q.y-5,10,10);worldMapCtx.strokeRect(q.x-5,q.y-5,10,10);
        }

        if(bounds.widthMeters<=1800){
          const label=bounds.widthMeters<=1100
            ? roadsideSiteDisplayName(site)
            : site.type==='gas'?'GAS':
              site.type==='store'?'COUNTRY STORE':
              site.type==='farm'?'FARM':'ROADSIDE';
          worldMapCtx.fillStyle='rgba(246,242,223,.90)';
          const w=worldMapCtx.measureText(label).width+8;
          worldMapCtx.fillRect(q.x+7,q.y-8,w,16);
          worldMapCtx.fillStyle='#273028';
          worldMapCtx.fillText(label,q.x+11,q.y);
        }
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawAuxiliaryLanes(bounds) {
    if(bounds.widthMeters>1350) return;

    const idx0=Math.floor((-bounds.maxZ)/SEG_LEN)-CROSSING_SPACING;
    const idx1=Math.ceil((-bounds.minZ)/SEG_LEN)+CROSSING_SPACING;
    worldMapCtx.save();
    worldMapCtx.strokeStyle='#d9d4c5';
    worldMapCtx.lineWidth=2.2;
    worldMapCtx.lineCap='round';

    for(let idx=idx0;idx<=idx1;idx++){
      const info=crossingInfo(idx);
      if(!info?.accessible) continue;

      for(const kind of ['off','on']){
        const samples=30;
        let started=false;
        worldMapCtx.beginPath();
        const zA=kind==='off'?330:-160;
        const zB=kind==='off'?112:-112;

        for(let i=0;i<=samples;i++){
          const lz=THREE.MathUtils.lerp(zA,zB,i/samples);
          const b=auxiliaryLaneBoundsAtLocalZ(kind,lz);
          if(!b) continue;
          const lx=(b.inner+b.outer)/2;
          const wp=crossingLocalToWorld(idx,lx,lz);
          const q=mapWorldToCanvas(wp.x,wp.z,bounds);
          if(!started){worldMapCtx.moveTo(q.x,q.y);started=true;}
          else worldMapCtx.lineTo(q.x,q.y);
        }
        if(started) worldMapCtx.stroke();
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawInterchangeRamps(bounds) {
    if(bounds.widthMeters>1800) return;

    const idx0=Math.floor((-bounds.maxZ)/SEG_LEN)-CROSSING_SPACING;
    const idx1=Math.ceil((-bounds.minZ)/SEG_LEN)+CROSSING_SPACING;
    worldMapCtx.save();
    worldMapCtx.strokeStyle='#d9d4c5';
    worldMapCtx.lineWidth=2.0;
    worldMapCtx.lineCap='round';
    worldMapCtx.lineJoin='round';

    for(let idx=idx0;idx<=idx1;idx++){
      const info=crossingInfo(idx);
      if(!info?.accessible) continue;
      const crossingZ=-idx*SEG_LEN;
      if(crossingZ<bounds.minZ-300||crossingZ>bounds.maxZ+300) continue;

      for(const kind of ['off','on']){
        const pts=rampSamples(kind,44);
        worldMapCtx.beginPath();
        let first=true;
        for(const p of pts){
          const wp=crossingLocalToWorld(idx,p.x,p.z);
          const q=mapWorldToCanvas(wp.x,wp.z,bounds);
          if(first){worldMapCtx.moveTo(q.x,q.y);first=false;}
          else worldMapCtx.lineTo(q.x,q.y);
        }
        worldMapCtx.stroke();
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawRampDirectionLabels(bounds) {
    if(bounds.widthMeters>1000) return;

    const idx0=Math.floor((-bounds.maxZ)/SEG_LEN)-CROSSING_SPACING;
    const idx1=Math.ceil((-bounds.minZ)/SEG_LEN)+CROSSING_SPACING;

    worldMapCtx.save();
    worldMapCtx.font='bold 9px Arial';
    worldMapCtx.textAlign='center';
    worldMapCtx.textBaseline='middle';

    for(let idx=idx0;idx<=idx1;idx++){
      const info=crossingInfo(idx);
      if(!info?.accessible) continue;

      for(const entry of [
        {x:48,z:8.6,label:'I-9 N'},
        {x:48,z:-8.6,label:'I-9 S'}
      ]){
        const wp=crossingLocalToWorld(idx,entry.x,entry.z);
        const q=mapWorldToCanvas(wp.x,wp.z,bounds);
        worldMapCtx.fillStyle='#f4f0dd';
        worldMapCtx.strokeStyle='#2c342f';
        worldMapCtx.lineWidth=1;
        worldMapCtx.fillRect(q.x-16,q.y-7,32,14);
        worldMapCtx.strokeRect(q.x-16,q.y-7,32,14);
        worldMapCtx.fillStyle='#263129';
        worldMapCtx.fillText(entry.label,q.x,q.y+.5);
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawSurfaceJunctions(bounds) {
    if(bounds.widthMeters>1350) return;
    const tx0=Math.floor(bounds.minX/WORLD_TILE_SIZE)-1;
    const tx1=Math.floor(bounds.maxX/WORLD_TILE_SIZE)+1;
    const tz0=Math.floor(bounds.minZ/WORLD_TILE_SIZE)-1;
    const tz1=Math.floor(bounds.maxZ/WORLD_TILE_SIZE)+1;

    worldMapCtx.save();
    worldMapCtx.fillStyle='#ece8d9';
    worldMapCtx.strokeStyle='#7f7968';
    worldMapCtx.lineWidth=1;

    for(let tz=tz0;tz<=tz1;tz++){
      for(let tx=tx0;tx<=tx1;tx++){
        for(const node of consolidatedSurfaceJunctionsForTile(tx,tz)){
          const q=mapWorldToCanvas(node.x,node.z,bounds);
          worldMapCtx.beginPath();
          const rr=node.kind==='multi'?4.0:node.kind==='tee'?3.3:2.4;
          worldMapCtx.arc(q.x,q.y,rr,0,Math.PI*2);
          worldMapCtx.fill();
          worldMapCtx.stroke();
          if((node.kind==='tee'||node.kind==='multi') && bounds.widthMeters<=750){
            worldMapCtx.fillStyle=node.kind==='multi'?'#3d5566':'#6e362e';
            worldMapCtx.fillRect(q.x-1.2,q.y-1.2,2.4,2.4);
            worldMapCtx.fillStyle='#ece8d9';
          }
        }
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawCrossings(bounds) {
    const idx0=Math.floor((-bounds.maxZ)/SEG_LEN)-CROSSING_SPACING;
    const idx1=Math.ceil((-bounds.minZ)/SEG_LEN)+CROSSING_SPACING;

    worldMapCtx.save();
    worldMapCtx.font='bold 11px Arial';
    worldMapCtx.textBaseline='middle';

    for(let idx=idx0;idx<=idx1;idx++){
      const info=crossingInfo(idx);
      if(!info) continue;

      const z=-idx*SEG_LEN;
      if(z<bounds.minZ-80 || z>bounds.maxZ+80) continue;
      const x=roadCenterXAtZ(z);
      const q=mapWorldToCanvas(x,z,bounds);

      // Draw the actual overpass as a short white crossing line.
      const h=roadHeadingAtZ(z);
      const ux=Math.cos(h), uz=-Math.sin(h);
      const half=Math.min(120,bounds.widthMeters*.09);
      const a=mapWorldToCanvas(x-ux*half,z-uz*half,bounds);
      const b=mapWorldToCanvas(x+ux*half,z+uz*half,bounds);
      worldMapCtx.strokeStyle='#ece8d9';
      worldMapCtx.lineWidth=2.2;
      worldMapCtx.beginPath();
      worldMapCtx.moveTo(a.x,a.y);
      worldMapCtx.lineTo(b.x,b.y);
      worldMapCtx.stroke();

      if(info.accessible){
        worldMapCtx.fillStyle='#2e6d46';
        worldMapCtx.strokeStyle='#f6f2df';
        worldMapCtx.lineWidth=2;
        worldMapCtx.beginPath();
        worldMapCtx.arc(q.x,q.y,5.5,0,Math.PI*2);
        worldMapCtx.fill();
        worldMapCtx.stroke();

        if(bounds.widthMeters<=2500){
          const label=`Exit ${info.exitNumber} · ${info.roadName}`;
          worldMapCtx.fillStyle='rgba(246,242,223,.92)';
          worldMapCtx.fillRect(q.x+8,q.y-9,Math.min(170,worldMapCtx.measureText(label).width+10),18);
          worldMapCtx.fillStyle='#243027';
          worldMapCtx.fillText(label,q.x+13,q.y);
        }
      }
    }
    worldMapCtx.restore();
  }

  function mapDrawRestArea(bounds) {
    const q=mapWorldToCanvas(48,0,bounds);
    if(q.x<-20||q.x>worldMapCanvas.width+20||q.y<-20||q.y>worldMapCanvas.height+20) return;
    worldMapCtx.save();
    worldMapCtx.fillStyle='#6d744a';
    worldMapCtx.strokeStyle='#f1eee2';
    worldMapCtx.lineWidth=1.5;
    worldMapCtx.fillRect(q.x-6,q.y-6,12,12);
    worldMapCtx.strokeRect(q.x-6,q.y-6,12,12);
    if(bounds.widthMeters<=2500){
      worldMapCtx.font='bold 11px Arial';
      worldMapCtx.fillStyle='#263028';
      worldMapCtx.fillText('REST AREA',q.x+10,q.y-8);
    }
    worldMapCtx.restore();
  }

  function mapDrawPlayer(bounds) {
    const q=mapWorldToCanvas(player.x,player.z,bounds);
    const ang=-player.heading;
    worldMapCtx.save();
    worldMapCtx.translate(q.x,q.y);
    worldMapCtx.rotate(ang);
    worldMapCtx.fillStyle='#b62d2a';
    worldMapCtx.strokeStyle='#fff7df';
    worldMapCtx.lineWidth=2;
    worldMapCtx.beginPath();
    worldMapCtx.moveTo(0,-11);
    worldMapCtx.lineTo(7,8);
    worldMapCtx.lineTo(0,5);
    worldMapCtx.lineTo(-7,8);
    worldMapCtx.closePath();
    worldMapCtx.fill();
    worldMapCtx.stroke();
    worldMapCtx.restore();
  }

  function nearestNamedRoadRecord(x,z,tileRadius=2) {
    const tx=worldTileIndexForCoord(x);
    const tz=worldTileIndexForCoord(z);
    let best=null;

    for(let oz=-tileRadius;oz<=tileRadius;oz++){
      for(let ox=-tileRadius;ox<=tileRadius;ox++){
        for(const s of proceduralRoadSegmentsForTile(tx+ox,tz+oz)){
          const name=roadDisplayName(s);
          if(!name||s.dirt||s.type==='driveway') continue;
          const hit=pointSegmentDistance2D(x,z,s.ax,s.az,s.bx,s.bz);
          if(!best||hit.distance<best.distance){
            best={
              segment:s,
              roadName:name,
              distance:hit.distance,
              x:THREE.MathUtils.lerp(s.ax,s.bx,hit.t),
              z:THREE.MathUtils.lerp(s.az,s.bz,hit.t)
            };
          }
        }
      }
    }
    return best;
  }

  function regionalNamedJunctionsBetween(a,b) {
    const minX=Math.min(a.x,b.x)-WORLD_TILE_SIZE;
    const maxX=Math.max(a.x,b.x)+WORLD_TILE_SIZE;
    const minZ=Math.min(a.z,b.z)-WORLD_TILE_SIZE;
    const maxZ=Math.max(a.z,b.z)+WORLD_TILE_SIZE;
    const tx0=Math.floor(minX/WORLD_TILE_SIZE);
    const tx1=Math.floor(maxX/WORLD_TILE_SIZE);
    const tz0=Math.floor(minZ/WORLD_TILE_SIZE);
    const tz1=Math.floor(maxZ/WORLD_TILE_SIZE);
    const out=[];
    const seen=new Set();

    // Cap work for extreme map targets; route preview can safely fall back.
    if((tx1-tx0+1)*(tz1-tz0+1)>110) return out;

    for(let tz=tz0;tz<=tz1;tz++){
      for(let tx=tx0;tx<=tx1;tx++){
        for(const node of consolidatedSurfaceJunctionsForTile(tx,tz)){
          const roads=namedRoadsAtJunction(node);
          if(roads.length<2) continue;
          const key=`${node.x.toFixed(1)},${node.z.toFixed(1)}`;
          if(seen.has(key)) continue;
          seen.add(key);
          out.push({node,roads});
        }
      }
    }
    return out;
  }

  function sampleNamedRoadToward(start,end,roadName,maxSamples=24) {
    // Follow actual generated centerline pieces greedily. This is deliberately
    // conservative: if continuity is unclear, stop instead of drawing a fake
    // road path across open fields.
    const points=[{x:start.x,z:start.z}];
    let current={x:start.x,z:start.z};
    const visited=new Set();

    for(let step=0;step<maxSamples;step++){
      const tx=worldTileIndexForCoord(current.x);
      const tz=worldTileIndexForCoord(current.z);
      let choice=null;

      for(let oz=-1;oz<=1;oz++){
        for(let ox=-1;ox<=1;ox++){
          for(const s of proceduralRoadSegmentsForTile(tx+ox,tz+oz)){
            if(roadDisplayName(s)!==roadName||s.dirt) continue;
            const key=[
              s.ax.toFixed(1),s.az.toFixed(1),
              s.bx.toFixed(1),s.bz.toFixed(1),roadName
            ].join('|');
            if(visited.has(key)) continue;

            const ha=Math.hypot(current.x-s.ax,current.z-s.az);
            const hb=Math.hypot(current.x-s.bx,current.z-s.bz);
            const near=Math.min(ha,hb);
            if(near>55) continue;

            const next=ha<=hb?{x:s.bx,z:s.bz}:{x:s.ax,z:s.az};
            const nowToEnd=Math.hypot(current.x-end.x,current.z-end.z);
            const nextToEnd=Math.hypot(next.x-end.x,next.z-end.z);
            const score=nextToEnd+near*.8+(nextToEnd>nowToEnd?90:0);

            if(!choice||score<choice.score){
              choice={segment:s,key,next,score};
            }
          }
        }
      }

      if(!choice) break;
      visited.add(choice.key);
      current=choice.next;
      points.push({x:current.x,z:current.z});
      if(Math.hypot(current.x-end.x,current.z-end.z)<70) break;
    }
    return points;
  }

  function buildRoadFollowingPreview(start,target) {
    const startRoad=nearestNamedRoadRecord(start.x,start.z,2);
    const targetRoad=nearestNamedRoadRecord(target.x,target.z,2);
    if(!startRoad||!targetRoad) return null;
    if(startRoad.distance>45||targetRoad.distance>55) return null;

    const points=[{x:start.x,z:start.z}];

    if(startRoad.roadName===targetRoad.roadName){
      points.push({x:startRoad.x,z:startRoad.z});
      const middle=sampleNamedRoadToward(startRoad,targetRoad,startRoad.roadName,34);
      points.push(...middle.slice(1));
      points.push({x:targetRoad.x,z:targetRoad.z});
      points.push({x:target.x,z:target.z});
      return {points,label:`via ${startRoad.roadName}`};
    }

    // Look for one real named-road junction that connects the two route names.
    let bestJunction=null;
    for(const item of regionalNamedJunctionsBetween(startRoad,targetRoad)){
      const names=item.roads.map(([name])=>name);
      if(!names.includes(startRoad.roadName)||!names.includes(targetRoad.roadName)) continue;

      const d1=Math.hypot(startRoad.x-item.node.x,startRoad.z-item.node.z);
      const d2=Math.hypot(targetRoad.x-item.node.x,targetRoad.z-item.node.z);
      const score=d1+d2;
      if(!bestJunction||score<bestJunction.score){
        bestJunction={...item,score};
      }
    }
    if(!bestJunction) return null;

    const j={x:bestJunction.node.x,z:bestJunction.node.z};
    points.push({x:startRoad.x,z:startRoad.z});

    const first=sampleNamedRoadToward(startRoad,j,startRoad.roadName,24);
    points.push(...first.slice(1));
    points.push(j);

    const second=sampleNamedRoadToward(j,targetRoad,targetRoad.roadName,24);
    points.push(...second.slice(1));
    points.push({x:targetRoad.x,z:targetRoad.z});
    points.push({x:target.x,z:target.z});

    return {
      points,
      label:`${startRoad.roadName} → ${targetRoad.roadName}`
    };
  }

  function hamletAtTarget(target,maxDistance=90) {
    if(!target) return null;
    const tx=worldTileIndexForCoord(target.x);
    const tz=worldTileIndexForCoord(target.z);
    for(let oz=-1;oz<=1;oz++){
      for(let ox=-1;ox<=1;ox++){
        const h=hamletForTile(tx+ox,tz+oz);
        if(h && Math.hypot(target.x-h.x,target.z-h.z)<=maxDistance) return h;
      }
    }
    return null;
  }

  function mapDrawSelectedDestinationGuide(bounds) {
    const h=hamletAtTarget(mapTravelTarget);
    if(!h) return;

    const preview=buildRoadFollowingPreview(
      {x:player.x,z:player.z},
      {x:h.x,z:h.z}
    );

    worldMapCtx.save();
    worldMapCtx.strokeStyle='rgba(173,58,47,.84)';
    worldMapCtx.lineWidth=2.4;
    worldMapCtx.setLineDash([8,6]);
    worldMapCtx.lineCap='round';
    worldMapCtx.lineJoin='round';

    let labelX,labelY;
    if(preview?.points?.length>=2){
      worldMapCtx.beginPath();
      for(let i=0;i<preview.points.length;i++){
        const q=mapWorldToCanvas(preview.points[i].x,preview.points[i].z,bounds);
        if(i===0) worldMapCtx.moveTo(q.x,q.y);
        else worldMapCtx.lineTo(q.x,q.y);
      }
      worldMapCtx.stroke();

      const mid=preview.points[Math.floor(preview.points.length/2)];
      const mq=mapWorldToCanvas(mid.x,mid.z,bounds);
      labelX=mq.x;labelY=mq.y;
    }else{
      // Fallback remains useful when the target is outside the locally
      // generated named-road graph.
      const a=mapWorldToCanvas(player.x,player.z,bounds);
      const b=mapWorldToCanvas(h.x,h.z,bounds);
      worldMapCtx.beginPath();
      worldMapCtx.moveTo(a.x,a.y);
      worldMapCtx.lineTo(b.x,b.y);
      worldMapCtx.stroke();
      labelX=(a.x+b.x)/2;labelY=(a.y+b.y)/2;
    }
    worldMapCtx.setLineDash([]);

    const miles=Math.hypot(h.x-player.x,h.z-player.z)/1609.344;
    const routeLabel=preview?.label?` · ${preview.label}`:'';
    const label=`${h.name} · ${miles.toFixed(1)} mi${routeLabel}`;
    worldMapCtx.font='bold 10px Arial';
    worldMapCtx.textAlign='center';
    worldMapCtx.textBaseline='middle';
    const w=Math.min(270,worldMapCtx.measureText(label).width+12);
    worldMapCtx.fillStyle='rgba(246,242,223,.94)';
    worldMapCtx.fillRect(labelX-w/2,labelY-9,w,18);
    worldMapCtx.fillStyle='#5d2f2a';
    worldMapCtx.fillText(label,labelX,labelY+.5);
    worldMapCtx.restore();
  }

  function drawWorldMap() {
    if(!worldMapCtx) return;
    const bounds=mapBoundsForCurrentView();

    // Paper-style map background.
    worldMapCtx.fillStyle='#d6caa8';
    worldMapCtx.fillRect(0,0,worldMapCanvas.width,worldMapCanvas.height);

    // Subtle tile/grid reference.
    worldMapCtx.save();
    worldMapCtx.strokeStyle='rgba(72,67,49,.11)';
    worldMapCtx.lineWidth=1;
    const tx0=Math.ceil(bounds.minX/WORLD_TILE_SIZE)*WORLD_TILE_SIZE;
    const tz0=Math.ceil(bounds.minZ/WORLD_TILE_SIZE)*WORLD_TILE_SIZE;
    for(let x=tx0;x<=bounds.maxX;x+=WORLD_TILE_SIZE){
      const a=mapWorldToCanvas(x,bounds.minZ,bounds);
      const b=mapWorldToCanvas(x,bounds.maxZ,bounds);
      worldMapCtx.beginPath();worldMapCtx.moveTo(a.x,a.y);worldMapCtx.lineTo(b.x,b.y);worldMapCtx.stroke();
    }
    for(let z=tz0;z<=bounds.maxZ;z+=WORLD_TILE_SIZE){
      const a=mapWorldToCanvas(bounds.minX,z,bounds);
      const b=mapWorldToCanvas(bounds.maxX,z,bounds);
      worldMapCtx.beginPath();worldMapCtx.moveTo(a.x,a.y);worldMapCtx.lineTo(b.x,b.y);worldMapCtx.stroke();
    }
    worldMapCtx.restore();

    mapDrawProceduralRoads(bounds);
    mapDrawSurfaceJunctions(bounds);
    mapDrawInterstate(bounds);
    mapDrawAuxiliaryLanes(bounds);
    mapDrawInterchangeRamps(bounds);
    mapDrawRampDirectionLabels(bounds);
    mapDrawCrossings(bounds);
    mapDrawTruckStop(bounds);
    mapDrawHamlets(bounds);
    mapDrawRoadsideSites(bounds);
    mapDrawRestArea(bounds);
    mapDrawSelectedDestinationGuide(bounds);

    if(mapTravelTarget){
      const q=mapWorldToCanvas(mapTravelTarget.x,mapTravelTarget.z,bounds);
      worldMapCtx.save();
      worldMapCtx.strokeStyle='#b62d2a';
      worldMapCtx.fillStyle='rgba(182,45,42,.18)';
      worldMapCtx.lineWidth=3;
      worldMapCtx.beginPath();
      worldMapCtx.arc(q.x,q.y,11,0,Math.PI*2);
      worldMapCtx.fill();
      worldMapCtx.stroke();
      worldMapCtx.beginPath();
      worldMapCtx.moveTo(q.x-16,q.y);worldMapCtx.lineTo(q.x+16,q.y);
      worldMapCtx.moveTo(q.x,q.y-16);worldMapCtx.lineTo(q.x,q.y+16);
      worldMapCtx.stroke();
      worldMapCtx.restore();
    }

    mapDrawPlayer(bounds);

    const acrossMiles=bounds.widthMeters/1609.344;
    mapScaleText.textContent=`${acrossMiles<1?acrossMiles.toFixed(1):acrossMiles.toFixed(1)} mi across`;

    const dx=localRoadX(player.x,player.z);
    const ptx=worldTileIndexForCoord(player.x);
    const ptz=worldTileIndexForCoord(player.z);
    let nearbyHamlet=null;
    for(let oz=-1;oz<=1&&!nearbyHamlet;oz++){
      for(let ox=-1;ox<=1&&!nearbyHamlet;ox++){
        const h=hamletForTile(ptx+ox,ptz+oz);
        if(h && Math.hypot(player.x-h.x,player.z-h.z)<95) nearbyHamlet=h;
      }
    }
    if(nearbyHamlet){
      mapLocationText.textContent=`Near ${nearbyHamlet.name}`;
    }else if(Math.abs(dx)<=ROAD_HALF+8){
      mapLocationText.textContent='On or beside Interstate 9';
    }else{
      const dir=dx>0?'east':'west';
      mapLocationText.textContent=`${(Math.abs(dx)/1609.344).toFixed(2)} mi ${dir} of Interstate 9`;
    }
  }

  function openMap() {
    startup.classList.remove('visible');
    pauseMenu.classList.remove('visible');
    settingsMenu.classList.remove('visible');
    mapCenterX=player.x;
    mapCenterZ=player.z;
    mapTravelTarget=null;
    mapTargetInfo.textContent='No destination selected.';
    mapGoHere.disabled=true;
    mapClearTarget.disabled=true;
    mapMenu.classList.add('visible');
    drawWorldMap();
  }

  function closeMap() {
    mapMenu.classList.remove('visible');
    if(!started) startup.classList.add('visible');
    else if(paused) pauseMenu.classList.add('visible');
  }

  function applySettings(){
    camera.fov=settings.fov; camera.updateProjectionMatrix();
    if (typeof player !== 'undefined') applyCameraPose();
    scene.fog.far = settings.drawDistance===8?1050:settings.drawDistance===12?1500:1900;
    // The live FPS display is intentionally separate from the heavyweight debug report.
    if(fpsHud) fpsHud.classList.toggle('visible',!!settings.showFps);
    if(debugPanel) debugPanel.classList.remove('visible');
    if(settings.trafficDensity===0) {
      for(const t of traffic){world.remove(t.mesh);} traffic.length=0;
    }
  }
  applySettings();

  function clearWorldForSceneryToggle(){
    for(const s of segments){world.remove(s);disposeSignTextures(s);} segments.length=0;
    nextSegmentIndex=Math.floor((-player.z)/SEG_LEN)-2;

    for(const [,tile] of worldTiles) disposeWorldTile(tile);
    worldTiles.clear();
    tileStreamQueue.length=0;
    tileStreamQueuedKeys.clear();
    tileSceneryQueue.length=0;
    tileSceneryQueuedKeys.clear();
    tileUnloadQueue.length=0;
    tileUnloadQueuedKeys.clear();
    tileStreamCooldownFrames=0;
    tileSceneryCooldownFrames=0;
    tileStreamOldestWaitMs=0;

    ensureWorldTiles(true);
    freewayLastPlayerIndex=null;
    freewayLastDrawDistance=null;
    freewaySegmentQueue.length=0;
    freewaySegmentQueued.clear();
    freewaySceneryQueue.length=0;
    freewaySceneryQueued.clear();
    freewaySegmentByIndex.clear();
    for(const segment of segments){
      freewaySegmentByIndex.set(segment.userData.index,segment);
    }
    ensureSegments(true);
  }

  function processUnifiedStreamingWork(dt) {
    const frameMs=Math.max(.1,dt*1000);

    // Keep total optional streaming work under one shared envelope so separate
    // streamers do not each consume their own budget in the same frame.
    let totalBudget=3.6;
    if(frameMs>24) totalBudget=1.0;
    else if(frameMs>18) totalBudget=1.7;
    else if(frameMs<13) totalBudget=4.6;
    else if(frameMs<15.5) totalBudget=4.0;
    unifiedStreamingProfile.frameBudgetMs=totalBudget;

    const started=performance.now();
    let jobs=0;
    let skipped=0;

    const canContinue=()=>jobs===0 || performance.now()-started<totalBudget;
    const run=(fn)=>{
      if(!canContinue()){ skipped++; return false; }
      fn();
      jobs++;
      return true;
    };

    // Rotate which non-safety streamer gets first access to the shared budget.
    // Base geometry gets precedence over decorative scenery.
    const phase=unifiedStreamingProfile.roundRobin++%3;

    if(phase===0){
      if(tileStreamQueue.length) run(()=>processTileStreamQueue(Math.min(tileStreamAdaptiveBudgetMs,totalBudget),1));
      if(tileRoadBuildQueue.length) run(()=>processTileRoadBuildQueue(Math.min(1.4,totalBudget),1));
      if(freewaySegmentQueue.length) run(()=>processFreewaySegmentQueue(Math.min(1.8,totalBudget),1));
    }else{
      if(freewaySegmentQueue.length) run(()=>processFreewaySegmentQueue(Math.min(1.8,totalBudget),1));
      if(tileRoadBuildQueue.length) run(()=>processTileRoadBuildQueue(Math.min(1.4,totalBudget),1));
      if(tileStreamQueue.length) run(()=>processTileStreamQueue(Math.min(tileStreamAdaptiveBudgetMs,totalBudget),1));
    }

    // Development/vegetation and freeway roadside scenery are lower priority.
    if(tileSceneryQueue.length) run(()=>processTileSceneryQueue(Math.min(1.4,totalBudget),1));
    if(freewaySceneryQueue.length) run(()=>processFreewaySceneryQueue(Math.min(1.1,totalBudget),1));

    // Disposal is last and is deliberately tiny.
    if(tileUnloadQueue.length) run(()=>processTileUnloadQueue(.55,1));

    unifiedStreamingProfile.lastMs=performance.now()-started;
    unifiedStreamingProfile.maxMs=Math.max(
      unifiedStreamingProfile.maxMs,
      unifiedStreamingProfile.lastMs
    );
    unifiedStreamingProfile.lastJobs=jobs;
    unifiedStreamingProfile.skippedJobs=skipped;
  }

  let last=performance.now();
  function loop(now){
    requestAnimationFrame(loop);
    const frameProfileStarted=performance.now();
    const frameParts={};

    let dt=Math.min(.05,(now-last)/1000);
    last=now;

    if(running && !paused){
      profileFramePart(frameParts,'player',()=>updatePlayer(dt));
      profileFramePart(frameParts,'world-check',()=>ensureWorldTiles());
      profileFramePart(
        frameParts,
        'stream-budget',
        ()=>updateAdaptiveStreamingBudget(dt)
      );
      profileFramePart(frameParts,'freeway-check',()=>ensureSegments());
      profileFramePart(
        frameParts,
        'worker-feed',
        ()=>processUnifiedWorkerPipeline(dt)
      );
      profileFramePart(
        frameParts,
        'streaming',
        ()=>processUnifiedStreamingWork(dt)
      );
      profileFramePart(frameParts,'freeway-traffic',()=>updateTraffic(dt));
      profileFramePart(
        frameParts,
        'plaza-traffic',
        ()=>updateTruckStopTraffic(dt)
      );
      profileFramePart(
        frameParts,
        'rural-traffic',
        ()=>updateLocalRoadTraffic(dt)
      );
    }

    if(!(running && !paused)){
      profileFramePart(frameParts,'paused-traffic',()=>{
        ensureTruckStopTraffic();
        for(const v of truckStopTraffic) v.mesh.visible=false;
      });
    }

    profileFramePart(
      frameParts,
      'interior-editor',
      ()=>updateInteriorEditorShimmer(now)
    );
    profileFramePart(
      frameParts,
      'sign-culling',
      ()=>updateOneSidedSignVisibility()
    );
    profileFramePart(frameParts,'ui',()=>updateUI(now));
    profileFramePart(frameParts,'render',()=>renderer.render(scene,camera));

    recordFrameProfile(
      frameParts,
      performance.now()-frameProfileStarted
    );
  }

  const startRestArea = buildStartRestArea();
  initTilePlanWorker();
  initJunctionWorker();
  ensureWorldTiles(true);
  ensureSegments(true);

  // Development-only console sanity check: major route pieces should hand off
  // cleanly at centered tile boundaries around the starting area.
  try{
    const atx=worldTileIndexForCoord(player.x);
    const atz=worldTileIndexForCoord(player.z);
    let endpoints=0,matched=0;
    const deadEnds=[];
    const spacingIssues=[];
    for(let oz=-2;oz<=2;oz++){
      for(let ox=-2;ox<=2;ox++){
        const tx=atx+ox,tz=atz+oz;
        const a=auditTileRoadContinuity(tx,tz);
        endpoints+=a.boundaryEndpoints;
        matched+=a.matchedEndpoints;
        deadEnds.push(...auditUnexpectedMajorDeadEnds(tx,tz));
        spacingIssues.push(...auditRuralParallelSpacing(tx,tz));
      }
    }
    if(endpoints && matched/endpoints<.85){
      console.warn('Interstate Drive road continuity audit:',matched,'of',endpoints,'boundary endpoints matched');
    }
    if(deadEnds.length){
      console.warn('Interstate Drive unexpected major-road dead endpoints:',deadEnds.slice(0,20));
    }
    if(spacingIssues.length){
      console.warn(
        'Interstate Drive suspicious close parallel rural roads:',
        spacingIssues.slice(0,20)
      );
    }

    let settlementStreetCount=0;
    for(let oz=-2;oz<=2;oz++){
      for(let ox=-2;ox<=2;ox++){
        settlementStreetCount+=neighborAwareRenderableSegments(atx+ox,atz+oz)
          .filter(s=>roadIsSettlementLocal(s)).length;
      }
    }
    if(settlementStreetCount){
      console.info(
        'Interstate Drive settlement-local street segments nearby:',
        settlementStreetCount
      );
    }

    const truckStopGeometryIssues=auditTruckStopGeometry();
    if(truckStopGeometryIssues.length){
      console.warn(
        'Interstate Drive truck-stop lot/road geometry audit:',
        truckStopGeometryIssues
      );
    }

    const driveThruIssues=auditTruckStopDriveThruLoops();
    if(driveThruIssues.length){
      console.warn(
        'Interstate Drive drive-thru continuity audit:',
        driveThruIssues
      );
    }

    const truckStopSignIssues=auditTruckStopApproachSigning();
    if(truckStopSignIssues.length){
      console.warn(
        'Interstate Drive truck-stop approach-sign audit:',
        truckStopSignIssues
      );
    }

    console.info(
      'Interstate Drive v0.9.11:',
      'Settings now includes a refreshable, copyable performance debug report with a one-click clipboard button'
    );

    // Interchange envelope sanity checks.
    for(const kind of ['off','on']){
      for(const az of [330,250,160,112]){
        const z=(kind==='off'?1:-1)*az;
        const b=auxiliaryLaneEnvelopeAtLocalZ(kind,z);
        if(!b || b.outer<b.inner){
          console.warn('Invalid auxiliary envelope',kind,z,b);
        }
      }
      for(const az of [114,106,98]){
        const z=(kind==='off'?1:-1)*az;
        const b=rampThroatEnvelopeAtLocalZ(kind,z);
        if(!b || b.outer<b.inner){
          console.warn('Invalid ramp throat envelope',kind,z,b);
        }
      }
    }
  }catch(err){
    console.warn('Road continuity audit skipped:',err);
  }

  requestAnimationFrame(loop);

  function setPaused(v){
    if(!started)return;
    paused=v;
    pauseMenu.classList.toggle('visible',paused);
    if(settingsMenu.classList.contains('visible')) clearInteriorEditorHighlight();
    settingsMenu.classList.remove('visible');
    mapMenu.classList.remove('visible');
  }
  document.getElementById('startButton').onclick=()=>{startup.classList.remove('visible');running=true;started=true;};
  document.getElementById('resumeButton').onclick=()=>setPaused(false);
  document.getElementById('resetButton').onclick=resetPlayer;


  // Selected-part shimmer for the primitive interior editor.
  // Highlight materials are cloned per selected object so a shared cached material
  // cannot accidentally make unrelated primitives shimmer.
  const editorHighlightedObjects = new Map();
  const EDITOR_GOLD = new THREE.Color(0xffc43d);

  function clearInteriorEditorHighlight() {
    for (const [obj, state] of editorHighlightedObjects) {
      obj.material = state.originalMaterial;
    }
    editorHighlightedObjects.clear();
  }

  function cloneHighlightMaterial(material) {
    if (!material) return material;
    const clone = material.clone();
    clone.needsUpdate = true;
    return clone;
  }

  function highlightInteriorEditorPart(name) {
    clearInteriorEditorHighlight();

    // Parts only highlight while Settings is actually open.
    if (!settingsMenu.classList.contains('visible') || exteriorView) return;

    const refs = interiorEditorParts[name] || [];
    for (const ref of refs) {
      const obj = ref.obj;
      if (!obj || !obj.material || editorHighlightedObjects.has(obj)) continue;

      const originalMaterial = obj.material;
      const highlightMaterial = Array.isArray(originalMaterial)
        ? originalMaterial.map(cloneHighlightMaterial)
        : cloneHighlightMaterial(originalMaterial);

      obj.material = highlightMaterial;
      editorHighlightedObjects.set(obj, {
        originalMaterial,
        highlightMaterial,
        baseStates: (Array.isArray(highlightMaterial) ? highlightMaterial : [highlightMaterial]).map(m => ({
          material: m,
          color: m && m.color ? m.color.clone() : null,
          emissive: m && m.emissive ? m.emissive.clone() : null,
          emissiveIntensity: m && 'emissiveIntensity' in m ? m.emissiveIntensity : undefined
        }))
      });
    }
  }

  function updateInteriorEditorShimmer(now) {
    // No shimmer anywhere unless the Settings panel itself is visibly open.
    if (!settingsMenu.classList.contains('visible') || exteriorView) {
      if (editorHighlightedObjects.size) clearInteriorEditorHighlight();
      return;
    }

    if (!editorHighlightedObjects.size) {
      const selected = typeof currentInteriorPartName === 'function' ? currentInteriorPartName() : '';
      if (selected) highlightInteriorEditorPart(selected);
      return;
    }

    // Slow "breathing" shimmer: mostly original color -> visibly gold -> original.
    const wave = (Math.sin(now * 0.00175 - Math.PI / 2) + 1) * 0.5;
    const colorBlend = 0.04 + wave * 0.56;
    const emissiveBlend = 0.02 + wave * 0.30;

    for (const state of editorHighlightedObjects.values()) {
      for (const base of state.baseStates) {
        const material = base.material;
        if (!material) continue;

        if (material.color && base.color) {
          material.color.copy(base.color).lerp(EDITOR_GOLD, colorBlend);
        }
        if (material.emissive && base.emissive) {
          material.emissive.copy(base.emissive).lerp(EDITOR_GOLD, emissiveBlend);
          if ('emissiveIntensity' in material) {
            const baseIntensity = base.emissiveIntensity ?? 1;
            material.emissiveIntensity = baseIntensity + wave * 0.28;
          }
        }
        material.needsUpdate = true;
      }
    }
  }

  // ----- Interior editor UI -----
  const interiorEditorMode = document.getElementById('interiorEditorMode');
  const interiorPartSelect = document.getElementById('interiorPart');
  const interiorJson = document.getElementById('interiorJson');
  const interiorEditorStatus = document.getElementById('interiorEditorStatus');
  const interiorEditorControls = {
    x: document.getElementById('intX'),
    y: document.getElementById('intY'),
    z: document.getElementById('intZ'),
    rx: document.getElementById('intRX'),
    ry: document.getElementById('intRY'),
    rz: document.getElementById('intRZ'),
    sx: document.getElementById('intSX'),
    sy: document.getElementById('intSY'),
    sz: document.getElementById('intSZ')
  };
  const interiorEditorOutputs = Object.fromEntries(
    Object.entries(interiorEditorControls).map(([k, el]) => [k, document.getElementById(el.id + 'Value')])
  );

  function setInteriorEditorStatus(msg) {
    interiorEditorStatus.textContent = msg || '';
  }

  function currentInteriorRegistry() {
    return interiorEditorMode.value === 'group' ? interiorEditorGroups : interiorEditorPrimitives;
  }

  function currentInteriorPartName() {
    return interiorPartSelect.value;
  }

  function repopulateInteriorPartSelect(preferredName='') {
    const registry = currentInteriorRegistry();
    const names = Object.keys(registry);
    interiorPartSelect.innerHTML = '';
    for (const name of names) {
      const option = document.createElement('option');
      option.value = option.textContent = name;
      interiorPartSelect.appendChild(option);
    }
    if (preferredName && registry[preferredName]) interiorPartSelect.value = preferredName;
    else if (names.length) interiorPartSelect.value = names[0];
    loadInteriorEditorPart(interiorPartSelect.value);
  }

  function updateInteriorEditorOutputs() {
    for (const [k, el] of Object.entries(interiorEditorControls)) {
      const out = interiorEditorOutputs[k];
      if (!out) continue;
      const n = Number(el.value);
      out.value = k.startsWith('r') ? `${n.toFixed(1)}°` : n.toFixed(2);
    }
  }

  function loadInteriorEditorPart(name=currentInteriorPartName()) {
    if (!name) return;
    if (!interiorLayout[name]) interiorLayout[name] = defaultInteriorTransform();
    const t = normalizeInteriorTransform(interiorLayout[name]);
    interiorLayout[name] = t;
    for (const [k, el] of Object.entries(interiorEditorControls)) el.value = String(t[k]);
    updateInteriorEditorOutputs();
    highlightInteriorEditorPart(name);
    setInteriorEditorStatus(`Editing: ${name} — highlighted gold in the cab.`);
  }

  function commitInteriorEditorPart() {
    const name = currentInteriorPartName();
    if (!name) return;
    const t = {};
    for (const [k, el] of Object.entries(interiorEditorControls)) t[k] = Number(el.value);
    interiorLayout[name] = normalizeInteriorTransform(t);
    applyInteriorPart(name);
    saveInteriorLayoutLocal();
    updateInteriorEditorOutputs();
  }

  // Default to true primitive-level editing. Group mode remains available for
  // broad adjustments, but the selector only lists the chosen mode's entries.
  interiorEditorMode.value = 'primitive';
  repopulateInteriorPartSelect();

  interiorEditorMode.addEventListener('change', () => {
    repopulateInteriorPartSelect();
    setInteriorEditorStatus(
      interiorEditorMode.value === 'group'
        ? 'Group mode: one selection may control several connected primitives.'
        : 'Primitive mode: one selection controls exactly one primitive.'
    );
  });
  interiorPartSelect.addEventListener('change', () => loadInteriorEditorPart());
  for (const el of Object.values(interiorEditorControls)) el.addEventListener('input', commitInteriorEditorPart);

  document.getElementById('resetInteriorPart').onclick = () => {
    const name = currentInteriorPartName();
    if (!name) return;
    interiorLayout[name] = defaultInteriorTransform();
    applyInteriorPart(name);
    saveInteriorLayoutLocal();
    loadInteriorEditorPart(name);
    setInteriorEditorStatus(`Reset ${name} to your preferred default.`);
  };


  document.getElementById('resetInteriorAll').onclick = () => {
    const registry = currentInteriorRegistry();
    for (const name of Object.keys(registry)) {
      interiorLayout[name] = defaultInteriorTransform();
      applyInteriorPart(name);
    }
    saveInteriorLayoutLocal();
    loadInteriorEditorPart();
    setInteriorEditorStatus(
      interiorEditorMode.value === 'group'
        ? 'Restored all groups to your preferred defaults.'
        : 'Restored all primitives to your preferred defaults.'
    );
  };

  function buildInteriorExport() {
    return {
      format: 'InterstateDriveInteriorLayout',
      version: 3,
      generatedAt: new Date().toISOString(),
      editorMode: interiorEditorMode ? interiorEditorMode.value : 'primitive',
      camera: {
        fov: settings.fov,
        x: settings.camX, y: settings.camY, z: settings.camZ,
        pitch: settings.camPitch, yaw: settings.camYaw, roll: settings.camRoll
      },
      exteriorCameras: exteriorCameras.map(v => ({...v})),
      parts: interiorLayout
    };
  }

  document.getElementById('exportInteriorJson').onclick = () => {
    interiorJson.value = JSON.stringify(buildInteriorExport(), null, 2);
    setInteriorEditorStatus('Current interior layout exported to the JSON box.');
  };

  document.getElementById('downloadInteriorJson').onclick = () => {
    const text = JSON.stringify(buildInteriorExport(), null, 2);
    interiorJson.value = text;
    const blob = new Blob([text], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Interstate_Drive_Interior_Layout.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setInteriorEditorStatus('Downloaded Interstate_Drive_Interior_Layout.json.');
  };

  function importInteriorObject(data) {
    const parts = data && data.parts && typeof data.parts === 'object' ? data.parts : data;
    if (!parts || typeof parts !== 'object' || Array.isArray(parts)) throw new Error('JSON does not contain a parts object.');
    for (const name of Object.keys(interiorEditorParts)) {
      if (parts[name]) interiorLayout[name] = normalizeInteriorTransform(parts[name]);
    }
    if (Array.isArray(data.exteriorCameras) && data.exteriorCameras.length === exteriorCameraDefaults.length) {
      exteriorCameras = exteriorCameraDefaults.map((d, i) => ({...d, ...(data.exteriorCameras[i] || {})}));
      saveExteriorCameras();
      if (typeof loadExteriorCameraEditor === 'function') loadExteriorCameraEditor(exteriorViewMode);
    }
    if (data.camera && typeof data.camera === 'object') {
      const c = data.camera;
      const map = {
        fov:'fov', x:'camX', y:'camY', z:'camZ',
        pitch:'camPitch', yaw:'camYaw', roll:'camRoll'
      };
      for (const [srcKey, settingKey] of Object.entries(map)) {
        const n = Number(c[srcKey]);
        if (Number.isFinite(n)) {
          settings[settingKey] = n;
          if (ui[settingKey]) ui[settingKey].value = String(n);
          updateCameraOutput(settingKey);
        }
      }
      localStorage.setItem('interstateDriveSettings', JSON.stringify(settings));
      applySettings();
    }
    applyInteriorLayout();
    saveInteriorLayoutLocal();
    loadInteriorEditorPart();
  }

  document.getElementById('applyInteriorJson').onclick = () => {
    try {
      const data = JSON.parse(interiorJson.value);
      importInteriorObject(data);
      setInteriorEditorStatus('JSON layout applied.');
    } catch (err) {
      setInteriorEditorStatus(`Could not apply JSON: ${err.message}`);
    }
  };

  document.getElementById('loadInteriorJsonFile').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      interiorJson.value = JSON.stringify(data, null, 2);
      importInteriorObject(data);
      setInteriorEditorStatus(`Loaded ${file.name}.`);
    } catch (err) {
      setInteriorEditorStatus(`Could not load file: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  });

  loadInteriorEditorPart();

  document.querySelectorAll('[data-open-map]').forEach(b=>b.onclick=()=>{
    // A map opened during gameplay is a pause-menu feature.
    if(started && !paused) paused=true;
    openMap();
  });
  let mapPointerDown=null;
  let mapPointerLast=null;
  let mapDidDrag=false;

  worldMapCanvas.addEventListener('pointerdown',e=>{
    if(e.button!==0) return;
    worldMapCanvas.setPointerCapture?.(e.pointerId);
    mapPointerDown={x:e.clientX,y:e.clientY};
    mapPointerLast={x:e.clientX,y:e.clientY};
    mapDidDrag=false;
    worldMapCanvas.classList.add('mapDragging');
  });

  worldMapCanvas.addEventListener('pointermove',e=>{
    if(!mapPointerLast) return;
    const dx=e.clientX-mapPointerLast.x;
    const dy=e.clientY-mapPointerLast.y;
    if(Math.hypot(e.clientX-mapPointerDown.x,e.clientY-mapPointerDown.y)>5) mapDidDrag=true;

    if(mapDidDrag){
      const bounds=mapBoundsForCurrentView();
      const rect=worldMapCanvas.getBoundingClientRect();
      mapCenterX -= dx/Math.max(1,rect.width)*bounds.widthMeters;
      mapCenterZ -= dy/Math.max(1,rect.height)*bounds.heightMeters;
      drawWorldMap();
    }
    mapPointerLast={x:e.clientX,y:e.clientY};
  });

  function finishMapPointer(e){
    if(!mapPointerLast) return;
    const wasDrag=mapDidDrag;
    mapPointerLast=null;
    mapPointerDown=null;
    worldMapCanvas.classList.remove('mapDragging');

    if(!wasDrag){
      const bounds=mapBoundsForCurrentView();
      const hamlet=mapHamletHitAtClientPoint(e.clientX,e.clientY,bounds);
      if(hamlet){
        setMapTravelTarget(hamlet.x,hamlet.z);
      }else{
        const p=mapCanvasToWorld(e.clientX,e.clientY,bounds);
        setMapTravelTarget(p.x,p.z);
      }
    }
  }
  worldMapCanvas.addEventListener('pointerup',finishMapPointer);
  worldMapCanvas.addEventListener('pointercancel',()=>{
    mapPointerLast=null;mapPointerDown=null;mapDidDrag=false;
    worldMapCanvas.classList.remove('mapDragging');
  });

  worldMapCanvas.addEventListener('wheel',e=>{
    e.preventDefault();

    const oldBounds=mapBoundsForCurrentView();
    const before=mapCanvasToWorld(e.clientX,e.clientY,oldBounds);
    const oldIndex=mapZoomIndex;

    if(e.deltaY<0) mapZoomIndex=Math.max(0,mapZoomIndex-1);
    else if(e.deltaY>0) mapZoomIndex=Math.min(MAP_ZOOM_LEVELS.length-1,mapZoomIndex+1);

    if(mapZoomIndex!==oldIndex){
      // Keep the world point under the mouse anchored while zooming.
      const newBounds=mapBoundsForCurrentView();
      const after=mapCanvasToWorld(e.clientX,e.clientY,newBounds);
      mapCenterX += before.x-after.x;
      mapCenterZ += before.z-after.z;
      drawWorldMap();
    }
  },{passive:false});

  mapGoHere.onclick=fastTravelToTarget;
  mapClearTarget.onclick=clearMapTravelTarget;
  document.getElementById('closeMap').onclick=closeMap;
  document.getElementById('mapZoomIn').onclick=()=>{
    mapZoomIndex=Math.max(0,mapZoomIndex-1);
    drawWorldMap();
  };
  document.getElementById('mapZoomOut').onclick=()=>{
    mapZoomIndex=Math.min(MAP_ZOOM_LEVELS.length-1,mapZoomIndex+1);
    drawWorldMap();
  };
  document.getElementById('mapCenter').onclick=()=>{
    mapCenterX=player.x;
    mapCenterZ=player.z;
    drawWorldMap();
  };

  function refreshPerformanceDebugReport() {
    if(!performanceDebugReport) return '';
    updateUI(performance.now(),true);
    const report=debugText.textContent||'No debug data available yet.';
    performanceDebugReport.value=report;
    if(performanceDebugStatus){
      performanceDebugStatus.textContent=
        `Report refreshed — ${report.split('\n').length} lines.`;
    }
    return report;
  }

  async function copyPerformanceDebugReport() {
    const report=refreshPerformanceDebugReport();
    if(!report) return;

    let copied=false;
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(report);
        copied=true;
      }
    }catch{}

    if(!copied){
      try{
        performanceDebugReport.focus();
        performanceDebugReport.select();
        performanceDebugReport.setSelectionRange(0,performanceDebugReport.value.length);
        copied=document.execCommand('copy');
      }catch{}
    }

    if(performanceDebugStatus){
      performanceDebugStatus.textContent=copied
        ? 'Debug report copied to clipboard.'
        : 'Could not access the clipboard automatically. The report is selected so you can copy it manually.';
    }
  }

  if(refreshDebugReportButton){
    refreshDebugReportButton.onclick=refreshPerformanceDebugReport;
  }
  if(copyDebugReportButton){
    copyDebugReportButton.onclick=copyPerformanceDebugReport;
  }

  document.querySelectorAll('[data-open-settings]').forEach(b=>b.onclick=()=>{
    startup.classList.remove('visible');
    pauseMenu.classList.remove('visible');
    mapMenu.classList.remove('visible');
    settingsMenu.classList.add('visible');
    refreshPerformanceDebugReport();
    highlightInteriorEditorPart(currentInteriorPartName());
  });
  document.getElementById('closeSettings').onclick=()=>{
    clearInteriorEditorHighlight();
    settingsMenu.classList.remove('visible');
    if(!started) startup.classList.add('visible');
    else if(paused) pauseMenu.classList.add('visible');
  };
  const exteriorCameraPreset = document.getElementById('exteriorCameraPreset');
  const exteriorCameraControls = {
    x: document.getElementById('extCamX'),
    y: document.getElementById('extCamY'),
    z: document.getElementById('extCamZ'),
    targetX: document.getElementById('extTargetX'),
    targetY: document.getElementById('extTargetY'),
    targetZ: document.getElementById('extTargetZ'),
    fov: document.getElementById('extFov')
  };
  const exteriorCameraOutputs = {
    x: document.getElementById('extCamXValue'),
    y: document.getElementById('extCamYValue'),
    z: document.getElementById('extCamZValue'),
    targetX: document.getElementById('extTargetXValue'),
    targetY: document.getElementById('extTargetYValue'),
    targetZ: document.getElementById('extTargetZValue'),
    fov: document.getElementById('extFovValue')
  };

  function updateExteriorCameraOutputs() {
    const cam = exteriorCameras[exteriorViewMode];
    for (const [k, out] of Object.entries(exteriorCameraOutputs)) {
      if (!out) continue;
      out.value = k === 'fov' ? `${Number(cam[k]).toFixed(0)}°` : Number(cam[k]).toFixed(2);
    }
  }

  function loadExteriorCameraEditor(index=exteriorViewMode) {
    exteriorViewMode = Math.max(0, Math.min(exteriorCameras.length - 1, Number(index) || 0));
    exteriorCameraPreset.value = String(exteriorViewMode);
    const cam = exteriorCameras[exteriorViewMode];
    for (const [k, el] of Object.entries(exteriorCameraControls)) el.value = String(cam[k]);
    updateExteriorCameraOutputs();
    if (exteriorView) applyExteriorCameraPose();
  }

  function commitExteriorCameraEditor() {
    const cam = exteriorCameras[exteriorViewMode];
    for (const [k, el] of Object.entries(exteriorCameraControls)) cam[k] = Number(el.value);
    saveExteriorCameras();
    updateExteriorCameraOutputs();
    if (exteriorView) applyExteriorCameraPose();
  }

  exteriorCameraPreset.addEventListener('change', () => loadExteriorCameraEditor(exteriorCameraPreset.value));
  for (const el of Object.values(exteriorCameraControls)) {
    el.addEventListener('input', commitExteriorCameraEditor);
  }

  document.getElementById('resetExteriorCamera').onclick = () => {
    exteriorCameras[exteriorViewMode] = {...exteriorCameraDefaults[exteriorViewMode]};
    saveExteriorCameras();
    loadExteriorCameraEditor(exteriorViewMode);
  };

  document.getElementById('resetAllExteriorCameras').onclick = () => {
    exteriorCameras = cloneExteriorCameraDefaults();
    saveExteriorCameras();
    loadExteriorCameraEditor(exteriorViewMode);
  };

  loadExteriorCameraEditor(0);

  const exteriorViewButton = document.getElementById('toggleExteriorView');
  const exteriorCycleButton = document.getElementById('cycleExteriorView');

  function refreshExteriorViewButton() {
    if (exteriorViewButton) exteriorViewButton.textContent =
      exteriorView ? 'RETURN TO DRIVER VIEW' : 'ENTER EXTERIOR VIEW';
  }

  exteriorViewButton.onclick = () => {
    setExteriorView(!exteriorView);
    if (exteriorView) {
      updateTruckExterior();
      applyExteriorCameraPose();
    } else {
      applyCameraPose();
    }
    refreshExteriorViewButton();
  };

  exteriorCycleButton.onclick = () => {
    cycleExteriorView();
    if (exteriorView) applyExteriorCameraPose();
  };

  document.getElementById('resetCamera').onclick=()=>{
    Object.assign(settings, preferredCameraDefaults);
    for (const k of ['fov','camX','camY','camZ','camPitch','camYaw','camRoll']) {
      ui[k].value = String(settings[k]);
      updateCameraOutput(k);
    }
    localStorage.setItem('interstateDriveSettings', JSON.stringify(settings));
    applySettings();
  };

  addEventListener('keydown',e=>{
    if(e.code==='KeyM' && !e.repeat && started){
      if(mapMenu.classList.contains('visible')) closeMap();
      else {
        if(!paused) paused=true;
        openMap();
      }
      e.preventDefault();
      return;
    }
    if(e.code==='KeyV' && !e.repeat){
      setExteriorView(!exteriorView);
      if(exteriorView){ updateTruckExterior(); applyExteriorCameraPose(); }
      else applyCameraPose();
      refreshExteriorViewButton();
      e.preventDefault();
      return;
    }
    if(e.code==='KeyC' && exteriorView && !e.repeat){
      cycleExteriorView();
      applyExteriorCameraPose();
      e.preventDefault();
      return;
    }
    keys[e.code]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    if(e.code==='KeyR')resetPlayer();
    if(e.code==='Escape'){
      if(mapMenu.classList.contains('visible')) closeMap();
      else if(settingsMenu.classList.contains('visible')){
        clearInteriorEditorHighlight();
        settingsMenu.classList.remove('visible');
        if(!started) startup.classList.add('visible');
        else if(paused) pauseMenu.classList.add('visible');
      } else setPaused(!paused);
    }
    if(e.code==='F3'){
      e.preventDefault();
      if(e.repeat) return;
      settings.showFps=!settings.showFps;
      if(ui.showFps) ui.showFps.checked=settings.showFps;
      localStorage.setItem('interstateDriveSettings', JSON.stringify(settings));
      applySettings();
    }
  });
  addEventListener('keyup',e=>keys[e.code]=false);
  addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    if(mapMenu.classList.contains('visible')) drawWorldMap();
  });

  document.getElementById('dbgTraffic').onclick=()=>{trafficEnabled=!trafficEnabled;if(!trafficEnabled){for(const t of traffic)world.remove(t.mesh);traffic.length=0;}};
  document.getElementById('dbgSpawn').onclick=()=>spawnTraffic(true);
  document.getElementById('dbgBoost').onclick=()=>player.speed=Math.min(42,player.speed+8);
  document.getElementById('dbgReset').onclick=resetPlayer;
  document.getElementById('dbgScenery').onclick=()=>{sceneryEnabled=!sceneryEnabled;clearWorldForSceneryToggle();};
  document.getElementById('dbgFog').onclick=()=>{fogEnabled=!fogEnabled;scene.fog=fogEnabled?new THREE.Fog(0x9eb7c3,180,settings.drawDistance===8?1050:settings.drawDistance===12?1500:1900):null;};
})();
