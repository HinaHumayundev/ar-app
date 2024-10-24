// Main.js
let scene, camera, renderer;
let reticle;

function init() {
	scene = new THREE.Scene();

	// Create a camera with AR capabilities
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

	// Add a light source
	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
	scene.add(light);

	// Create a reticle for detecting surfaces
	const geometry = new THREE.RingGeometry(0.05, 0.1, 32).rotateX(-Math.PI / 2);
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	reticle = new THREE.Mesh(geometry, material);
	reticle.matrixAutoUpdate = false;
	reticle.visible = false;
	scene.add(reticle);

	// Add AR button for enabling AR mode
	document.body.appendChild(
		ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
	);

	// Start the render loop
	renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
	if (frame) {
		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		// Use hit test to detect flat surfaces
		const viewerPose = frame.getViewerPose(referenceSpace);

		if (viewerPose) {
			const hitTestSource = session
				.requestReferenceSpace("viewer")
				.then((refSpace) => {
					return session.requestHitTestSource({ space: refSpace });
				});

			hitTestSource.then((source) => {
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
		}
	}
	renderer.render(scene, camera);
}

init();
