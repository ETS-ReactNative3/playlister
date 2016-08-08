var shuffle = require('shuffle-array')
var mb = require('../utils/musicbrainz')
var recording = require('./recording')

module.exports = function (props) {
  props.currentIndex = 0

  props.findAllTracks = function (callback) {
    mb.searchRecordings('arid:' + props.id + ' AND type:album', { limit: 1 }, function(err, result) {
      if (err)
        return setTimeout(function () { props.findAllTracks(callback) }, 1000)

      props.tracksCount = result.count
      props.shuffle()

      if (callback)
        callback()
    })
  }

  props.shuffle = function () {
    var tracks = []
    for (var i = 0; i < props.tracksCount; i++)
      tracks[i] = i
    props.tracks = shuffle(tracks)
  }

  props.getNextTrack = function (callback) {
    if (!props.tracks) {
      return props.findAllTracks(function () {
        props.getNextTrack(callback)
      })
    }

    var nextTrack = props.tracks[props.currentIndex]
    if (nextTrack && isNaN(nextTrack)) {
      return setTimeout(function () {
        props.currentIndex++
        callback(nextTrack)
      })
    }

    mb.searchRecordings('arid:' + props.id, { limit: 1, offset: nextTrack }, function (err, result) {
      if (err || !result || !result.recordings) {
        return setTimeout(function () {
          props.getNextTrack(callback)
        }, 1000)
      }

      var track = result.recordings[0]
      track.artistName = props.name
      track = recording(track)
      props.tracks[nextTrack] = track
      props.currentIndex++
      callback(track)
    })
  }

  return props
}