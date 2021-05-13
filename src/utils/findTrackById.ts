interface Track {
  id: number;
}

export const findTrackById = (tracks: Track[], trackId: number) => {
  for (const track of tracks) {
    if (track.id === trackId) {
      return track;
    }
  }
};
