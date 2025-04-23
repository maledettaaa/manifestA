import { Canvas } from "@react-three/fiber";
import { MapControls, Plane, useTexture } from "@react-three/drei";
import * as THREE from 'three'; // Import THREE
import imagesData from '../Service/images.json'; // Import the JSON data

// Component to render a single image plane
function ImagePlane({ path, position }) {
  const texture = useTexture(path); // Load the texture

  // Ensure the texture wraps correctly if needed, though maybe not necessary for Plane
  // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set(1, 1); // Adjust if necessary

  return (
    <Plane args={[1, 1]} position={position}> {/* Create a 1x1 plane */}
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} /> {/* Apply the texture */}
    </Plane>
  );
}


function Experience() {
  // Calculate random positions for the planes within a smaller range
  const planePositions = imagesData.map(() => {
    const range = 5; // Make the range smaller
    const x = (Math.random() - 0.5) * range; // Random X
    const y = (Math.random() - 0.5) * range; // Random Y
    const z = (Math.random() - 0.5) * range; // Random Z
    return [x, y, z];
  });

  return (
    // Explicitly set camera position
    <Canvas camera={{ fov: 75, position: [0, 0, 10] }}>
      {/* Add some basic lighting */}
      <ambientLight intensity={0.6} /> {/* Slightly increased intensity */}
      <directionalLight position={[10, 10, 10]} intensity={1} /> {/* Adjusted position */}

      <MapControls />

      {/* Add a simple visible object for debugging */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Map over the image data and render an ImagePlane for each */}
      {imagesData.map((image, index) => (
        <ImagePlane
          key={image.id}
          path={image.path}
          position={planePositions[index]}
        />
      ))}
    </Canvas>
  )
}

export default Experience