import React, { Component } from 'react';
import assign from 'object-assign';

class BeatsPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isLoaded: false,
      isPlaying: false,
      isPaused: false,
      startTime: 0,
      onTime: null,
      endTime: null,
      trackTime: 0,
      audioBufferSourceNode: null,
      audioBuffer: null,
      analyser: null,
      audioData: new Uint8Array(0)
    };
    // Button refs
    this.playButton = React.createRef();
    this.pauseButton = React.createRef();
    this.stopButton = React.createRef();
    // Bind this to methods
    this.fetchAudioBuffer = this.fetchAudioBuffer.bind(this);
    this.tick = this.tick.bind(this);
    this.playAudio = this.playAudio.bind(this);
    this.pauseAudio = this.pauseAudio.bind(this);
    this.stopAudio = this.stopAudio.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256
    // Prefilling the temp audioData array with the value 64 to get a straight
    // line for initial visualisation
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount).fill(128);
    this.pauseButton.current.setAttribute('disabled', 'disabled');
    this.stopButton.current.setAttribute('disabled', 'disabled');
    // Fetch the mp3
    this.fetchAudioBuffer('https://zklinger-photobucket.s3-us-west-2.amazonaws.com/portfolio/danger-storm-by-kevin-macleod.mp3');
    // Start the animation loop that updates the trackTime and audioData array during playback
    this.rafId = requestAnimationFrame(this.tick);
  }
  
  fetchAudioBuffer(url) {
    // Create an async request object
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    // Decode asynchronously
    request.onload = () => {
      this.audioContext.decodeAudioData(request.response, (decodedData) => {
        this.setState(assign({}, this.state, {
          audioBuffer: decodedData,
          audioData: this.dataArray,
          isLoading: false,
          isLoaded: true
        }));
      })
      .catch(err => {
        this.setState(assign({}, this.state, { isLoading: false, isLoaded: false }));
      });
    };
    // Make request for the audio file
    this.setState(assign({}, this.state, { isLoading: true, isLoaded: false }));
    request.send();
  }

  tick() {
    let { isPlaying, onTime, startTime } = this.state;
    // Update audioData array and trackTime if playing
    if (isPlaying) {
      this.analyser.getByteTimeDomainData(this.dataArray);
      this.setState(assign({}, this.state, {
        audioData: this.dataArray,
        trackTime: (isPlaying ? (this.audioContext.currentTime - onTime + startTime) : startTime)
      }));
    }
    this.rafId = requestAnimationFrame(this.tick);
  }

  playAudio() {
    let { startTime } = this.state;

    // Create a new AudioBufferSourceNode on each play
    let audioBufferSourceNode = this.audioContext.createBufferSource();
    audioBufferSourceNode.buffer = this.state.audioBuffer;
    // Connect source node to analyzer
    audioBufferSourceNode.connect(this.analyser);
    // Connect analyzer node to output
    this.analyser.connect(this.audioContext.destination);
    // Start the audio track
    audioBufferSourceNode.start(0, startTime);
    // Update state
    this.setState(assign({}, this.state, {
      audioBufferSourceNode,
      analyser: this.analyser,
      isPlaying: true,
      isPaused: false,
      onTime: this.audioContext.currentTime
    }));
    // Update button states
    this.playButton.current.setAttribute('disabled', 'disabled');
    this.pauseButton.current.removeAttribute('disabled');
    this.stopButton.current.removeAttribute('disabled');
  }

  pauseAudio() {
    let { onTime, audioBufferSourceNode, startTime } = this.state;

    // Stop the audio track and update track variables
    audioBufferSourceNode.stop();
    // Update state
    this.setState(assign({}, this.state, {
      isPlaying: false,
      isPaused: true,
      endTime: this.audioContext.currentTime,
      startTime: (startTime + (this.audioContext.currentTime - onTime))
    }));
    // Update button states
    this.playButton.current.removeAttribute('disabled');
    this.pauseButton.current.setAttribute('disabled', 'disabled');
  }

  stopAudio() {
    let { audioBufferSourceNode } = this.state;

    // Stop the audio track and update track variables
    audioBufferSourceNode.stop(0);
    audioBufferSourceNode.disconnect();
    // Update state
    this.setState(assign({}, this.state, {
      isPlaying: false,
      isPaused: false,
      startTime: 0,
      audioBufferSourceNode: null,
      analyser: null,
      trackTime: 0
    }));
    // Update button states
    this.playButton.current.removeAttribute('disabled');
    this.pauseButton.current.setAttribute('disabled', 'disabled');
    this.stopButton.current.setAttribute('disabled', 'disabled');
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.analyser.disconnect();
    if (this.state.audioBufferSourceNode) {
      this.state.audioBufferSourceNode.disconnect();
    }
  }

  render() {
    return (
      <div id='beatsPlayer'>
        { React.Children.map(this.props.children, child => {
            return React.cloneElement(child, {
              audioData: this.state.audioData,
              audioBuffer: this.state.audioBuffer,
              analyser: this.state.analyser,
              trackTime: this.state.trackTime
            });
          }) }
        <section className="controls">
          <button ref={this.playButton} onClick={this.playAudio}>Play</button>
          <button ref={this.pauseButton} onClick={this.pauseAudio}> || </button>
          <button ref={this.stopButton} onClick={this.stopAudio}>Stop</button>
        </section>
      </div>
    );
  }
}

export default BeatsPlayer;
