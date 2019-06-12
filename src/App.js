import React, { Component } from 'react';
import AudioAnalyser from './AudioAnalyser';
import './App.css';


class App extends Component {
  render() {
    return (
      <div className="App">
        <AudioAnalyser/>
      </div>
    );
  }
};

export default App;
