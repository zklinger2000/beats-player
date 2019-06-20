# beats-player

See a live [demo]('https://zklinger.com/beats-player')

# The Web Audio API and HTML Canvas

#### June 6th, 2019

A quick breakdown of what we're doing.

- Downloading a music file from our S3 bucket on AWS
- Processing that audio file so we can get its current waveform into an array of numbers we can play with.
- Whenever the audio file is playing have the array constantly
updating so we can drive some animation (here we're using Canvas,
but you could easily use something like D3 or just plain CSS).
- Put all of this into a reusable React component that can easily
swap in different visualizations.

For reference, you should read the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API" target="_blank" rel="noopener noreferrer">
Web audio concepts and usage</a> section from the Web Audio API page
on Mozilla. Now let's break down the React component.

## `<BeatsPlayer>`

## constructor

```javascript
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
```

### State

- `isLoading, isLoaded, isPlaying, isPaused`
These are our basic player state descriptors.  They are used
to drive certain internal logic, like when the buttons can be
pressed or to drive some CSS classes (not shown here).
- `startTime, onTime, endTime, trackTime`
Here's where it starts to get funky... `AudioContext.currentTime` does
not give you the time of the track you are playing. From the docs, `currentTime`:
  > Returns a double representing an ever-increasing hardware time in seconds used 
    for scheduling. It starts at 0.
                  
  These values are used to determine
pause/resume times for playing the tracks and to give us the 
current `trackTime` in seconds for display purposes.
- `audioBufferSourceNode, audioBuffer, analyser`
These are the audio nodes we plug together to play our track and decode our audio
into data we can use.
- `audioData`
This is a `Uint8Array` that holds our decoded audio buffer.
Essentially, it's a list of numbers representing the decibal value per
segment of the waveform at a particular moment. `[needs explanation]`
### Buttons refs
Adding DOM references to the playback buttons using `React.createRef()`.
### Binding Methods
Bind `this` to our current context so we can pass stuff around.


## componentDidMount

```javascript
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
  this.fetchAudioBuffer('{YOUR MP3 FILE}');
  // Start the animation loop that updates the trackTime and audioData array during playback
  this.rafId = requestAnimationFrame(this.tick);
}
```

Here we create the audio nodes, initialize our component buttons, fetch the mp3 and
start our animation. The line `this.rafId = requestAnimationFrame(this.tick)` is
a recursive function call that keeps the draw loop going for our visualizations.
I'm using an `XMLHttp Request` to fetch the file, which we'll explore next.


## fetchAudioBuffer

```javascript
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
```

You can find a good article on the use of the XMLHttpRequest object in Javascript
for downloading files <a href="https://www.html5rocks.com/en/tutorials/file/xhr2/"
target="_blank" rel="noopener noreferrer">here</a>.  
In the `onload()` event's callback, we decode the file into 
an `AudioBuffer` object.  Save it along with an empty data array into 
our `state` object so we can pass them into our visualization
components later.


## tick

```javascript
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
```

This is the recursive call that gets set up on mount and whenever an audio file
gets played.
Notice how we are using the `analyser` node. We pass in the `dataArray` to
be updated with the "current" waveform being played in the file, then update our `state`.
That last line where we pass `tick()` from within `requestAnimationFrame` is the
recursive magic. It will keep updating the `dataArray` on the next frame, and then
the next, and the next... until we cancel it in the `stopAudio()` method or
when the component gets unmounted.


`// TODO: trackTime algorithm`


### render

```javascript
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
```

Here is where we make this thing "reusable" for different animations.
The `BeatsPlayer` component doesn't actually draw anything, it simply
wraps around our visualisation nodes and passes down to them the items needed
to create some animations.<br/>
`React.Children.map()` is how we are passing
these props down to any nested, or "child", components.  These props are:

- audioBuffer
- analyser
- audioData
- timeTrack

From these pieces we have all the things we need to make visually
stunning canvas animations.


`// TODO: Visuaization Components`


## References

https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

https://www.html5rocks.com/en/tutorials/file/xhr2/

https://github.com/philnash/react-web-audio

Music from https://filmmusic.io:
"Danger Storm" by Kevin MacLeod (https://incompetech.com)
Licence: CC BY (http://creativecommons.org/licenses/by/4.0/)
