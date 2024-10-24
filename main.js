// No need to import THREE or ARButton anymore, as they're available globally

let scene, camera, renderer;
let reticle;

async function init() {
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		20
	);
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;

	document.body.appendChild(renderer.domElement);

	// Add light
	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
	scene.add(light);

	// Create reticle for surface detection
	const geometry = new THREE.RingGeometry(0.05, 0.1, 32).rotateX(-Math.PI / 2);
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	reticle = new THREE.Mesh(geometry, material);
	reticle.matrixAutoUpdate = false;
	reticle.visible = false;
	scene.add(reticle);

	// Automatically request AR mode without button
	try {
		const session = await navigator.xr.requestSession("immersive-ar", {
			requiredFeatures: ["hit-test"],
		});
		renderer.xr.setSession(session);
	} catch (e) {
		console.error("Failed to start AR session:", e);
	}

	renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
	if (frame) {
		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		session.requestReferenceSpace("viewer").then((refSpace) => {
			session.requestHitTestSource({ space: refSpace }).then((source) => {
				const hitTestResults = frame.getHitTestResults(source);
				if (hitTestResults.length > 0) {
					const hit = hitTestResults[0];
					const hitPose = hit.getPose(referenceSpace);
					reticle.visible = true;
					reticle.matrix.fromArray(hitPose.transform.matrix);
				} else {
					reticle.visible = false;
				}
			});
		});
	}
	renderer.render(scene, camera);
}

init();
