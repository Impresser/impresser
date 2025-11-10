"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ThreeIsometricMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    const updateRendererSize = () => {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
    };

    updateRendererSize();
    container.appendChild(renderer.domElement);

    const d = 20;
    const getAspect = () => {
      if (!container) return 1;
      return container.clientWidth / container.clientHeight || 1;
    };

    const camera = new THREE.OrthographicCamera(
      -d * getAspect(),
      d * getAspect(),
      d,
      -d,
      1,
      1000
    );

    camera.position.set(20, 20, 20);
    camera.rotation.order = "YXZ";
    camera.rotation.y = -Math.PI / 4;
    camera.rotation.x = Math.atan(-1 / Math.sqrt(2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.zoomSpeed = 0.6;
    controls.panSpeed = 0.6;
    controls.rotateSpeed = 0.6;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minZoom = 0.5;
    controls.maxZoom = 5;

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_ROTATE,
    };

    const handleControlChange = () => {
      camera.updateProjectionMatrix();
    };
    controls.addEventListener("change", handleControlChange);

    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 50, 50);
    scene.add(pointLight);

    const axesHelper = new THREE.AxesHelper(40);
    scene.add(axesHelper);

    const planeGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      opacity: 0.5,
      transparent: true,
    });
    const grid = new THREE.Mesh(planeGeometry, planeMaterial);
    grid.rotation.order = "YXZ";
    grid.rotation.y = -Math.PI / 2;
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
    const boxMaterial = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(cube);

    let animationFrameId: number;
    const renderScene = () => {
      controls.update();
      renderer.render(scene, camera);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderScene();
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      updateRendererSize();
      const aspect = getAspect();
      camera.left = -d * aspect;
      camera.right = d * aspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
      renderScene();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.removeEventListener("change", handleControlChange);
      controls.dispose();
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      scene.remove(grid);
      scene.remove(cube);
      scene.remove(ambientLight);
      scene.remove(pointLight);
      scene.remove(axesHelper);
      planeGeometry.dispose();
      planeMaterial.dispose();
      boxGeometry.dispose();
      boxMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}

