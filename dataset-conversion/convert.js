const fs = require('fs');
const path = require('path')
const { execSync } = require('child_process');

// from StackOverflow
Number.prototype.pad = function (size) {
  var s = String(this);
  while (s.length < (size || 2)) { s = "0" + s; }
  return s;
}

const maxAudioLength = 20
const maxPauseLength = 1

// ffmpeg -y -i audio.ogg -c:a flac -ar 16000 -sample_fmt s16 -ss 10 -t 1.560 half1.flac

const outDir = "C:/Users/Chris/Downloads/SWC-Processed/";

const alignmentRegEx = /<n pronunciation="([^"]*)" start="([^"]*)" end="([^"]*)"/gm

const corpusRoot = "C:/Users/Chris/Downloads/";
const languages = [
  // "english",
  "german"
];

for (let language of languages) {
  const articles = fs.readdirSync(path.join(corpusRoot, language));
  let articleCount = 0
  let speakersCount = 0

  const speakers = {}

  for (let article of articles) {
    try {

      const articlePath = path.join(corpusRoot, language, article)
      if (!fs.existsSync(path.join(articlePath, 'audio.ogg'))) {
        console.log('audio.ogg not found! article: ' + article)
        continue;
      }
      const info = JSON.parse(fs.readFileSync(path.join(articlePath, 'info.json')))
      let speaker;
      try {
        speaker = info.audio_file_parsed.reader.replace(' ', '_')
      }
      catch {
        console.log('speaker not found! article: ' + article)
        continue;
      }

      if (speakers[speaker]) {
        speaker = speakers[speaker]
      }
      else {
        speakers[speaker] =
          'g' +
          speakersCount.toString()
        speaker =
          'g' +
          speakersCount.toString()
        speakersCount++;
      }

      const currentOutDir = path.join(outDir, language, speaker, articleCount.toString())
      const outFilePrefix = speaker + '-' + articleCount
      if (!fs.existsSync(currentOutDir)) {
        fs.mkdirSync(currentOutDir, {
          recursive: true
        });
      }

      const alignmentXML = fs.readFileSync(path.join(articlePath, 'aligned.swc'), {
        encoding: 'utf-8'
      })
      const alignmentMatches = alignmentXML.matchAll(alignmentRegEx)
      const alignments = []

      for (let match of alignmentMatches) {
        const alignment = {
          word: match[1],
          start: parseInt(match[2]) / 1000,
          end: parseInt(match[3]) / 1000
        }
        alignments.push(alignment)
      }

      let audioCount = 0;
      const alignmentTxt = []

      let alignmentWords = ['']
      let alignmentEndTimes = []
      let currentAudioStart = 0
      let currentAudioLength = 0

      for (let i = 0; i < alignments.length; i++) {
        // break;
        if (currentAudioLength >= maxAudioLength) {
          // split
          const nextAudioStart = alignmentEndTimes[alignmentEndTimes.length - 1]
          const filename = outFilePrefix + '-' + audioCount.pad(4)
          const alignment = filename + ' "' + alignmentWords.join(',').toUpperCase() + '," "' + alignmentEndTimes.join(',') + `,${alignmentEndTimes[alignmentEndTimes.length - 1]}"`
          alignmentTxt.push(alignment)
          if (!fs.existsSync(path.join(currentOutDir, (filename + '.flac'))))
            execSync(`ffmpeg -y -i ${path.join(articlePath, 'audio.ogg')} -c:a flac -ar 16000 -sample_fmt s16 -ss ${currentAudioStart} -t ${currentAudioLength} ${path.join(currentOutDir, (filename + '.flac'))}`)
          audioCount++;
          currentAudioLength = 0
          currentAudioStart = nextAudioStart
          alignmentWords = ['']
          alignmentEndTimes = []
        }

        if (currentAudioLength === 0) {
          if (alignments[i].start - currentAudioStart >= maxPauseLength) {
            currentAudioStart = alignments[i].start
          }
          alignmentEndTimes.push((alignments[i].start - currentAudioStart).toFixed(3))
        }
        else if (alignments[i].start !== alignments[i - 1].end) {
          const pauseLength = alignments[i].start - alignments[i - 1].end
          if (pauseLength >= maxPauseLength) {
            // split
            const filename = outFilePrefix + '-' + audioCount.pad(4)
            const alignment = filename + ' "' + alignmentWords.join(',').toUpperCase() + '," "' + alignmentEndTimes.join(',') + `,${alignmentEndTimes[alignmentEndTimes.length - 1]}"`
            alignmentTxt.push(alignment)

            if (!fs.existsSync(path.join(currentOutDir, (filename + '.flac'))))
              execSync(`ffmpeg -y -i ${path.join(articlePath, 'audio.ogg')} -c:a flac -ar 16000 -sample_fmt s16 -ss ${currentAudioStart} -t ${currentAudioLength} ${path.join(currentOutDir, (filename + '.flac'))}`)
            audioCount++;
            currentAudioLength = 0
            currentAudioStart = alignments[i].start
            alignmentWords = ['']
            alignmentEndTimes = ['0.000']
            // break;
          }
          else {
            alignmentWords.push('')
            alignmentEndTimes.push((alignments[i].start - currentAudioStart).toFixed(3))
            currentAudioLength += pauseLength
          }
        }

        alignmentWords.push(alignments[i].word)
        alignmentEndTimes.push((alignments[i].end - currentAudioStart).toFixed(3))
        currentAudioLength += alignments[i].end - alignments[i].start
      }

      const filename = outFilePrefix + '-' + audioCount.pad(4)
      const alignment = filename + ' "' + alignmentWords.join(',').toUpperCase() + '," "' + alignmentEndTimes.join(',') + `,${alignmentEndTimes[alignmentEndTimes.length - 1]}"`
      alignmentTxt.push(alignment)
      if (!fs.existsSync(path.join(currentOutDir, (filename + '.flac'))))
        execSync(`ffmpeg -y -i ${path.join(articlePath, 'audio.ogg')} -c:a flac -ar 16000 -sample_fmt s16 -ss ${currentAudioStart} -t ${currentAudioLength} ${path.join(currentOutDir, (filename + '.flac'))}`)
      if (!fs.existsSync(path.join(currentOutDir, (outFilePrefix + '.alignment.txt'))))
        fs.writeFileSync(path.join(currentOutDir, (outFilePrefix + '.alignment.txt')), alignmentTxt.join('\n'), {
          encoding: 'utf-8'
        })

      articleCount++;
    }
    catch {
      console.log('could not process article: ' + article)
      articleCount++;
      continue;
    }
  }
}