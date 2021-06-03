const { desktopCapturer, remote } = require('electron')
const { writeFile } = require('fs')
const { Menu, dialog } = remote

// dom buttons
const videoElement = document.querySelector('video')

const startBtn = document.getElementById('startBtn')
startBtn.onclick = e => {
  mediaRecorder.start()
  startBtn.classList.add('is-danger')
  startBtn.innerText = 'Recording'
}

const stopBtn = document.getElementById('stopBtn')
stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
}

const videoSelectBtn = document.getElementById('videoSelectBtn')
videoSelectBtn.onclick = getVideoSources

// global variables
let mediaRecorder
const recordedChunks = []


// get available sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  })

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      }
    })
  )

  videoOptionsMenu.popup()
}

// change the videosource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  }

  // create stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  // preview source in video element
  videoElement.srcObject = stream
  videoElement.play()

  // create media recorder
  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options)

  // event handlers
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.onstop = handleStop
}

// captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available')
  recordedChunks.push(e.data)
}

// saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  })

  const buffer = Buffer.from(await blob.arrayBuffer())

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.mov`
  })

  console.log(filePath)

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'))
  }
}
