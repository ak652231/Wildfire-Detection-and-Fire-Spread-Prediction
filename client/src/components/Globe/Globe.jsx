import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const Globe = () => {
  const cesiumContainerRef = useRef(null);
  const infoBoxRef = useRef(null);

  useEffect(() => {
    // Initialize Cesium viewer
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhYTQyNmYxZC0wZTIyLTQwYmUtYmIyOC0xYjhhODg4NTU3MmYiLCJpZCI6MjM2NzEwLCJpYXQiOjE3MjQ0OTAxNTJ9.yL7dvqPOgpKyRu01tJWanrPEO9cdM4upmLenOoPZRW0';

    const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
      terrainProvider: Cesium.createWorldTerrain()
    });

    // Set up click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const ray = viewer.camera.getPickRay(click.position);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      
      if (Cesium.defined(cartesian)) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        
        const info = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
        if (infoBoxRef.current) {
          infoBoxRef.current.innerText = info;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Cleanup function
    return () => {
      handler.destroy();
      viewer.destroy();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <>
      <div ref={cesiumContainerRef} style={{ width: '100%', height: '100vh' }} />
      <div 
        ref={infoBoxRef}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1
        }}
      >
        Click on the globe to get coordinates and location info.
      </div>
    </>
  );
};

export default Globe;