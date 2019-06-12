import React, { Component } from 'react';
import AudioVisualiser from './AudioVisualiser';

class AudioAnalyser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioBuffer: null,
      audioData: new Uint8Array(0)
    };

    this.tick = this.tick.bind(this);
    this.playAudio= this.playAudio.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const url = 'https://zklinger-photobucket.s3-us-west-2.amazonaws.com/portfolio/time_or_patience_roughmix.mp3';

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = () => {
      this.audioContext.decodeAudioData(request.response, (decodedData) => {
        this.source = this.audioContext.createBufferSource()
        this.source.buffer = decodedData;
        this.source.connect(this.analyser);
        this.analyser.getByteTimeDomainData(this.dataArray);
        this.setState({ 
          audioBuffer: decodedData,
          audioData: this.dataArray });
        this.rafId = requestAnimationFrame(this.tick);
      })
      .catch(err => {
        console.error(err);
      });
    };
    request.send();
  }

  tick() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    this.setState({ 
      audioBuffer: this.state.audioBuffer,
      audioData: this.dataArray });
    this.rafId = requestAnimationFrame(this.tick);
  }
  
  playAudio() {
    const play = document.querySelector('#play');
    const pause = document.querySelector('#pause');
    const stop = document.querySelector('#stop');

    // Each time we play, create a new AudioBufferSourceNode
    this.source = this.audioContext.createBufferSource();
    console.log(this.typeOf(this.source));
    // Connect source node to AudioBuffer from props
    this.source.buffer = this.state.audioBuffer;
    // Connect source node to analyzer
    this.source.connect(this.analyser);
    // this.setState({ audioData: this.dataArray });
    this.rafId = requestAnimationFrame(this.tick);
    // Connect analyzer node to output
    this.analyser.connect(this.audioContext.destination);
    this.source.start(0);

  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.analyser.disconnect();
    this.source.disconnect();
  }

  render() {
    return (
      <div>
        <AudioVisualiser audioData={this.state.audioData} />
        <button id="play" onClick={this.playAudio}>Play</button>
        <button id="pause" onClick={this.pauseAudio}> || </button>
        <button id="stop" onClick={this.stopAudio}>Stop</button>
      </div>
    );
  }
}

export default AudioAnalyser;
