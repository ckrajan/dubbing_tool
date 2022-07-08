
const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const GREEN = '#32EEDB';
const RED = '#FF2C35';
const BLUE = '#157AB3';
const ORANGE = '#eb9748';
let stopRendering = false;

function isMobile() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid || isiOS;
}

function distance(a, b) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function drawPath(ctx, points, closePath) {
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath) {
    region.closePath();
  }
  ctx.stroke(region);
}

let model, ctx, videoWidth, videoHeight, video, canvas,
  scatterGLHasInitialized = false, scatterGL, rafID;

const VIDEO_SIZE = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const renderPointcloud = mobile === false;
const stats = new Stats();
const state = {
  backend: mobile ? 'wasm' : 'webgl',
  //  maxFaces: 1,
  showFacemesh: false,
  showIrises: true
};

// if (renderPointcloud) {
//   state.renderPointcloud = true;
// }

function setupDatGui() {
  const gui = new dat.GUI();
  // gui.add(state, 'backend', ['webgl', 'wasm', 'cpu'])
  //     .onChange(async backend => {
  //       stopRendering = true;
  //       window.cancelAnimationFrame(rafID);
  //       await tf.setBackend(backend);
  //       stopRendering = false;
  //       requestAnimationFrame(renderPrediction);
  //     });

  // gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
  //   model = await faceLandmarksDetection.load(
  //       faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
  //       {maxFaces: val});
  // });

  gui.add(state, 'showFacemesh');
  gui.add(state, 'showIrises');

}

async function setupCamera() {
  video = document.getElementById('video');

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      // Only setting the video to a specified size in order to accommodate a
      // point cloud, so on mobile devices accept the default size.
      width: mobile ? undefined : VIDEO_SIZE,
      height: mobile ? undefined : VIDEO_SIZE
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

let counter = 0;
var canvas2 = document.getElementById('position');
var canvas3 = document.getElementById('brightness');
var startcontent = document.getElementById('startcontent');


function showMessage(msg, font, text_left, text_top) {
  ctx.font = font + "px Arial bold";
  //ctx.rotate(Math.PI*2/(i*6));
  ctx.fillStyle = RED;
  ctx.fillText(msg, text_left, text_top);
  //ctx.restore();
}

async function renderPrediction() {
  if (stopRendering) {
    return;
  }

  stats.begin();
  const predict_iris = true;
  const predictions = await model.estimateFaces({
    input: video,
    returnTensors: false,
    flipHorizontal: false,
    showIrises: predict_iris
  });
  total_height = video.videoHeight;
  total_width = video.videoWidth;

  text_left = total_width * 1 / 10
  text_top = total_height * 9 / 10
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  //ctx.scale(-1, 1);
  ctx.drawImage(
    video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
  //ctx.restore();

  //Get Brightness of the video frame
  var colorSum = 0;
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;
  var r, g, b, avg;

  for (var x = 0, len = data.length; x < len; x += 4) {
    r = data[x];
    g = data[x + 1];
    b = data[x + 2];

    avg = Math.floor((r + g + b) / 3);
    colorSum += avg;
  }

  var brightness = Math.floor(colorSum / (video.width * video.height));
  if (brightness < 100) {
    counter = 0;
    canvas3.style.display = "block";

    document.getElementById("counter").style.display = "none";
    //document.getElementById('record-button').style.display = "none";

    msg = "It's too dark. Please adjust your lighting";

    var con = canvas3.getContext("2d");
    con.fillStyle = "red";
    con.fillRect(0, 0, 500, 40);
    con.fillStyle = "white";
    con.font = "15pt sans-serif";
    con.fillText(msg, 10, 25);
  }
  else {
    canvas3.style.display = "none";

  }
  //console.log('Brightness is ::' + brightness);

  if (predictions.length == 0) {
    msg = "No face detected";
    var con = canvas2.getContext("2d");
    con.fillStyle = "red";
    con.fillRect(0, 0, 500, 40);
    con.fillStyle = "white";
    con.font = "15pt sans-serif";
    con.fillText(msg, 10, 25);
  }
  if (predictions.length > 0) {
    predictions.forEach(prediction => {
      const keypoints = prediction.scaledMesh;
      const bb = prediction.boundingBox;

      // console.log('Face in view confidence :: '+keypoints[454])
      x_point = keypoints[454][0];
      y_point = keypoints[454][1];
      z_point = keypoints[454][2];
      //console.log('depth ' + z_point);
      if ((x_point > 450 || x_point < 300) || (y_point < 150 || y_point > 300)) //&& (z_point>70 || z_point<60))
      {
        counter = 0;
        canvas2.style.display = "block";
        msg = "Please adjust your position in front of the camera";

        document.getElementById("counter").style.display = "none";
        //document.getElementById('record-button').style.display = "none";

        var con = canvas2.getContext("2d");
        con.fillStyle = "red";
        con.fillRect(0, 0, 500, 40);
        con.fillStyle = "white";
        con.font = "15pt sans-serif";
        con.fillText(msg, 10, 25);

      }
      else {
        if (document.getElementById("record-button").style.display == "none") {
          counter++;
          canvas2.style.display = "none";
          canvas3.style.display = "none";

          if (counter == 5) {
            const counter = document.getElementById('counter');
            let value = 6;
            document.getElementById("counter").style.display = "block";

            const intervalID = setInterval(() => {
              const nextValue = --value;

              if (nextValue === 0) {
                clearInterval(intervalID);

                return;
              }

              requestAnimationFrame(() => {
                counter.textContent = nextValue;
                counter.classList.remove('big');

                requestAnimationFrame(() => {
                  counter.classList.add('big');
                });
              });

            }, 1000);
          }

          if (counter == 120) {
            document.getElementById('record-button').style.display = "inline";
            testcontent.style.display = "none";
            startcontent.style.display = "block";

          }
        }

        else {
          document.getElementById("counter").style.display = "none";
          canvas2.style.display = "none";
          canvas3.style.display = "none";
        }
      }

      tl_x = keypoints[234][0];
      tl_y = keypoints[10][1];
      br_x = keypoints[454][0];
      br_y = keypoints[152][1];
      ww = br_x - tl_x;
      hh = br_y - tl_y;
      ctx.strokeStyle = ORANGE;

      ctx.beginPath();
      ctx.rect(tl_x, tl_y, ww, hh);
      ctx.lineWidth = 3;
      ctx.stroke();

      if (state.showFacemesh) {
        ctx.fillStyle = GREEN;

        for (let i = 0; i < NUM_KEYPOINTS; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];

          ctx.beginPath();
          ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      if (state.showIrises) {
        if (keypoints.length > NUM_KEYPOINTS) {
          ctx.strokeStyle = RED;
          ctx.lineWidth = 1;

          const leftCenter = keypoints[NUM_KEYPOINTS];
          const leftDiameterY = distance(
            keypoints[NUM_KEYPOINTS + 4], keypoints[NUM_KEYPOINTS + 2]);
          const leftDiameterX = distance(
            keypoints[NUM_KEYPOINTS + 3], keypoints[NUM_KEYPOINTS + 1]);

          ctx.beginPath();
          ctx.ellipse(
            leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2,
            0, 0, 2 * Math.PI);
          ctx.stroke();

          if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
            const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
            const rightDiameterY = distance(
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
            const rightDiameterX = distance(
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

            ctx.beginPath();
            ctx.ellipse(
              rightCenter[0], rightCenter[1], rightDiameterX / 2,
              rightDiameterY / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
      }

    });

  }

  stats.end();
  rafID = requestAnimationFrame(renderPrediction);
};



function getImageBrightness(imageSrc, callback) {
  var img = document.createElement("img");
  img.src = imageSrc;
  img.style.display = "none";
  document.body.appendChild(img);

  var colorSum = 0;

  img.onload = function () {
    // create canvas
    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var r, g, b, avg;

    for (var x = 0, len = data.length; x < len; x += 4) {
      r = data[x];
      g = data[x + 1];
      b = data[x + 2];

      avg = Math.floor((r + g + b) / 3);
      colorSum += avg;
    }

    var brightness = Math.floor(colorSum / (this.width * this.height));
    callback(brightness);
  }
}


async function main() {
  await tf.setBackend(state.backend);
  setupDatGui();

  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  //document.getElementById('main').appendChild(stats.dom);

  await setupCamera();
  video.play();
  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const canvasContainer = document.querySelector('.canvas-wrapper');
  canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

  ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = GREEN;
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 0.5;

  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    // {maxFaces: state.maxFaces}
  );
  renderPrediction();

};

main();
