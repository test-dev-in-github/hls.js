
export function sendAddTrackEvent (track: TextTrack, videoEl: HTMLMediaElement) {
  let event: Event;
  try {
    event = new Event('addtrack');
  } catch (err) {
    // for IE11
    event = document.createEvent('Event');
    event.initEvent('addtrack', false, false);
  }
  (event as any).track = track;
  videoEl.dispatchEvent(event);
}

export function clearCurrentCues (track: TextTrack) {
  if (track?.cues) {
    while (track.cues.length > 0) {
      track.removeCue(track.cues[0]);
    }
  }
}

/**
 *  Given a list of Cues, finds the closest cue matching the given time.
 *  Modified verison of binary search O(log(n)).
 *
 * @export
 * @param {(TextTrackCueList | TextTrackCue[])} cues - List of cues.
 * @param {number} time - Target time, to find closest cue to.
 * @returns {TextTrackCue}
 */
export function getClosestCue (cues: TextTrackCueList | TextTrackCue[], time: number): TextTrackCue {
  // If the offset is less than the first element, the first element is the closest.
  if (time < cues[0].endTime) {
    return cues[0];
  }
  // If the offset is greater than the last cue, the last is the closest.
  if (time > cues[cues.length - 1].endTime) {
    return cues[cues.length - 1];
  }

  let left = 0;
  let right = cues.length - 1;

  while (left <= right) {
    const mid = Math.floor((right + left) / 2);

    if (time < cues[mid].endTime) {
      right = mid - 1;
    } else if (time > cues[mid].endTime) {
      left = mid + 1;
    } else {
      // If it's not lower or higher, it must be equal.
      return cues[mid];
    }
  }
  // At this point, left and right have swapped.
  // No direct match was found, left or right element must be the closest. Check which one has the smallest diff.
  return (cues[left].endTime - time) < (time - cues[right].endTime) ? cues[left] : cues[right];
}

export function addCueToTrack (track: TextTrack, cue: VTTCue) {
  // Sometimes there are cue overlaps on segmented vtts so the same
  // cue can appear more than once in different vtt files.
  // This avoid showing duplicated cues with same timecode and text.
  const mode = track.mode;
  if (mode === 'disabled') {
    track.mode = 'hidden';
  }
  if (track.cues && !track.cues.getCueById(cue.id)) {
    try {
      track.addCue(cue);
      if (!track.cues.getCueById(cue.id)) {
        throw new Error(`addCue is failed for: ${cue}`);
      }
    } catch (err) {
      const textTrackCue = new (self.TextTrackCue as any)(
        cue.startTime,
        cue.endTime,
        cue.text
      );
      textTrackCue.id = cue.id;
      track.addCue(textTrackCue);
    }
  }
  if (mode === 'disabled') {
    track.mode = mode;
  }
}
