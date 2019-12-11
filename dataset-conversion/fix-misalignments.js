const fs = require('fs');
const path = require('path')

//const corpusDir = "C:/Users/Chris/Downloads/SWC-Processed/";
const corpusDir = "../SWC-Processed/";

const langs = [
  "english",
  "german"
]

for (let lang of langs) {
  const langPath = path.join(corpusDir, lang)
  for (let speaker of fs.readdirSync(langPath)) {
    const speakerPath = path.join(langPath, speaker)
    for (let article of fs.readdirSync(speakerPath)) {
      const articlePath = path.join(speakerPath, article)
      const alignmentTxtPath = path.join(articlePath, `${speaker}-${article}.alignment.txt`)
      if (!fs.existsSync(alignmentTxtPath))
        continue;

      const alignmentTxt = fs.readFileSync(
        alignmentTxtPath,
        {
          encoding: 'utf-8'
        }
      );

      const alignment = []
      let rewriteFlag = false

      for (let line of alignmentTxt.split('\n')) {
        const [, wordsRaw, timesRaw] = line.split(' ');

        try {
          const words = wordsRaw.replace(/"/g, '').split(',')
          const times = timesRaw.replace(/"/g, '').split(',')

          let nanFlag = false;

          for (let time of times) {
            if (isNaN(time) || time === '') {
              nanFlag = true;
              break;
            }
          }

          if (words.length !== times.length || nanFlag) {
            rewriteFlag = true;
          }
          else {
            alignment.push(line);
          }
        }
        catch {
          fs.rmdirSync(articlePath, {
            recursive: true,
          })

        }
      }

      if (rewriteFlag) {
        fs.writeFileSync(alignmentTxtPath, alignment.join('\n'), {
          encoding: 'utf-8'
        })
      }
    }
  }
}
