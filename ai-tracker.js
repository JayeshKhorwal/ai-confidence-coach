/* ═══════════════════════════════════════════════════════════
   Phase 8: AI Camera Tracking — MoveNet Pose Detection
   ═══════════════════════════════════════════════════════════ */

const AITracker = (() => {
  let detector = null;
  let videoEl = null;
  let canvasEl = null;
  let ctx = null;
  let statusEl = null;
  let animFrameId = null;
  let stream = null;

  // MoveNet skeleton connections (pairs of keypoint indices)
  const SKELETON_CONNECTIONS = [
    [5, 6],   // left shoulder -> right shoulder
    [5, 7],   // left shoulder -> left elbow
    [7, 9],   // left elbow -> left wrist
    [6, 8],   // right shoulder -> right elbow
    [8, 10],  // right elbow -> right wrist
    [5, 11],  // left shoulder -> left hip
    [6, 12],  // right shoulder -> right hip
    [11, 12], // left hip -> right hip
    [11, 13], // left hip -> left knee
    [13, 15], // left knee -> left ankle
    [12, 14], // right hip -> right knee
    [14, 16], // right knee -> right ankle
  ];

  // Minimum confidence to draw a keypoint
  const MIN_CONFIDENCE = 0.3;

  /**
   * Initialize webcam + model, start tracking loop
   */
  async function init() {
    videoEl = document.getElementById('ai-video');
    canvasEl = document.getElementById('ai-canvas');
    statusEl = document.getElementById('ai-status');

    if (!videoEl || !canvasEl) {
      console.error('AITracker: video or canvas element not found');
      return;
    }

    ctx = canvasEl.getContext('2d');

    // 1 — Request webcam
    setStatus('Requesting camera access...');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (err) {
      console.error('AITracker: camera access denied', err);
      setStatus('⚠ Camera access denied. Please allow permissions.');
      return;
    }

    // Match canvas size to video
    videoEl.addEventListener('loadeddata', () => {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
    });

    // 2 — Load MoveNet model
    setStatus('Loading AI model...');
    try {
      await tf.setBackend('webgl');
      await tf.ready();

      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      setStatus('AI Model Loaded. Strike a Pose. 🤖');
    } catch (err) {
      console.error('AITracker: failed to load model', err);
      setStatus('⚠ Failed to load AI model.');
      return;
    }

    // 3 — Start render loop
    trackFrame();
  }

  /**
   * Main render loop — estimate poses and draw skeleton
   */
  async function trackFrame() {
    if (!detector || !videoEl || videoEl.readyState < 2) {
      animFrameId = requestAnimationFrame(trackFrame);
      return;
    }

    try {
      const poses = await detector.estimatePoses(videoEl);

      // Clear canvas
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      if (poses && poses.length > 0) {
        const keypoints = poses[0].keypoints;
        drawSkeleton(keypoints);
        drawKeypoints(keypoints);
      }
    } catch (err) {
      // Silently continue on frame errors
    }

    animFrameId = requestAnimationFrame(trackFrame);
  }

  /**
   * Draw glowing cyan circles at each detected keypoint
   */
  function drawKeypoints(keypoints) {
    for (const kp of keypoints) {
      if (kp.score < MIN_CONFIDENCE) continue;

      const { x, y } = kp;

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#00E5FF';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Draw glowing lines between connected keypoints
   */
  function drawSkeleton(keypoints) {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;

    for (const [i, j] of SKELETON_CONNECTIONS) {
      const kpA = keypoints[i];
      const kpB = keypoints[j];

      if (kpA.score < MIN_CONFIDENCE || kpB.score < MIN_CONFIDENCE) continue;

      ctx.beginPath();
      ctx.moveTo(kpA.x, kpA.y);
      ctx.lineTo(kpB.x, kpB.y);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Update the HUD status text
   */
  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  /**
   * Stop camera stream and cancel render loop
   */
  function stop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    if (videoEl) {
      videoEl.srcObject = null;
    }

    if (ctx && canvasEl) {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }

    setStatus('Waking up AI model...');
  }

  // Public API
  return { init, stop };
})();
