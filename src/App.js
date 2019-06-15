import React, { Component } from 'react';
import BeatsPlayer from './BeatsPlayer';
import AudioVisualiser from './AudioVisualiser';
import DemoViz from './DemoViz';
import './App.css';


class App extends Component {
  render() {
    return (
      <div className="App">
        <section>
          <h1>Web Audio API and HTML Canvas</h1>
          <BeatsPlayer>
            <AudioVisualiser width="600px" height="300px"/>
          </BeatsPlayer>
          <p>

          </p>
        </section>

        <section>
          <BeatsPlayer>
            <DemoViz width="300px" height="300px"/>
          </BeatsPlayer>
        </section>
        
      </div>
    );
  }
};

export default App;
