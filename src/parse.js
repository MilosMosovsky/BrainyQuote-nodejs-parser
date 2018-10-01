import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import { createObjectCsvWriter } from 'csv-writer'

const csvWriter = createObjectCsvWriter({
  path: 'output/output.csv',
  header: ['quote']
})

const TOTAL_PAGES = 10

const TOPICS = {
  BUSSINESS: 't:132568',
  LIFE: 't:132584',
  MOTIVATIONAL: 't:132622'
}

function buildBody (page = 1, topic = TOPICS.BUSSINESS) {
  return JSON.stringify({
    typ: 'topic',
    langc: 'en',
    v: '8.4.1:2962932',
    ab: 'b',
    pg: page,
    id: topic,
    vid: '758c0d77bd02e19d921362183e69f763',
    fdd: 'd',
    m: 0
  })
}

function parseQuote (quoteBody) {
  return quoteBody.childNodes[0].rawText
}

function getPageForCategory (page = 1, category = TOPICS.BUSSINESS) {
  return new Promise((resolve, reject) => {
    fetch('https://www.brainyquote.com/api/inf', {
      method: 'POST',
      body: buildBody(page, category)
    })
      .then(res => res.json())
      .then(res => {
        const html = parse(res.content)
        const quotes = html.querySelectorAll('a')

        quotes.forEach(quoteBody => {
          if (quoteBody.classNames.includes('b-qt')) {
            const quote = parseQuote(quoteBody)
            finalQuotes.push({
              quote
            })
          }
        })
        resolve()
      })
  })
}

const finalQuotes = []
const promises = []

for (let i = 1; i <= TOTAL_PAGES; i++) {
  promises.push(getPageForCategory(i, TOPICS.BUSSINESS))
}

Promise.all(promises).then(() => {
  csvWriter
    .writeRecords(finalQuotes) // returns a promise
    .then(() => {
      console.log(`${finalQuotes.length} quotes written to output/output.csv`)
    })
})
