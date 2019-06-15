import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DemoViz extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  componentDidUpdate() {
    this.draw();
  }

  // Main Draw loop.  This updates the canvas while the clip is playing.
  draw() {
    const { audioData, audioBuffer, analyser, trackTime } = this.props;
    const canvas = this.canvas.current;
    const height = canvas.height;
    const width = canvas.width;
    const canvasCtx = canvas.getContext('2d');

    // Background
    this.drawBG(width, height, canvasCtx);
    // Arc
    this.drawTimerArc(width, height, canvasCtx, audioBuffer, trackTime);
    // Waveform circle
    this.drawPointCircle(width, height, canvasCtx, audioData, analyser, trackTime);
    // Timer
    this.drawTimer(width, height, canvasCtx, trackTime);
  }

  drawBG(width, height, canvasCtx) {
    canvasCtx.fillStyle = 'rgba(42, 42, 42, 1)';
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.lineWidth = 30;
    canvasCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
    canvasCtx.beginPath();
    canvasCtx.arc(width/2, height/2, width/5, Math.PI, Math.PI + (2 * Math.PI));
    canvasCtx.stroke();
  }

  drawTimer(width, height, canvasCtx, trackTime) {
    canvasCtx.font="30px Arial";
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)';
    canvasCtx.textAlign = 'center';
    const timeDisplay = new Date(null);
    timeDisplay.setSeconds(parseInt(trackTime)); // specify value for SECONDS here
    const result = timeDisplay.toISOString().substr(14, 5);
    canvasCtx.fillText(result, width / 2, height / 2 + 10);
  }

  drawTimerArc(width, height, canvasCtx, audioBuffer, trackTime) {
    canvasCtx.lineWidth = 30;
    canvasCtx.strokeStyle = 'rgba(214, 168, 41, 1)';
    const percent_done = trackTime
      ? (trackTime / audioBuffer.duration) / 1
      : 0;
    canvasCtx.beginPath();
    canvasCtx.arc(width/2, height/2, width/5, Math.PI, Math.PI + (2 * Math.PI * percent_done));
    canvasCtx.stroke();
  }

  drawPointCircle(width, height, canvasCtx, audioData, analyser, trackTime) {
    const center_x = width / 2;
    const center_y = height /2;
    let radius = width / 3;
    let segments = 64;
    if (analyser) {
      segments = analyser.fftSize / 2;
    }
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgba(214, 168, 41, 1)';

    const minMax = (seed, min, max) => {
      return seed * (max - min) + min;
    };

    const getX = (angle, distance) => {
      return center_x + radius * Math.cos(-(angle + trackTime * 10) * Math.PI/180) * distance;
    };

    const getY = (angle, distance) => {
      return center_y + radius * Math.sin(-(angle + trackTime * 10) * Math.PI/180) * distance;
    };

    const innerPoints = [];
    const outerPoints = [];

    // Inner Circle
    for (let i = 0; i < segments; i++) {
      innerPoints[i] = { 
        x: getX((-i * (360 / segments)), minMax(audioData[i] / 256, .8, 1.1)),
        y: getY((-i * (360 / segments)), minMax(audioData[i] / 256, .8, 1.1))
      };
    }

    canvasCtx.moveTo(innerPoints[0].x, innerPoints[0].y);
    for (let i = 1; i < segments; i++) {
      canvasCtx.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    canvasCtx.lineTo(innerPoints[0].x, innerPoints[0].y);
    canvasCtx.stroke();
 
    // Outer Circle
    for (let j = 0; j < segments; j++) {
      outerPoints[j] = { 
        x: getX((-j * (360 / segments)), minMax(audioData[j] / 256, .6, 1.3)),
        y: getY((-j * (360 / segments)), minMax(audioData[j] / 256, .6, 1.3))
      };
    }

    canvasCtx.moveTo(outerPoints[0].x, outerPoints[0].y);
    for (let j = 1; j < segments; j++) {
      canvasCtx.lineTo(outerPoints[j].x, outerPoints[j].y);
    }
    canvasCtx.lineTo(outerPoints[0].x, outerPoints[0].y);
    canvasCtx.stroke();
  }

  render() {
    return <canvas width={this.props.width} height={this.props.height} ref={this.canvas} />;
  }
}

DemoViz.propTypes = {
  audioData: PropTypes.object
};

export default DemoViz;
