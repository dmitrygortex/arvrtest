import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve(process.cwd(), 'assets/models/centerpiece.glb');

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function rotatePoint(point, rotation) {
  const [rx, ry, rz] = rotation.map(degToRad);
  let [x, y, z] = point;

  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];

  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];

  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];

  return [x, y, z];
}

function transformPoint(point, transform) {
  const rotated = rotatePoint(point, transform.rotation ?? [0, 0, 0]);
  return [
    rotated[0] + (transform.translation?.[0] ?? 0),
    rotated[1] + (transform.translation?.[1] ?? 0),
    rotated[2] + (transform.translation?.[2] ?? 0)
  ];
}

function transformNormal(normal, transform) {
  return rotatePoint(normal, transform.rotation ?? [0, 0, 0]);
}

function pushQuad(target, a, b, c, d, normal) {
  target.positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < 6; i += 1) {
    target.normals.push(...normal);
  }
}

function createPrimitive(material) {
  return {
    material,
    positions: [],
    normals: []
  };
}

function addBox(primitive, transform, size) {
  const [sx, sy, sz] = size.map((value) => value / 2);
  const faces = [
    {
      normal: [0, 0, -1],
      corners: [
        [-sx, -sy, -sz],
        [sx, -sy, -sz],
        [sx, sy, -sz],
        [-sx, sy, -sz]
      ]
    },
    {
      normal: [0, 0, 1],
      corners: [
        [sx, -sy, sz],
        [-sx, -sy, sz],
        [-sx, sy, sz],
        [sx, sy, sz]
      ]
    },
    {
      normal: [-1, 0, 0],
      corners: [
        [-sx, -sy, sz],
        [-sx, -sy, -sz],
        [-sx, sy, -sz],
        [-sx, sy, sz]
      ]
    },
    {
      normal: [1, 0, 0],
      corners: [
        [sx, -sy, -sz],
        [sx, -sy, sz],
        [sx, sy, sz],
        [sx, sy, -sz]
      ]
    },
    {
      normal: [0, 1, 0],
      corners: [
        [-sx, sy, -sz],
        [sx, sy, -sz],
        [sx, sy, sz],
        [-sx, sy, sz]
      ]
    },
    {
      normal: [0, -1, 0],
      corners: [
        [-sx, -sy, sz],
        [sx, -sy, sz],
        [sx, -sy, -sz],
        [-sx, -sy, -sz]
      ]
    }
  ];

  for (const face of faces) {
    const corners = face.corners.map((corner) => transformPoint(corner, transform));
    const normal = transformNormal(face.normal, transform);
    pushQuad(primitive, corners[0], corners[1], corners[2], corners[3], normal);
  }
}

function addCylinderX(primitive, transform, radius, length, segments) {
  const halfLength = length / 2;

  for (let index = 0; index < segments; index += 1) {
    const theta0 = (index / segments) * Math.PI * 2;
    const theta1 = ((index + 1) / segments) * Math.PI * 2;
    const y0 = Math.cos(theta0) * radius;
    const z0 = Math.sin(theta0) * radius;
    const y1 = Math.cos(theta1) * radius;
    const z1 = Math.sin(theta1) * radius;

    const left0 = transformPoint([-halfLength, y0, z0], transform);
    const right0 = transformPoint([halfLength, y0, z0], transform);
    const right1 = transformPoint([halfLength, y1, z1], transform);
    const left1 = transformPoint([-halfLength, y1, z1], transform);

    const normal0 = transformNormal([0, y0 / radius, z0 / radius], transform);
    const normal1 = transformNormal([0, y1 / radius, z1 / radius], transform);

    primitive.positions.push(...left0, ...right0, ...right1, ...left0, ...right1, ...left1);
    primitive.normals.push(...normal0, ...normal0, ...normal1, ...normal0, ...normal1, ...normal1);

    const capLeftCenter = transformPoint([-halfLength, 0, 0], transform);
    const capLeftA = transformPoint([-halfLength, y1, z1], transform);
    const capLeftB = transformPoint([-halfLength, y0, z0], transform);
    const leftNormal = transformNormal([-1, 0, 0], transform);
    primitive.positions.push(...capLeftCenter, ...capLeftA, ...capLeftB);
    primitive.normals.push(...leftNormal, ...leftNormal, ...leftNormal);

    const capRightCenter = transformPoint([halfLength, 0, 0], transform);
    const capRightA = transformPoint([halfLength, y0, z0], transform);
    const capRightB = transformPoint([halfLength, y1, z1], transform);
    const rightNormal = transformNormal([1, 0, 0], transform);
    primitive.positions.push(...capRightCenter, ...capRightA, ...capRightB);
    primitive.normals.push(...rightNormal, ...rightNormal, ...rightNormal);
  }
}

function buildCarModel() {
  const materials = [
    {
      name: 'Body',
      pbrMetallicRoughness: {
        baseColorFactor: [0.12, 0.32, 0.78, 1],
        metallicFactor: 0.32,
        roughnessFactor: 0.44
      }
    },
    {
      name: 'Glass',
      pbrMetallicRoughness: {
        baseColorFactor: [0.72, 0.84, 0.95, 0.72],
        metallicFactor: 0.04,
        roughnessFactor: 0.08
      },
      alphaMode: 'BLEND'
    },
    {
      name: 'Rubber',
      pbrMetallicRoughness: {
        baseColorFactor: [0.06, 0.06, 0.07, 1],
        metallicFactor: 0,
        roughnessFactor: 0.94
      }
    },
    {
      name: 'Rim',
      pbrMetallicRoughness: {
        baseColorFactor: [0.78, 0.8, 0.84, 1],
        metallicFactor: 0.88,
        roughnessFactor: 0.24
      }
    },
    {
      name: 'Headlight',
      pbrMetallicRoughness: {
        baseColorFactor: [0.97, 0.97, 0.92, 1],
        metallicFactor: 0.05,
        roughnessFactor: 0.14
      },
      emissiveFactor: [0.45, 0.42, 0.25]
    },
    {
      name: 'Taillight',
      pbrMetallicRoughness: {
        baseColorFactor: [0.83, 0.12, 0.12, 1],
        metallicFactor: 0.04,
        roughnessFactor: 0.18
      },
      emissiveFactor: [0.32, 0.05, 0.05]
    },
    {
      name: 'Trim',
      pbrMetallicRoughness: {
        baseColorFactor: [0.16, 0.17, 0.19, 1],
        metallicFactor: 0.24,
        roughnessFactor: 0.64
      }
    }
  ];

  const body = createPrimitive(0);
  const glass = createPrimitive(1);
  const tires = createPrimitive(2);
  const rims = createPrimitive(3);
  const headlights = createPrimitive(4);
  const taillights = createPrimitive(5);
  const trim = createPrimitive(6);

  addBox(body, { translation: [0, 0, 0] }, [1.92, 0.34, 3.75]);
  addBox(body, { translation: [0, 0.24, -1.15] }, [1.82, 0.18, 1.22]);
  addBox(body, { translation: [0, 0.26, 1.45] }, [1.78, 0.16, 0.84]);
  addBox(body, { translation: [0, 0.48, 0.18] }, [1.54, 0.28, 1.72]);
  addBox(body, { translation: [0, 0.82, 0.18] }, [1.34, 0.08, 0.92]);
  addBox(body, { translation: [0, 0.18, -1.98] }, [1.88, 0.14, 0.16]);
  addBox(body, { translation: [0, 0.18, 2.01] }, [1.82, 0.14, 0.16]);

  addBox(glass, { translation: [0, 0.55, -0.46], rotation: [52, 0, 0] }, [1.32, 0.54, 0.08]);
  addBox(glass, { translation: [0, 0.55, 0.84], rotation: [-55, 0, 0] }, [1.28, 0.44, 0.08]);
  addBox(glass, { translation: [0, 0.73, 0.18] }, [1.22, 0.26, 0.72]);
  addBox(glass, { translation: [-0.67, 0.44, 0.18] }, [0.04, 0.22, 1.28]);
  addBox(glass, { translation: [0.67, 0.44, 0.18] }, [0.04, 0.22, 1.28]);

  addBox(trim, { translation: [0, -0.12, -0.32] }, [1.42, 0.12, 2.26]);
  addBox(trim, { translation: [-0.86, 0.08, -0.1] }, [0.08, 0.14, 2.92]);
  addBox(trim, { translation: [0.86, 0.08, -0.1] }, [0.08, 0.14, 2.92]);
  addBox(trim, { translation: [0, 0.1, -2.03] }, [0.66, 0.12, 0.04]);
  addBox(trim, { translation: [-0.98, 0.32, -0.38] }, [0.12, 0.08, 0.22]);
  addBox(trim, { translation: [0.98, 0.32, -0.38] }, [0.12, 0.08, 0.22]);

  addBox(headlights, { translation: [-0.56, 0.22, -2.05] }, [0.34, 0.1, 0.06]);
  addBox(headlights, { translation: [0.56, 0.22, -2.05] }, [0.34, 0.1, 0.06]);
  addBox(taillights, { translation: [-0.54, 0.24, 2.06] }, [0.26, 0.1, 0.06]);
  addBox(taillights, { translation: [0.54, 0.24, 2.06] }, [0.26, 0.1, 0.06]);

  const wheelPositions = [
    [-0.99, -0.36, -1.27],
    [0.99, -0.36, -1.27],
    [-0.99, -0.36, 1.27],
    [0.99, -0.36, 1.27]
  ];

  for (const wheelPosition of wheelPositions) {
    addCylinderX(tires, { translation: wheelPosition }, 0.39, 0.28, 18);
    addCylinderX(rims, { translation: wheelPosition }, 0.2, 0.3, 18);
  }

  return {
    materials,
    primitives: [body, glass, tires, rims, headlights, taillights, trim]
  };
}

function createAccessor(positionArray, normalArray, chunkState) {
  const positionBuffer = Buffer.from(new Float32Array(positionArray).buffer);
  const normalBuffer = Buffer.from(new Float32Array(normalArray).buffer);

  const alignedPositionLength = Math.ceil(positionBuffer.length / 4) * 4;
  const alignedNormalLength = Math.ceil(normalBuffer.length / 4) * 4;

  const positionByteOffset = chunkState.byteLength;
  chunkState.parts.push(positionBuffer);
  chunkState.byteLength += positionBuffer.length;
  if (alignedPositionLength > positionBuffer.length) {
    const positionPadding = Buffer.alloc(alignedPositionLength - positionBuffer.length);
    chunkState.parts.push(positionPadding);
    chunkState.byteLength += positionPadding.length;
  }

  const normalByteOffset = chunkState.byteLength;
  chunkState.parts.push(normalBuffer);
  chunkState.byteLength += normalBuffer.length;
  if (alignedNormalLength > normalBuffer.length) {
    const normalPadding = Buffer.alloc(alignedNormalLength - normalBuffer.length);
    chunkState.parts.push(normalPadding);
    chunkState.byteLength += normalPadding.length;
  }

  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];

  for (let index = 0; index < positionArray.length; index += 3) {
    min = [
      Math.min(min[0], positionArray[index]),
      Math.min(min[1], positionArray[index + 1]),
      Math.min(min[2], positionArray[index + 2])
    ];
    max = [
      Math.max(max[0], positionArray[index]),
      Math.max(max[1], positionArray[index + 1]),
      Math.max(max[2], positionArray[index + 2])
    ];
  }

  return {
    positionByteOffset,
    positionByteLength: alignedPositionLength,
    normalByteOffset,
    normalByteLength: alignedNormalLength,
    count: positionArray.length / 3,
    min,
    max
  };
}

function buildGlb() {
  const car = buildCarModel();
  const chunkState = {
    parts: [],
    byteLength: 0
  };
  const bufferViews = [];
  const accessors = [];
  const meshPrimitives = [];

  for (const primitive of car.primitives) {
    const accessInfo = createAccessor(primitive.positions, primitive.normals, chunkState);

    const positionViewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: accessInfo.positionByteOffset,
      byteLength: accessInfo.positionByteLength,
      target: 34962
    });

    const normalViewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: accessInfo.normalByteOffset,
      byteLength: accessInfo.normalByteLength,
      target: 34962
    });

    const positionAccessorIndex = accessors.length;
    accessors.push({
      bufferView: positionViewIndex,
      componentType: 5126,
      count: accessInfo.count,
      type: 'VEC3',
      min: accessInfo.min,
      max: accessInfo.max
    });

    const normalAccessorIndex = accessors.length;
    accessors.push({
      bufferView: normalViewIndex,
      componentType: 5126,
      count: accessInfo.count,
      type: 'VEC3'
    });

    meshPrimitives.push({
      attributes: {
        POSITION: positionAccessorIndex,
        NORMAL: normalAccessorIndex
      },
      material: primitive.material
    });
  }

  const binaryChunk = Buffer.concat(chunkState.parts);
  const json = {
    asset: {
      version: '2.0',
      generator: 'custom-player-car-glb-generator'
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'PlayerCar', mesh: 0 }],
    meshes: [{ name: 'PlayerCarMesh', primitives: meshPrimitives }],
    materials: car.materials,
    buffers: [{ byteLength: binaryChunk.length }],
    bufferViews,
    accessors
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json));
  const paddedJsonLength = Math.ceil(jsonBuffer.length / 4) * 4;
  const paddedJsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(paddedJsonLength - jsonBuffer.length, 0x20)]);
  const paddedBinaryLength = Math.ceil(binaryChunk.length / 4) * 4;
  const paddedBinaryBuffer = Buffer.concat([binaryChunk, Buffer.alloc(paddedBinaryLength - binaryChunk.length)]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJsonBuffer.length + 8 + paddedBinaryBuffer.length, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(paddedJsonBuffer.length, 0);
  jsonChunkHeader.write('JSON', 4);

  const binaryChunkHeader = Buffer.alloc(8);
  binaryChunkHeader.writeUInt32LE(paddedBinaryBuffer.length, 0);
  binaryChunkHeader.write('BIN\0', 4);

  return Buffer.concat([
    header,
    jsonChunkHeader,
    paddedJsonBuffer,
    binaryChunkHeader,
    paddedBinaryBuffer
  ]);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buildGlb());
console.log(`Wrote ${outputPath}`);
