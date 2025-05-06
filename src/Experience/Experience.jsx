import { Canvas, useThree } from "@react-three/fiber";
import { MapControls, Plane, useTexture, Text } from "@react-three/drei";
import * as THREE from 'three';
import imagesData from '../Service/images.json';
import { useState, useCallback, useEffect, Suspense, useMemo } from 'react';
import imageDescriptions from '../Service/imageDescriptions.json';

// Component to render a single image plane with error handling
function ImagePlane({ path, position, id, onClick }) {
  // Always call hooks at the top level, not conditionally
  const texture = useTexture(path);

  // Handle errors with state instead of try/catch around hooks
  const [hasError, setHasError] = useState(false);
  
  // Use useEffect to handle texture loading errors
  useEffect(() => {
    const handleError = () => {
      console.error(`Error loading texture for image ${id}: ${path}`);
      setHasError(true);
    };
    
    // Add error event listener to texture
    if (texture && texture.source) {
      const source = texture.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [texture, id, path]);

  // Get the natural dimensions of the loaded texture
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  
  // Use useEffect to get the natural dimensions once texture is loaded
  useEffect(() => {
    if (texture && texture.image) {
      const aspectRatio = texture.image.width / texture.image.height;
      // Keep a reasonable size in the 3D space while maintaining aspect ratio
      const maxDimension = 1.5; // Maximum size in any dimension
      let width, height;
      
      if (aspectRatio > 1) {
        // Landscape image
        width = Math.min(maxDimension, aspectRatio);
        height = width / aspectRatio;
      } else {
        // Portrait image
        height = Math.min(maxDimension, 1 / aspectRatio);
        width = height * aspectRatio;
      }
      
      setDimensions({ width, height });
    }
  }, [texture]);

  return (
    <Plane 
      args={[dimensions.width, dimensions.height]} 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id, path, position);
      }}
    > 
      <meshStandardMaterial 
        map={hasError ? null : texture} 
        color={hasError ? "#ff6b9d" : "#ffffff"}
        side={THREE.DoubleSide} 
      /> 
    </Plane>
  );
}

// Info window component that appears next to an image
function InfoWindow({ image, position }) {
  console.log("Rendering InfoWindow with:", { image, position });
  
  // Load info icon with error handling
  const [hasIconError, setHasIconError] = useState(false);
  const infoIcon = useTexture('/assets/icons/info.png');
  
  // Add error handling for icon loading
  useEffect(() => {
    const handleError = () => {
      console.error('Error loading info icon');
      setHasIconError(true);
    };
    
    if (infoIcon && infoIcon.source) {
      const source = infoIcon.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [infoIcon]);
  
  // Get the full image data from imagesData
  const imageData = imagesData.find(img => img.id === image.id) || {};
  
  return (
    <group position={[position[0] + 1.5, position[1], position[2] + 0.1]}>
      {/* Info window background */}
      <Plane args={[2, 1.5]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </Plane>
      
      {/* Info icon in the corner */}
      <Plane args={[0.4, 0.4]} position={[-0.7, 0.5, 0.01]}>
        <meshBasicMaterial 
          map={hasIconError ? null : infoIcon} 
          color={hasIconError ? "#ff6b9d" : "#ffffff"}
          transparent 
          opacity={0.9} 
        />
      </Plane>
      
      {/* Title text */}
      <Text 
        position={[0, 0.5, 0.01]}
        fontSize={0.15}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {imageData.title || "Untitled"}
      </Text>
      
      {/* Description text */}
      <Text 
        position={[0, 0.2, 0.01]}
        fontSize={0.1}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {imageData.description || "No description available"}
      </Text>
      
      {/* Details text */}
      <Text 
        position={[0, -0.2, 0.01]}
        fontSize={0.08}
        color="#555555"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        overflowWrap="break-word"
      >
        {imageData.details || "No additional details available"}
      </Text>
    </group>
  );
}

// Enhanced zoomed image view with error handling
function ZoomedImageView({ imagePath, onClose, onNext, onPrevious }) {
  const texture = useTexture(imagePath);
  const [hasError, setHasError] = useState(false);
  const { camera, size } = useThree();
  
  // Add error handling for texture loading
  useEffect(() => {
    const handleError = () => {
      console.error(`Error loading zoomed texture: ${imagePath}`);
      setHasError(true);
    };
    
    if (texture && texture.source) {
      const source = texture.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [texture, imagePath]);

  // Adjust camera position and zoom when component mounts
  useEffect(() => {
    // Save original camera position
    const originalPosition = camera.position.clone();
    
    // Move camera closer to the image
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    // Cleanup function to restore original camera position
    return () => {
      camera.position.copy(originalPosition);
      camera.lookAt(0, 0, 0);
    };
  }, [camera]);

  // Calculate aspect ratio and dimensions
  const imageAspect = texture && texture.image ? texture.image.width / texture.image.height : 1;
  const viewportAspect = size.width / size.height;
  
  let width, height;
  if (imageAspect > viewportAspect) {
    width = size.width * 0.8 / 100;
    height = width / imageAspect;
  } else {
    height = size.height * 0.8 / 100;
    width = height * imageAspect;
  }

  return (
    <group>
      {/* Semi-transparent background */}
      <Plane 
        args={[size.width / 50, size.height / 50]} 
        position={[0, 0, -0.1]}
        onClick={onClose}
      >
        <meshBasicMaterial color="#000000" transparent opacity={0.85} />
      </Plane>
      
      {/* Image with frame */}
      <group>
        {/* Frame */}
        <Plane 
          args={[width + 0.1, height + 0.1]} 
          position={[0, 0, -0.01]}
        >
          <meshBasicMaterial color="#ffffff" />
        </Plane>
        
        {/* Image */}
        <Plane args={[width, height]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            map={hasError ? null : texture} 
            color={hasError ? "#ff6b9d" : "#ffffff"}
            transparent 
          />
        </Plane>
      </group>
      
      {/* Navigation controls with icons */}
      <group position={[0, -height/2 - 0.8, 0]}>
        {/* Previous button */}
        <Plane 
          args={[0.6, 0.6]} // Square dimensions
          position={[-2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : prevIcon} 
            color="#ff6b9d" 
            transparent
          />
        </Plane>
        
        {/* Next button */}
        <Plane 
          args={[0.6, 0.6]} // Square dimensions
          position={[2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : nextIcon} 
            color="#ff6b9d" 
            transparent
          />
        </Plane>
        
        {/* Close button */}
        <Plane 
          args={[0.6, 0.6]} // Square dimensions
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : closeIcon} 
            color="#ffffff" 
            transparent
          />
        </Plane>
      </group>
    </group>
  );
}

function ImagePopup({ image, onClose, onNext, onPrevious }) {
  const texture = useTexture(image.path);
  const description = imageDescriptions[image.path] || "No description available.";

  // Dynamically calculate image aspect ratio and size
  let imageWidth = 4;
  let imageHeight = 4;
  if (texture?.image) {
    const aspect = texture.image.width / texture.image.height;
    if (aspect >= 1) {
      imageWidth = 4;
      imageHeight = 4 / aspect;
    } else {
      imageHeight = 4;
      imageWidth = 4 * aspect;
    }
  }

  // The rest of your layout constants
  const cardWidth = 8;
  const cardHeight = 6.5;
  const rightPanelWidth = 3.2;
  const buttonHeight = 0.7;
  const buttonWidth = 2.2;

  return (
    <group>
      {/* Modal overlay */}
      <Plane
        args={[16, 12]}
        position={[0, 0, 0.5]}
        onClick={onClose}
      >
        <meshBasicMaterial color="#eaeaea" transparent opacity={0.85} />
      </Plane>
      {/* Card background */}
      <Plane
        args={[cardWidth, cardHeight]}
        position={[0, 0, 1]}
      >
        <meshStandardMaterial color="#fff" transparent opacity={0.98} />
      </Plane>
      {/* Card border */}
      <Plane
        args={[cardWidth + 0.12, cardHeight + 0.12]}
        position={[0, 0, 0.99]}
      >
        <meshStandardMaterial color="#d3d3d3" transparent opacity={0.7} />
      </Plane>
      {/* Image frame (matches image aspect) */}
      <Plane
        args={[imageWidth + 0.18, imageHeight + 0.18]}
        position={[-(cardWidth / 2) + imageWidth / 2 + 0.3, 0.4, 1.015]}
      >
        <meshStandardMaterial color="#bbb" transparent opacity={0.18} />
      </Plane>
      {/* Image itself */}
      <Plane
        args={[imageWidth, imageHeight]}
        position={[-(cardWidth / 2) + imageWidth / 2 + 0.3, 0.4, 1.02]}
      >
        <meshStandardMaterial map={texture} color="#fff" />
      </Plane>
      {/* ... rest of your interface ... */}
      {/* Right panel */}
      <Plane
        args={[rightPanelWidth, cardHeight - 0.6]}
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, 0, 1.01]}
      >
        <meshStandardMaterial color="#f7f7f7" transparent opacity={0.95} />
      </Plane>
      {/* Name */}
      <Text
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, 1.8, 1.02]}
        fontSize={0.32}
        color="#222"
        anchorX="center"
        anchorY="middle"
        maxWidth={rightPanelWidth - 0.4}
      >
        {image.name || "NAME"}
      </Text>
      {/* Object count */}
      <Text
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, 1.3, 1.02]}
        fontSize={0.18}
        color="#888"
        anchorX="center"
        anchorY="middle"
        maxWidth={rightPanelWidth - 0.4}
      >
        {image.objects ? `${image.objects} objects` : "— objects"}
      </Text>
      {/* See Similar Button */}
      <Plane
        args={[buttonWidth, buttonHeight]}
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, 0.5, 1.02]}
        onClick={(e) => { e.stopPropagation(); /* handle see similar */ }}
      >
        <meshStandardMaterial color="#faff00" transparent opacity={0.9} />
      </Plane>
      <Text
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, 0.5, 1.03]}
        fontSize={0.18}
        color="#222"
        anchorX="center"
        anchorY="middle"
      >
        See Similar
      </Text>
      {/* Explore Button */}
      <Plane
        args={[buttonWidth, buttonHeight]}
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, -0.1, 1.02]}
        onClick={(e) => { e.stopPropagation(); /* handle explore */ }}
      >
        <meshStandardMaterial color="#eaeaea" transparent opacity={0.9} />
      </Plane>
      <Text
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.2, -0.1, 1.03]}
        fontSize={0.18}
        color="#222"
        anchorX="center"
        anchorY="middle"
      >
        EXPLORE THIS SPACE 🕵️
      </Text>
      {/* Previous/Next Buttons */}
      <Plane
        args={[buttonWidth / 2, buttonHeight]}
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.8, -1.2, 1.02]}
        onClick={(e) => { e.stopPropagation(); onPrevious(); }}
      >
        <meshStandardMaterial color="#eaeaea" transparent opacity={0.9} />
      </Plane>
      <Text
        position={[(cardWidth / 2) - rightPanelWidth / 2 - 0.8, -1.2, 1.03]}
        fontSize={0.16}
        color="#222"
        anchorX="center"
        anchorY="middle"
      >
        {"< Previous"}
      </Text>
      <Plane
        args={[buttonWidth / 2, buttonHeight]}
        position={[(cardWidth / 2) - rightPanelWidth / 2 + 0.4, -1.2, 1.02]}
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <meshStandardMaterial color="#eaeaea" transparent opacity={0.9} />
      </Plane>
      <Text
        position={[(cardWidth / 2) - rightPanelWidth / 2 + 0.4, -1.2, 1.03]}
        fontSize={0.16}
        color="#222"
        anchorX="center"
        anchorY="middle"
      >
        {"Next >"}
      </Text>
      {/* Description (below image) */}
      <Plane
        args={[imageWidth, 0.7]}
        position={[-(cardWidth / 2) + imageWidth / 2 + 0.3, -(imageHeight / 2) - 0.5, 1.01]}
      >
        <meshStandardMaterial color="#f7f7f7" transparent opacity={0.95} />
      </Plane>
      <Text
        position={[-(cardWidth / 2) + imageWidth / 2 + 0.3, -(imageHeight / 2) - 0.5, 1.02]}
        fontSize={0.18}
        color="#222"
        anchorX="center"
        anchorY="middle"
        maxWidth={imageWidth - 0.4}
      >
        {description}
      </Text>
      {/* Close button (top right) */}
      <Plane
        args={[0.5, 0.5]}
        position={[(cardWidth / 2) - 0.4, (cardHeight / 2) - 0.4, 1.1]}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <meshStandardMaterial color="#bbb" transparent opacity={0.8} />
      </Plane>
      <Text
        position={[(cardWidth / 2) - 0.4, (cardHeight / 2) - 0.4, 1.12]}
        fontSize={0.28}
        color="#fff"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>
    </group>
  );
}

function Experience() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const planePositions = useMemo(() => (
    imagesData.map(() => {
      const range = 5;
      const x = (Math.random() - 0.5) * range;
      const y = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      return [x, y, z];
    })
  ), []);

  const handleImageClick = useCallback((id, path, position) => {
    const index = imagesData.findIndex(img => img.id === id);
    setSelectedImageIndex(index);
    setShowPopup(true);
    setPopupText(''); // Or load saved text for this image if you want
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev + 1) % imagesData.length);
    setPopupText('');
  }, []);

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev - 1 + imagesData.length) % imagesData.length);
    setPopupText('');
  }, []);

  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 10] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={null}>
        <MapControls enabled={!showPopup} />
        {/* Image Grid */}
        {!showPopup && imagesData.map((image, index) => (
          <group key={image.id}>
            <ImagePlane
              id={image.id}
              path={image.path}
              position={planePositions[index]}
              onClick={handleImageClick}
            />
          </group>
        ))}
        {/* Popup */}
        {showPopup && selectedImageIndex !== null && (
          <ImagePopup
            image={imagesData[selectedImageIndex]}
            onClose={handleClosePopup}
            onNext={handleNext}
            onPrevious={handlePrevious}
            text={popupText}
            setText={setPopupText}
          />
        )}
      </Suspense>
    </Canvas>
  );
}

export default Experience;