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
  // Calculate random positions for the planes
  const planePositions = imagesData.map(() => {
    const x = (Math.random() - 0.5) * 10; // Random X between -5 and 5
    const y = (Math.random() - 0.5) * 10; // Random Y between -5 and 5
    const z = (Math.random() - 0.5) * 10; // Random Z between -5 and 5
    return [x, y, z]; // Position each plane randomly
  });

  return (
    <Canvas camera={{fov: 80}}>
      {/* Add some basic lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <MapControls />

      {/* Map over the image data and render an ImagePlane for each */}
      {imagesData.map((image, index) => (
        <ImagePlane
          key={image.id}
          path={image.path}
          position={planePositions[index]} // Use the randomly generated position
        />
      ))}
    </Canvas>
  )
}

export default Experience