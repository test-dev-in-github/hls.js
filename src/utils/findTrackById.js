export const findTrackById = (tracks, trackId) => {
  for (const track of tracks) {
    if (track.id === trackId) {
      return track;
    }
  }
};
