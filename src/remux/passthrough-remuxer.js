/**
 * passthrough remuxer
*/
import Event from '../events';

class PassThroughRemuxer {
  constructor (observer) {
    this.observer = observer;
  }

  destroy () {
  }

  resetTimeStamp () {
  }

  resetInitSegment () {
  }

  remux (audioTrack, videoTrack, id3Track, textTrack, timeOffset, contiguous, accurateTimeOffset, rawData) {
    let observer = this.observer;
    let streamType = '';
    if (audioTrack) {
      streamType += 'audio';
    }

    if (videoTrack) {
      streamType += 'video';
    }

    observer.trigger(Event.FRAG_PARSING_DATA, {
      data1: rawData,
      startPTS: timeOffset,
      startDTS: timeOffset,
      type: streamType,
      hasAudio: !!audioTrack,
      hasVideo: !!videoTrack,
      nb: 1,
      dropped: 0
    });

    if (textTrack && textTrack.samples && textTrack.samples.length) {
      this.remuxText(textTrack);
    }

    if (id3Track && id3Track.samples && id3Track.samples.length) {
      this.remuxID3(id3Track);
    }

    // notify end of parsing
    observer.trigger(Event.FRAG_PARSED);
  }

  remuxID3 (track) {
    const { samples, initPTS } = track;

    if (!samples.length) {
      return;
    }

    for (let index = 0; index < samples.length; index++) {
      const sample = samples[index];
      sample.pts = sample.pts / sample.timescale - initPTS;
      sample.dts = sample.dts / sample.timescale - initPTS;
      sample.duration =
        sample.duration != null
          ? sample.duration / sample.timescale
          : undefined;
    }

    this.observer.trigger(Event.FRAG_PARSING_METADATA, {
      samples: track.samples
    });

    track.samples = [];
  }

  remuxText (track) {
    track.samples.sort(function (a, b) {
      return (a.pts - b.pts);
    });

    const length = track.samples.length; let sample;
    const inputTimeScale = track.timescale;
    const initPTS = track.initPTS;
    // consume samples
    if (length && initPTS !== undefined) {
      for (let index = 0; index < length; index++) {
        sample = track.samples[index];
        // setting text pts, dts to relative time
        // using this._initPTS and this._initDTS to calculate relative time
        sample.pts = ((sample.pts - initPTS) / inputTimeScale);
      }
    }

    this.observer.trigger(Event.FRAG_PARSING_USERDATA, {
      samples: track.samples
    });
  }
}

export default PassThroughRemuxer;
