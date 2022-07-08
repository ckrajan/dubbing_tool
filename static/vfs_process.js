
if (typeof eyes === 'undefined') {
  eyes = 'Eyes';
}
if (typeof eyes_straight === 'undefined') {
  eyes_straight = 'Straight';
}
if (typeof eyes_left === 'undefined') {
  eyes_left = 'Left';
}
if (typeof eyes_right === 'undefined') {
  eyes_right = 'Right';
}
if (typeof eyes_lowered === 'undefined') {
  eyes_lowered = 'lowered';
}

if (typeof head_position === 'undefined') {
  head_position = 'Head Position';
}
if (typeof head_straight === 'undefined') {
  head_straight = 'Straight';
}
if (typeof head_tilted === 'undefined') {
  head_tilted = 'Titled to Side';
}

if (typeof brightness_text === 'undefined') {
  brightness_text = 'Brightness';
}
if (typeof brightness_low === 'undefined') {
  brightness_low = 'Low';
}
if (typeof brightness_good === 'undefined') {
  brightness_good = 'Good';
}

if (typeof emotion_text === 'undefined') {
  emotion_text = 'Emotion';
}
if (typeof emot_smile === 'undefined') {
  emot_smile = 'Smiling';
}
if (typeof emot_notsmile === 'undefined') {
  emot_notsmile = 'Not smiling';
}
if (typeof emot_neutral === 'undefined') {
  emot_neutral = 'Neutral';
}

if (typeof mic_off === 'undefined') {
  mic_off = 'Microphone is Off. Please turn on it while recording';
}
if (typeof no_face === 'undefined') {
  no_face = 'Failed to detect, please adjust lighting and position';
}
if (typeof complete === 'undefined') {
  complete = 'Complete';
}

$("#upload-button").click(function () {
  $("#upload").click();
});

$('#upload').change(function () {

  var ID = 'processed_video';

  setTimeout(function () {

    var video_id = 'batch_video';
    video_id = ID + '_mp4';

    const ID2 = ID;
    const video_id2 = video_id;

    var upload_file = document.getElementById('upload').files[0];

    let videoMetaData = (upload_file) => {
      return new Promise(function (resolve, reject) {
        let video2 = document.createElement('video');
        video2.addEventListener('canplay', function () {
          resolve({
            video: video2,
            duration: Math.round(video.duration * 1000),
            height: video2.videoHeight,
            width: video2.videoWidth
          });
        });
        video2.src = URL.createObjectURL(upload_file);
        document.body.appendChild(video2);
        // video2.style.display = "none";
        // video2.muted = true;
        video2.play();
        video2.controls = true;

        video2.style.cssText = `
                position: fixed;
                left: 20vw;
                top: -2vh;
                width: 27vw;
                height: 65vh;
              `;
      })
    }

    videoMetaData($('#upload')[0].files[0]).then(function (value) {
      let videoCanvas = document.createElement('canvas');
      videoCanvas.height = value.height;
      videoCanvas.width = value.width;
      videoCanvas.getContext('2d').drawImage(value.video, 0, 0);
      var snapshot = videoCanvas.toDataURL('image/png');

      var arr = snapshot.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      var thumb_blob = new Blob([u8arr], { type: mime });
      var thumbfile = new File([thumb_blob], ID2 + '_thumb.png');

      var url = window.URL.createObjectURL(thumbfile);
      var a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = ID2 + '_thumb.png';
      document.body.appendChild(a);
      // a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    })

    var blob = upload_file.slice(0, upload_file.size, 'video/mp4');
    var rename_file = new File([blob], video_id2 + '.mp4');

    var url = window.URL.createObjectURL(rename_file);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = video_id2 + '.mp4';
    document.body.appendChild(a);
    // a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

  }, 5000);
});


const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const GREEN = '#7CFC00';
const RED = '#FF2C35';
const BLUE = '#157AB3';
const ORANGE = '#eb9748';
const WHITE = '#FFFFFF';
let review = false;
let stopRendering = true;
let video_file_uploaded = false;
var transcribe_json;
var min_dur = '';
var recordCounts = 0;
var sessionStart;
var sessionEnd;
var recordStart;
var recordEnd;

var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));

const isAndroid = /Android/i.test(navigator.userAgent);
const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

function isMobile() {
  return isAndroid || isiOS;
}

function distance(a, b) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

let model, ctx, ctx2, videoWidth, videoHeight, video, canvas, canvas2, stream,
  scatterGLHasInitialized = false, scatterGL, rafID;

const VIDEO_SIZE = 500;
const mobile = isMobile();
const stats = new Stats();
const state = {
  backend: mobile ? 'wasm' : 'webgl',
};

var showMetrics = document.getElementById('show_metrics');
// var showFacemesh = document.getElementById('show_mesh');
var mic_muted;

async function setupCamera() {
  video = document.getElementById('video');

  stream = await navigator.mediaDevices.getUserMedia({
    'audio': true,
    'video': {
      facingMode: 'user',
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

// stop both mic and camera
async function closeCamera() {
  stream = video.srcObject;
  stream.getTracks().forEach(function (track) {
    if (track.readyState == 'live') {
      track.stop();
    }
  });
}

let counter = 0;
var startcontent = document.getElementById('startcontent');

function colorChange() {
  var button = document.getElementById('record-button');
  var color = button.style.color;
  button.style.backgroundColor = button.style.backgroundColor === color ? 'red' : color;
  if (button.innerHTML == startrec) {
  }
}

function three_diff(a, b) {
  var diff = b.map(function (item, index) {
    return item - a[index];
  })
  return diff;
}

function distanceVector(diff) {
  var dx = diff[0];
  var dy = diff[1];
  var dz = diff[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function get_attention_value_mp(keypoints) {
  var left_end = keypoints[263];
  var right_end = keypoints[33];

  var right_end2 = keypoints[173];
  var right_top = keypoints[159];
  var right_bottom = keypoints[145];

  if (keypoints.length > NUM_KEYPOINTS) {
    const leftCenter = keypoints[NUM_KEYPOINTS];
    if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
      const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
      var diff_leftend = three_diff(left_end, leftCenter);
      var dist_leftend = distanceVector(diff_leftend);
      var diff_rightend = three_diff(rightCenter, right_end);
      var dist_rightend = distanceVector(diff_rightend);

      var diff_rightside = three_diff(right_end, right_end2);
      var dist_rightside = distanceVector(diff_rightside);
      var diff_righttop = three_diff(right_top, right_bottom);
      var dist_righttop = distanceVector(diff_righttop);

      var iris_dist_ratio = (dist_leftend - dist_rightend) / (dist_leftend + dist_rightend);
      var iris_lowered = dist_righttop / dist_rightside;

      if (iris_dist_ratio > 0.2) {
        ear_msg = eyes_right;
        attention_value = 0;
      }
      else if (iris_dist_ratio < -0.1) {
        ear_msg = eyes_left;
        attention_value = 0;
      }
      else {
        ear_msg = eyes_straight;
        attention_value = 1;
      }

      if (iris_lowered < 0.30) {
        ear_msg = eyes_lowered;
        attention_value = 0;
      }
    }
  }
  return { att_value: attention_value, msg: ear_msg }
}

function get_head_orientation_mp(keypoints) {
  left_ear = keypoints[454];
  right_ear = keypoints[234];
  nose = keypoints[1];
  mid_x = (right_ear[0] + left_ear[0]) / 2;
  mid_y = (right_ear[1] + left_ear[1]) / 2;
  mid_z = (right_ear[2] + left_ear[2]) / 2;
  mid = [mid_x, mid_y, mid_z];

  var nose_vector = mid.map(function (item, index) {
    return item - nose[index];
  })
  var unit_vector = [1, 1, 1];
  var norm_nose_vec = math.norm(nose_vector);
  var nose_angle = Math.acos(math.dot(unit_vector, nose_vector) / norm_nose_vec);
  var head_msg = '';
  var level = 0;
  var angle_diff = math.abs(nose_angle - 1.57);
  if (angle_diff > 0.5 && angle_diff < 1.4 && nose[0] < 300 && nose[0] > 220 && nose[1] < 335 && nose[1] > 240 && nose[2] < -31) {
    // Additional condition for accuracy: && nose[0] < 300 && nose[0] > 220 && nose[1] < 335 && nose[1] > 240 && nose[2] < -31
    level = 0;
    head_msg = head_straight;
    kr = angle_diff / 1.4;
    kg = 1 - kr;
  }
  else {
    level = 1;
    head_msg = head_tilted;
    kr = 1;
    kg = 0;
  }
  return { angle: angle_diff, lvl: level, msg: head_msg, kr, kg }
}

var framenum = 0;
var hmtcount = hmscount = emscount = emlcount = emlowcount = emrcount = bmgcount = bmlcount = emotscount = emotncount = emotnscount = 0;


function uploadVfsScore(res_json, filename = 'res.json') {
  var request = new XMLHttpRequest();
  request.onload = function () {
    console.log(request.responseText);
  };
  request.open("POST", "/submit_result");
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  request.send(res_json);
}

var emotion = 'smile';

async function renderPrediction() {
  stats.begin();

  if (!review) {
    // if (showMetrics.checked == true || showFacemesh.checked == true) {
    if (showMetrics.checked == true) {

      canvas.hidden = false;
      canvas2.hidden = true;
    }
    else {
      canvas.hidden = true;
      canvas2.hidden = false;
      document.getElementById('spinner').style.display = "none";

      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.drawImage(
        video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
      if (stopRendering == false) {
        document.getElementById('rec_indicator').style.display = "inline";
      }
    }
  }
  if (stopRendering && showMetrics.checked == false) {
    ctx.drawImage(
      video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
  }

  total_height = video.videoHeight;
  total_width = video.videoWidth;

  text_left = total_width * 1 / 10
  text_top = total_height * 9 / 10
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  //ctx.scale(-1, 1);
  ctx.drawImage(
    video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
  //ctx.restore();

  stats.end();
  if (!camera_stopped) {
    rafID = requestAnimationFrame(renderPrediction);
  }
}

var intervalTime = null;
var baseTime = 0.1;
var arr_timepoints = [];

async function renderPrediction2() {

  clearInterval(intervalTime);

  stats.begin();
  const predictions = await model.estimateFaces({
    input: video,
    returnTensors: false,
    flipHorizontal: false
  });

  if (predictions.length > 0) {
    predictions.forEach(async (prediction) => {
      const keypoints = prediction.scaledMesh;
      const bb = prediction.boundingBox;

      var mouthPoints = [
        78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95
      ];

      var arr_mouthPoints = [];

      for (var i = 0; i < mouthPoints.length; i++) {
        var test = [keypoints[mouthPoints[i]][0], keypoints[mouthPoints[i]][1]];
        arr_mouthPoints.push(test)
      }

      var points_str = JSON.stringify(arr_mouthPoints);
      var time_round = Math.fround(baseTime).toFixed(1);

      var arr_format = [Number(time_round), points_str];
      arr_timepoints.push(arr_format);

      // console.log(arr_format);

      baseTime = Number(baseTime) + 0.1;

      output_points = [keypoints[61], keypoints[292], keypoints[0], keypoints[17], keypoints[50], keypoints[280], keypoints[48], keypoints[4], keypoints[289], keypoints[206], keypoints[426], keypoints[133], keypoints[130], keypoints[159], keypoints[145], keypoints[362], keypoints[359], keypoints[386], keypoints[374], keypoints[122], keypoints[351], keypoints[46], keypoints[105], keypoints[107], keypoints[276], keypoints[334], keypoints[336]];

      var t1 = getTheta(output_points[2], output_points[0], output_points[3]);
      var t2 = getTheta(output_points[0], output_points[2], output_points[1]);
      var t3 = getTheta(output_points[6], output_points[7], output_points[8]);
      var t4 = getTheta(output_points[9], output_points[7], output_points[10]);
      var t5 = getTheta(output_points[0], output_points[7], output_points[1]);
      var t6 = getTheta(output_points[1], output_points[5], output_points[8]);
      var t7 = getTheta(output_points[1], output_points[10], output_points[8]);
      var t8 = getTheta(output_points[13], output_points[12], output_points[14]);
      var t9 = getTheta(output_points[21], output_points[22], output_points[23]);
      var t10 = getTheta(output_points[6], output_points[19], output_points[23]);

      await predictOne([t1, t2, t3, t4, t5, t6, t7, t8, t9, t10]);

      //Get Brightness of the video frame
      var colorSum = 0;
      var imageData = ctx.getImageData(0, 0, canvas.width, keypoints[152][1]);
      var data = imageData.data;
      var r, g, b, avg;

      for (var x = 0, len = data.length; x < len; x += 4) {
        r = data[x];
        g = data[x + 1];
        b = data[x + 2];

        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
      }

      var brightness = Math.floor(colorSum / (video.width * keypoints[152][1]));
      if (brightness < 100) {
        counter = 0;
      }
      var getheadorient = get_head_orientation_mp(keypoints);
      var angle = getheadorient.angle;
      var head_msg = getheadorient.msg;
      var kr = getheadorient.kr;
      var kg = getheadorient.kg;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 410, canvas.width, canvas.height);

      ctx.font = "16px Roboto";
      ctx.fillStyle = WHITE;
      ctx.fillText(head_position + ' : ', 250, 445);
      if (head_msg == head_tilted) {
        ctx.fillStyle = RED;
      }
      else {
        ctx.fillStyle = GREEN;
      }
      ctx.fillText(head_msg, 380, 445);

      var getatt = get_attention_value_mp(keypoints);
      var att_value = getatt.att_value;
      var earmsg = getatt.msg;

      ctx.fillStyle = WHITE;
      ctx.fillText(eyes + ' : ', 30, 445);
      if (earmsg == eyes_straight) {
        ctx.fillStyle = GREEN;
      }
      else {
        ctx.fillStyle = RED;
      }
      ctx.fillText(earmsg, 90, 445);

      ctx.fillStyle = WHITE;
      ctx.fillText(brightness_text + ' : ', 250, 475);
      if (brightness < 100) {
        brightmsg = brightness_low;
        ctx.fillStyle = RED;
      }
      else {
        brightmsg = brightness_good;
        ctx.fillStyle = GREEN;
      }
      ctx.fillText(brightmsg, 360, 475);

      ctx.fillStyle = WHITE;
      ctx.fillText(emotion_text + ' : ', 30, 475);

      if (stopRendering == false) {
        framenum++;

        if (head_msg == head_tilted) {
          hmtcount = hmtcount + 1;
        }
        else if (head_msg == head_straight) {
          hmscount = hmscount + 1;
        }

        if (earmsg == eyes_straight) {
          emscount = emscount + 1;
        }
        else if (earmsg == eyes_left) {
          emlcount = emlcount + 1;
        }
        else if (earmsg == eyes_right) {
          emrcount = emrcount + 1;
        }
        else if (earmsg == eyes_lowered) {
          emlowcount = emlowcount + 1;
        }

        if (brightmsg == brightness_good) {
          bmgcount = bmgcount + 1;
        }
        else if (brightmsg == brightness_low) {
          bmlcount = bmlcount + 1;
        }
      }

      if (playback.disabled == false) {
        document.getElementById('record-button').style.display = "none";
        document.getElementById('show_metrics').style.display = "none";
        // document.getElementById('show_mesh').style.display = "none";
        document.getElementById('controls').style.display = "none";
      }
      else {
        document.getElementById('record-button').style.display = "inline";
        document.getElementById('playback').style.display = "none";
        document.getElementById('accept-button').style.display = "none";
        document.getElementById('reject-button').style.display = "none";
      }

      if (recordButton.disabled == false && recordButton.textContent == startrec && choose.style.display == "none") {
        document.getElementById('show_metrics').style.display = "inline";
        // document.getElementById('show_mesh').style.display = "inline";
        document.getElementById('controls').style.display = "inline";
      }
      else {
        document.getElementById('show_metrics').style.display = "none";
        // document.getElementById('show_mesh').style.display = "none";
        document.getElementById('controls').style.display = "none";
      }

      if (choose.style.display == "none" && recordButton.disabled == false) {
        document.getElementById('record-button').style.display = "inline";
      }
      else {
        document.getElementById('record-button').style.display = "none";
        document.getElementById('show_metrics').style.display = "none";
        // document.getElementById('show_mesh').style.display = "none";
        document.getElementById('controls').style.display = "none";
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

      // if (showFacemesh.checked == true) {
      //   ctx.fillStyle = GREEN;

      //   for (let i = 0; i < NUM_KEYPOINTS; i++) {
      //     const x = keypoints[i][0];
      //     const y = keypoints[i][1];

      //     ctx.beginPath();
      //     ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
      //     ctx.fill();
      //   }

      //   if (keypoints.length > NUM_KEYPOINTS) {
      //     ctx.strokeStyle = RED;
      //     ctx.lineWidth = 1;

      //     const leftCenter = keypoints[NUM_KEYPOINTS];
      //     const leftDiameterY = distance(
      //       keypoints[NUM_KEYPOINTS + 4], keypoints[NUM_KEYPOINTS + 2]);
      //     const leftDiameterX = distance(
      //       keypoints[NUM_KEYPOINTS + 3], keypoints[NUM_KEYPOINTS + 1]);

      //     ctx.beginPath();
      //     ctx.ellipse(
      //       leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2,
      //       0, 0, 2 * Math.PI);
      //     ctx.stroke();

      //     if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
      //       const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
      //       const rightDiameterY = distance(
      //         keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
      //         keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
      //       const rightDiameterX = distance(
      //         keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
      //         keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

      //       ctx.beginPath();
      //       ctx.ellipse(
      //         rightCenter[0], rightCenter[1], rightDiameterX / 2,
      //         rightDiameterY / 2, 0, 0, 2 * Math.PI);
      //       ctx.stroke();
      //     }
      //   }
      // }

      if (emotion == "smile") {
        emotmsg = emot_smile;
        ctx.fillStyle = GREEN;
      }
      else if (emotion == "neutral") {
        emotmsg = emot_neutral;
        ctx.fillStyle = ORANGE;
      }
      else if (emotion == "notsmile") {
        emotmsg = emot_notsmile;
        ctx.fillStyle = RED;
      }
      ctx.fillText(emotmsg, 120, 475);

      if (stopRendering == false) {
        if (emotmsg == emot_smile) {
          emotscount = emotscount + 1;
          // console.log('emotscount', emotscount);
        }
        else if (emotmsg == emot_notsmile) {
          emotnscount = emotnscount + 1;
          // console.log('emotnscount', emotnscount);
        } else if (emotmsg == emot_neutral) {
          emotncount = emotncount + 1;
          // console.log('emotncount', emotncount);
        }
      }

    });
  }

  else {

    if (stopRendering == false) {
      framenum++;
    }
    ctx.font = "20px Roboto";
    ctx.fillStyle = RED;
    ctx.fillText(no_face, 30, 475);

    ctx2.font = "20px Roboto";
    ctx2.fillStyle = RED;
    ctx2.fillText(no_face, 30, 475);
  }

  stats.end();
  if (!camera_stopped) {

    intervalTime = setInterval(function () {

      rafID = requestAnimationFrame(renderPrediction2);

    }, 100);

  }
};

var camera_stopped = false;

async function render_canvas() {

  videoWidth = VIDEO_SIZE;
  videoHeight = VIDEO_SIZE;
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
  canvas.hidden = true;

  canvas2 = document.getElementById('raw_output');
  canvas2.width = videoWidth;
  canvas2.height = videoHeight;
  ctx2 = canvas2.getContext('2d');
  ctx2.translate(canvas2.width, 0);
  ctx2.scale(-1, 1);
  ctx2.fillStyle = GREEN;
  ctx2.strokeStyle = GREEN;
  ctx2.lineWidth = 0.5;
  canvas2.hidden = true;

  video.play();
  setTimeout(function () {
    canvas2.hidden = false;
  }, 1000);
}

function once(subject) {
  var first = true;
  return function () {
    if (first) {
      first = false;
    } else {
      return null;
    }
  };
}

function msConversion(millis) {
  let sec = Math.floor(millis / 1000);
  let hrs = Math.floor(sec / 3600);
  sec -= hrs * 3600;
  let min = Math.floor(sec / 60);
  sec -= min * 60;

  sec = '' + sec;
  sec = ('00' + sec).substring(sec.length);

  if (hrs > 0) {
    min = '' + min;
    min = ('00' + min).substring(min.length);
    return hrs + "h " + min + "m " + sec + "s";
  }
  else {
    return min + "m " + sec + "s";
  }
}

var wrapper = once(function () { alert("No more!"); });

async function main() {
  document.getElementById('spinner').style.display = "block";

  //Check if button has class 'disabled' and then do your function. 
  if (!$('#record-camera').hasClass('disabled')) {
    $('#record-camera').addClass('disabled');
    sessionStart = new Date();
    console.log('VFS Session started: ' + sessionStart);
    tf.setBackend(isMobile() ? 'wasm' : 'webgl').then(() => {
      console.log('TF Backend Set to WASM');
      //console.log(tf.wasm.getThreadsCount());
      initrecord();
    });
  }
}

async function initrecord() {

  await load();
  //await tf.setBackend(isMobile()?'wasm':'webgl');
  wrapper();

  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom

  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
  );
  // faceapi.tf.setBackend(state.backend);
  // Promise.all([
  //   faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
  //   // faceapi.nets.faceLandmark68Net.loadFromUri('/static/models'),
  //   faceapi.nets.faceExpressionNet.loadFromUri('/static/models')
  // ]).then(faceapi.tf.setBackend(state.backend))
  camera_stopped = false;
  await setupCamera();
  await render_canvas();
  renderPrediction();
  // toggleRecording();
  $('#record-camera').removeClass('disabled');
  choose.style.display = "none";
  upload_icon.style.display = "none";
  document.getElementById('record-camera').style.display = "none";
  canvas.style.visibility = "visible";
  canvas2.style.visibility = "visible";

  document.getElementById('controls').style.display = "inline";
  document.getElementById('show_metrics').style.display = "inline";
  // document.getElementById('show_mesh').style.display = "inline";
  document.getElementById('record-button').style.display = "inline";

  document.getElementById('loader').style.display = "none";
  document.getElementById('result_wait').style.display = "none";
};

// main();

//Recording controls

'use strict';

var ID = 'processed_video';

async function generateID_from_server() {
  const { request } = await axios.post("/generate_video_id", {
    course_id: '1001',
    user_name: 'rajan', contentType:
      "text/json"
  });

  return request
}

function generateID() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  var id = 'r-' + new Date().toISOString().slice(0, 10).replace(/-/g, "") + '-' + Math.random().toString(36).substr(2, 13) + Math.random().toString(36).substr(2, 13) + Math.random().toString(36).substr(3, 13);
  return id;
};

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var rawmediaRecorder;
var recordedBlobs;
var rawrecordedBlobs;
var sourceBuffer;
canvas = document.getElementById('output');
canvas2 = document.getElementById('raw_output');
let recordedVideo = document.querySelector('video#recorded');
// let recordedCanvas = document.querySelector('canvas#recorded_output');
// var ctxRec = recordedCanvas.getContext('2d');
// recordedCanvas.width = 500;
// recordedCanvas.height = 500;
// recordedCanvas.offsetTop = canvas.offsetTop;
// recordedCanvas.offsetLeft = canvas.offsetLeft;

var recordButton = document.getElementById('record-button');
var downloadButton = document.querySelector('button#accept-button');
var rejectButton = document.querySelector('button#reject-button');

var playback = document.getElementById('playback');

recordButton.onclick = toggleRecording;
downloadButton.onclick = download;
rejectButton.onclick = rejectVideo;

//Recorded video
// recordedVideo.addEventListener('play', function () {

//   var t = recordedVideo;
//   (function loop() {
//     if (!t.paused && !t.ended) {
//       ctxRec.drawImage(t, 0, 0);
//       setTimeout(loop, 1000 / 15); // drawing at 30fps
//     }
//   })();
// }, 0);

console.log('location.host:', location.host);
// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === 'https:' ||
  location.host.includes('localhost');
if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
    '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8,opus"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function rawhandleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    rawrecordedBlobs.push(event.data);
  }
}

var countdown;
var countdown_number;
const startrec = "Start Recording";
const stoprec = "Stop Recording";

function displayAnimation() {
  countdown_number = 6;
  countdown_trigger();
}

function countdown_trigger() {
  countdown_number--;
  if (countdown_number > 0) {
    span = document.getElementById("counter");
    span.innerHTML = countdown_number;
    if (countdown_number > 0) {
      countdown = setTimeout('countdown_trigger()', 1000);
    }
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
  console.log('Recorded Blobs: ', recordedBlobs);
}

function singleclick() {
  recordButton.onclick = "";
}

var choose = document.getElementById("choose_rec");
var upload_icon = document.getElementById("upload-button");
function toggleRecording1() {
  recordButton.onclick = toggleRecording;
}

var start;
var end;

var startTime = 0;
var elapsedTime = 0;
var intervalId = null;

function start_rec() {
  startTime = Date.now();
  //run setInterval() and save id
  intervalId = setInterval(function () {
    //calculate elapsed time
    const time = Date.now() - startTime + elapsedTime;

    //calculate different time measurements based on elapsed time
    const milliseconds = parseInt((time % 1000) / 10)
    const seconds = parseInt((time / 1000) % 60)
    const minutes = parseInt((time / (1000 * 60)) % 60)
    const hour = parseInt((time / (1000 * 60 * 60)) % 24);

    //display time
    putValue(hour, minutes, seconds, milliseconds);
  }, 100);
}

function reset_rec() {
  elapsedTime += Date.now() - startTime;
  elapsedTime = 0;
  startTime = Date.now();
  clearInterval(intervalId);
  putValue(0, 0, 0, 0);
}

function putValue(hour, minutes, seconds, milliseconds) {
  hour = hour < 10 ? '0' + hour : hour;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  milliseconds = milliseconds < 10 ? '0' + milliseconds : milliseconds;
  document.querySelector(".second").innerText = seconds;
  document.querySelector(".minute").innerText = minutes;
}

function toggleRecording() {
  mic_muted = stream.getAudioTracks()[0].muted;
  if (mic_muted == true) {
    alert(mic_off);
  }
  else {
    if (recordButton.textContent === startrec) {
      recordStart = new Date();
      console.log('VFS Recording started: ' + recordStart);
      recordButton.textContent = stoprec;
      showMetrics.checked = false;
      //showFacemesh.checked = false;
      colorChange();
      document.getElementById("counter").style.display = "block";
      displayAnimation();
      singleclick();
      playback.disabled = true;
      document.getElementById('show_metrics').style.display = "none";
      // document.getElementById('show_mesh').style.display = "none";
      document.getElementById('controls').style.display = "none";

      fetch('/min_duration')
        .then(function (response) {
          return response.text();
        }).then(function (text) {
          min_dur = text;
        });

      setTimeout(function () {
        document.getElementById("counter").style.display = "none";
        toggleRecording1();
        startRecording();
        start = new Date();
        renderPrediction2();
      }, 6000);

    } else {
      end = new Date();
      colorChange();
      stopRecording();
      recordButton.textContent = startrec;
    }
  }
}

var snapcanvas, context, w, h, ratio, imageURI;
snapcanvas = document.getElementById('thumb_canvas');
context = snapcanvas.getContext('2d');

function thumb_upload() {
  // ratio = video.videoWidth / video.videoHeight;
  // w = video.videoWidth - 100;
  // h = parseInt(w / ratio, 10);
  snapcanvas.width = video.videoWidth;
  snapcanvas.height = video.videoHeight;

  context.fillRect(0, 0, snapcanvas.width, snapcanvas.height);
  context.drawImage(video, 0, 0, snapcanvas.width, snapcanvas.height);

  // get image URI from canvas object
  imageURI = snapcanvas.toDataURL("image/jpeg");
}

function startRecording() {
  document.getElementById('thumb_upload').click();
  start_rec();
  generateID_from_server()
    .then(result => ID = result.responseText)
    .catch(error => console.error('Video id generated from client', error),
      ID = generateID());

  hmtcount = hmscount = emscount = emlowcount = emlcount = emrcount = bmgcount = bmlcount = emotscount = emotncount = emotnscount = 0;
  framenum = 0;
  stopRendering = false;
  var options = {
    audioBitsPerSecond: 69000,
    videoBitsPerSecond: 292000,
    mimeType: 'video/webm;codecs=vp8,opus'
  }
  //var options = {mimeType: 'video/webm;codecs=vp9', bitsPerSecond: 100000};
  recordedBlobs = [];
  rawrecordedBlobs = [];
  try {
    const stream2 = canvas.captureStream()
    const stream3 = canvas2.captureStream()

    var audioTrack = stream.getTracks().filter(function (track) {
      return track.kind === 'audio'
    })[0];
    stream2.addTrack(audioTrack);
    stream3.addTrack(audioTrack);

    mediaRecorder = new MediaRecorder(stream2, options);
    rawmediaRecorder = new MediaRecorder(stream3, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', options, e0);
    try {
      options = { mimeType: 'video/webm;codecs=vp8,opus', bitsPerSecond: 100000 };
      mediaRecorder = new MediaRecorder(stream2, options);
      rawmediaRecorder = new MediaRecorder(stream3, options);
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', options, e1);
      try {
        mediaRecorder = new MediaRecorder(stream2);
        rawmediaRecorder = new MediaRecorder(stream3);
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.');
        console.log('Unable to create MediaRecorder', e2);
        return;
      }
    }
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  playback.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  rawmediaRecorder.ondataavailable = rawhandleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  rawmediaRecorder.start(10);
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  clearInterval(intervalTime);
  var myJsonString = JSON.stringify(arr_timepoints);
  console.log("myJsonString:: ",myJsonString);
  var json_blob = new Blob([myJsonString], { type: 'text/json' });
  // json_file = new File([json_blob], 'baseline.json');

  var url = window.URL.createObjectURL(json_blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'baseline.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);

  mediaRecorder.stop();
  closeCamera();
  camera_stopped = true;
  recordButton.disabled = true;
  recordButton.style.display = "none";
  rawmediaRecorder.stop();
  playback.disabled = false;
  stopRendering = true;
  recordedVideo.controls = true;
  document.getElementById('rec_indicator').style.display = "none";
  reset_rec();

  document.getElementById('playback').style.display = "inline-block";
  document.getElementById('accept-button').style.display = "inline-block";
  document.getElementById('reject-button').style.display = "inline-block";

  review = true;
  recordEnd = new Date();
  console.log('VFS Recording ended: ' + recordEnd);
  recordCounts++;
  console.log('VFS Recording count: ' + recordCounts);
  // console.log('Clicked play button');
  downloadButton.disabled = false;
  rejectButton.disabled = false;
  video.pause();

  var type = (recordedBlobs[0] || {}).type;
  var superBuffer = new Blob(recordedBlobs, { type });
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  canvas.hidden = true;
  canvas2.hidden = true;
  console.log('Before starting video');
  recordedVideo.hidden = false;
  // recordedCanvas.hidden = false
  // recordedCanvas.width = 500
  // recordedCanvas.height = 500
  console.log('After starting video');
  playback.style.display = 'block';
}

var vid_play = false;
// recordedCanvas.classList.toggle('playing');

function play() {
  if (vid_play == false) {
    // recordedCanvas.classList.remove('playing');
    playback.style.display = 'none';
    review = true;
    console.log('Clicked play button');
    recordButton.disabled = true;
    downloadButton.disabled = false;
    rejectButton.disabled = false;
    video.pause();

    var type = (recordedBlobs[0] || {}).type;
    var superBuffer = new Blob(recordedBlobs, { type });
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    canvas.hidden = true;
    canvas2.hidden = true;
    console.log('Before starting video');
    recordedVideo.hidden = false;
    // recordedCanvas.hidden = false
    // recordedCanvas.width = 500
    // recordedCanvas.height = 500

    recordedVideo.play();
    console.log('After starting video');
  }
  else {
    // recordedCanvas.classList.remove('playing');
    playback.style.display = 'none';
    recordedVideo.play();
  }
}

document.getElementById('playback').addEventListener('click', () => {
  play();
  vid_play = true;
  // recordedCanvas.classList.remove('playing');
});

// recordedCanvas.addEventListener('click', () => {
//   if (recordedCanvas.classList.contains('playing')) {
//     recordedVideo.play();
//     playback.style.display = 'none';
//   }
//   else {
//     vid_play = true;
//     playback.style.display = 'block';
//     recordedVideo.pause();
//     recordedCanvas.classList.remove('playing');
//   }
// });


recordedVideo.addEventListener('ended', showPlayback, false);
function showPlayback(e) {
  playback.style.display = 'block';
  // recordedCanvas.classList.remove('playing');
}

// var transcription_result_string = '';
// var transcription_result_status = 'pending';
var myVar;

var rawfile;
var rawfile_live;
var video_id;
var partial_json_file;
var final_json_file = 'res.json';

var blob;
var rawblob;
var processedfile;

var language = document.getElementById('partner_language').dataset.language;

function download() {
  var min_time = end - start;
  min_time /= 1000;
  // get seconds 
  var min_duration = min_time;

  if (min_duration > min_dur) {
    choose.style.display = "none";
    upload_icon.style.display = "none";
    document.getElementById('record-camera').style.display = "none";

    document.getElementById('loader').style.display = "inline";
    document.getElementById('result_wait').style.display = "inline";

    sessionEnd = new Date();
    console.log('VFS Session ended: ' + sessionEnd);

    recordedVideo.style = { visibility: "hidden" };
    blob = new Blob(recordedBlobs, { type: 'video/webm' });
    rawblob = new Blob(rawrecordedBlobs, { type: 'video/webm' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    video_id = 'processed_video';
    video_id = ID + '_mp4';
    raw_video_id = ID;
    a.download = video_id + '.webm';
    document.body.appendChild(a);
    // a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

    processedfile = new File([blob], 'processed_video' + '.webm');

    if (language == 'hi') {
      raw_video_id = raw_video_id + "_hi";
      rawfile = new File([rawblob], raw_video_id + '.webm');
      rawfile_live = new File([rawblob], ID + '.webm');
    }
    else {
      rawfile = new File([rawblob], raw_video_id + '.webm');
      rawfile_live = new File([rawblob], raw_video_id + '.webm');
    }
    // thumbnail
    var arr = imageURI.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    var thumb_blob = new Blob([u8arr], { type: mime });
    var thumbfile = new File([thumb_blob], ID + '_thumb.jpg');

    video.play();
    review = false;
    canvas.style.visibility = "hidden";
    canvas2.style.visibility = "hidden";
    recordedVideo.hidden = true;
    downloadButton.disabled = true;
    rejectButton.disabled = true;
    recordButton.disabled = false;
    recordButton.style.display = "none";
    playback.disabled = true;
    recordedVideo.pause();
    playback.style.display = "none";
    downloadButton.style.display = "none";
    rejectButton.style.display = "none";
    document.getElementById('controls').style.display = "none";

  }

  else {
    try {
      throw "video length insufficient";
    }
    catch (err) {
      console.log(err);
    }
    document.getElementById('min_duration').style.display = "inline";
    document.getElementById('loader').style.display = "none";
    choose.style.display = "none";
    document.getElementById('record-camera').style.display = "none";
    recordedVideo.style = { visibility: "hidden" };
    review = false;
    canvas.style.visibility = "hidden";
    canvas2.style.visibility = "hidden";
    recordedVideo.hidden = true;
    downloadButton.disabled = true;
    rejectButton.disabled = true;
    recordButton.disabled = false;
    recordButton.style.display = "none";
    playback.disabled = true;
    recordedVideo.pause();
    playback.style.display = "none";
    downloadButton.style.display = "none";
    rejectButton.style.display = "none";
    document.getElementById('controls').style.display = "none";
    video.play();
    upload_icon.style.display = "none";

  }
}

async function rejectVideo() {
  document.getElementById('min_duration').style.display = "none";
  document.getElementById('playback').style.display = "none";
  document.getElementById('spinner').style.display = "block";
  await initrecord();
  camera_stopped = false;
  document.getElementById('accept-button').style.display = "none";
  document.getElementById('reject-button').style.display = "none";
  document.getElementById('controls').style.display = "inline";
  document.getElementById('show_metrics').style.display = "inline";
  // document.getElementById('show_mesh').style.display = "inline";

  recordedVideo.style = { visibility: "hidden" };
  recordButton.style.display = "inline";
  recordButton.disabled = false;
  video.play();
  review = false;

  if (showMetrics.checked == true) {
    canvas.hidden = false;
    canvas2.hidden = true;
  }
  else {
    canvas.hidden = true;
    canvas2.hidden = false;
  }
  recordedVideo.hidden = true;
  downloadButton.disabled = true;
  rejectButton.disabled = true;
  playback.disabled = true;
  recordedVideo.pause();
  // singleclick();
}

async function rerecordVideo() {
  document.getElementById('min_duration').style.display = "none";
  document.getElementById('spinner').style.display = "block";
  await initrecord();
  camera_stopped = false;
  document.getElementById('playback').style.display = "none";
  document.getElementById('accept-button').style.display = "none";
  document.getElementById('reject-button').style.display = "none";
  document.getElementById('controls').style.display = "inline";
  document.getElementById('show_metrics').style.display = "inline";
  // document.getElementById('show_mesh').style.display = "inline";

  recordedVideo.style = { visibility: "hidden" };
  recordButton.style.display = "inline";
  recordButton.disabled = false;
  video.play();
  review = false;

  if (showMetrics.checked == true) {
    canvas.hidden = false;
    canvas2.hidden = true;
  }
  else {
    canvas.hidden = true;
    canvas2.hidden = false;
  }
  recordedVideo.hidden = true;
  downloadButton.disabled = true;
  rejectButton.disabled = true;
  playback.disabled = true;
  recordedVideo.pause();
  // singleclick();
}

function upload() {
  var blob = new Blob(recordedBlobs, { type: 'video/webm' });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  var video_id = ID();
  a.download = video_id + '.webm';
  //Lines to be changes : Mani
  //Refer : https://stackoverflow.com/questions/68240622/how-to-upload-files-to-aws-s3-directly-from-the-browserfront-end-using-presign
  file = '';
  //document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function njArray() {
  var a = nj.array([2, 3, 4]);
  return a;
}

function test() {
  a = njArray();
  b = math.norm()
  console.log(a.shape);
}

function getTheta(p1, p2, p3) {
  x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1], x3 = p3[0], y3 = p3[1];
  var beta = (Math.atan((y3 - y2) / (x3 - x2)));
  var alpha = Math.atan((y1 - y2) / (x1 - x2));

  var theta = (beta - alpha) * 57.2958;
  if (theta < 0) {
    theta = theta * (-1);
  }
  return theta;
}

const classifier = knnClassifier.create();

async function load() {
  knnmodel();
}

async function knnmodel() {

  var xTrain = [];
  var yTrain = [];
  function csvToArray(csv) {
    rows = csv.split("\n");
    var input = rows.map(function (row) {
      var row_arr = row.split(",")
      row_arr.shift();
      row_arr.pop();
      var numberArray = row_arr.map(Number);
      return numberArray;
    });
    xTrain = input;

    var label = rows.map(function (row) {
      var row_arr = row.split(",")
      var popped = row_arr.pop();
      return popped;
    });
    yTrain = label;
    return label;
  };


  const downloadCsv = async () => {
    try {
      // const target = 'http://localhost:8080/static/data/angles-from_videos.csv'; //file
      const target = 'http://localhost:8080/static/data/angles.csv'; //file

      const res = await fetch(target, {
        method: 'get',
        headers: {
          'content-type': 'text/csv;charset=UTF-8',
        }
      });

      if (res.status === 200) {

        const data = await res.text();
        csvToArray(data);
        train();
      } else {
        console.log('Error code');
      }
    } catch (err) {
      console.log(err)
    }
  }

  downloadCsv();

  const train = async function () {
    for (var i = 0; i < xTrain.length; i++) {
      var xTraini = tf.tensor(xTrain[i])
      classifier.addExample(xTraini, yTrain[i]);
    }
  }

}

const predictOne = async function (arr) {
  var xTest_Pred = tf.tensor(arr);
  const result = classifier.predictClass(xTest_Pred);
  result.then(
    function (value) {
      emotion = value['label'];
    },
    function (error) { console.log(error); }
  );
}